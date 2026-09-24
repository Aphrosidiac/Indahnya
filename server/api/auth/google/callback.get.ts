import { createSession, findOrCreateUser } from '../../../utils/session';

export default defineEventHandler(async (event) => {
  const { google, public: pub } = useRuntimeConfig();
  const q = getQuery(event);
  let saved: { state: string; next: string } | null = null;
  try { saved = JSON.parse(getCookie(event, 'indahnya_oauth') || 'null'); } catch { /* ignore */ }
  deleteCookie(event, 'indahnya_oauth', { path: '/' });
  if (!saved || typeof q.state !== 'string' || saved.state !== q.state || !q.code) return sendRedirect(event, '/masuk?error=google');

  let idToken: string;
  try {
    const tokenRes = await $fetch<{ id_token: string }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code: String(q.code), client_id: google.clientId, client_secret: google.clientSecret,
        redirect_uri: `${pub.siteUrl}/api/auth/google/callback`, grant_type: 'authorization_code',
      }),
    });
    idToken = tokenRes.id_token;
  } catch (e) {
    console.error('[google] token exchange', (e as Error).message);
    return sendRedirect(event, '/masuk?error=google');
  }
  // The id_token came straight from Google's token endpoint over TLS in
  // exchange for a one-time code, so its signature is not re-verified here
  // (the standard server-side code flow). The audience and issuer still are.
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1]!, 'base64url').toString()) as { sub: string; email: string; name?: string; email_verified?: boolean; aud?: string; iss?: string };
  const issOk = payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com';
  if (!payload.email_verified || payload.aud !== google.clientId || !issOk) return sendRedirect(event, '/masuk?error=google');
  const user = await findOrCreateUser(payload.email, payload.name, payload.sub);
  await createSession(event, user.id);
  return sendRedirect(event, safeNext(saved.next));
});
