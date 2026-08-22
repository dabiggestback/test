const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CLASSROOM_API = 'https://classroom.googleapis.com/v1';

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function encryptionKey(secret) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function decryptSession(value, secret) {
  const bytes = base64UrlDecode(value);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const key = await encryptionKey(secret);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function refreshAccessToken(env, refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error('token-refresh-failed');
  return response.json();
}

async function classroomGet(path, accessToken) {
  const response = await fetch(`${CLASSROOM_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { error: text }; }
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'Classroom request failed');
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const sessionCookie = getCookie(request, 'knoll_classroom_session');
  if (!sessionCookie) {
    return Response.json({ connected: false });
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.KNOLL_SESSION_SECRET) {
    return Response.json({ connected: false, error: 'Google Classroom is not configured yet.' }, { status: 500 });
  }

  try {
    const session = await decryptSession(sessionCookie, env.KNOLL_SESSION_SECRET);
    const token = await refreshAccessToken(env, session.refreshToken);
    const coursesResponse = await classroomGet('/courses?pageSize=100', token.access_token);
    const courses = (coursesResponse.courses || []).filter(course => course.courseState === 'ACTIVE');

    const assignments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const course of courses.slice(0, 12)) {
      const courseworkResponse = await classroomGet(`/courses/${encodeURIComponent(course.id)}/courseWork?pageSize=50&orderBy=updateTime%20desc`, token.access_token);
      for (const item of courseworkResponse.courseWork || []) {
        if (item.workType !== 'ASSIGNMENT' || !item.dueDate) continue;
        const due = new Date(Date.UTC(item.dueDate.year, item.dueDate.month - 1, item.dueDate.day));
        if (due < today) continue;
        assignments.push({
          id: item.id,
          courseId: course.id,
          courseName: course.name || 'Classroom course',
          title: item.title || 'Untitled assignment',
          description: item.description || '',
          alternateLink: item.alternateLink || '',
          dueDate: item.dueDate || null,
          dueTime: item.dueTime || null,
          state: item.state || 'PUBLISHED',
          updateTime: item.updateTime || ''
        });
      }
    }

    assignments.sort((a, b) => {
      const dateA = a.dueDate ? `${a.dueDate.year}-${String(a.dueDate.month).padStart(2, '0')}-${String(a.dueDate.day).padStart(2, '0')}` : '9999-99-99';
      const dateB = b.dueDate ? `${b.dueDate.year}-${String(b.dueDate.month).padStart(2, '0')}-${String(b.dueDate.day).padStart(2, '0')}` : '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    return Response.json({
      connected: true,
      user: { name: session.name, email: session.email, picture: session.picture },
      courses: courses.map(course => ({ id: course.id, name: course.name, section: course.section || '' })),
      assignments: assignments.slice(0, 50)
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Classroom API error:', error);
    if (error.status === 401 || error.status === 403 || error.message === 'token-refresh-failed') {
      return Response.json({ connected: false, needsReconnect: true, error: 'Your Google Classroom connection needs to be renewed.' }, { status: 401 });
    }
    return Response.json({ connected: true, error: 'We could not load Google Classroom right now.' }, { status: 502 });
  }
}
