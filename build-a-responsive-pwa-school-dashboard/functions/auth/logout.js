export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/#classroom',
      'Set-Cookie': 'knoll_classroom_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
    }
  });
}
