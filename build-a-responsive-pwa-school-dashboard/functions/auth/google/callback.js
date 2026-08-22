const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

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

async function encryptSession(payload, secret) {
  const key = await encryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return base64UrlEncode(combined);
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.KNOLL_SESSION_SECRET) {
    return new Response('Google OAuth is not fully configured in Cloudflare.', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const savedState = getCookie(request, 'knoll_oauth_state');

  if (!code || !returnedState || !savedState || returnedState !== savedState) {
    return new Response('Invalid or expired Google OAuth request.', { status: 400 });
  }

  const redirectUri = new URL('/auth/google/callback', request.url).toString();
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    console.error('Google token exchange failed:', details);
    return new Response('Google sign-in could not be completed.', { status: 502 });
  }

  const tokens = await tokenResponse.json();
  if (!tokens.refresh_token) {
    return new Response('Google did not provide a refresh token. Please try connecting again.', { status: 400 });
  }

  let profile = {};
  if (tokens.access_token) {
    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (profileResponse.ok) profile = await profileResponse.json();
  }

  const session = await encryptSession({
    refreshToken: tokens.refresh_token,
    email: profile.email || '',
    name: profile.name || '',
    picture: profile.picture || ''
  }, env.KNOLL_SESSION_SECRET);

  const headers = new Headers({ Location: '/#classroom' });
  headers.append('Set-Cookie', 'knoll_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  headers.append('Set-Cookie', `knoll_classroom_session=${session}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);

  return new Response(null, { status: 302, headers });
}
