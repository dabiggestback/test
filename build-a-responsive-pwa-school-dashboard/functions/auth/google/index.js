const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet(context) {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  if (!clientId) return new Response('Google OAuth is not configured.', { status: 500 });

  const state = randomState();
  const redirectUri = new URL('/auth/google/callback', context.request.url).toString();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
    ].join(' ')
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GOOGLE_AUTH_URL}?${params}`,
      'Set-Cookie': `knoll_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`
    }
  });
}
