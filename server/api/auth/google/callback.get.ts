import { createSession, findOrCreateUser } from '../../../utils/session';

export default defineEventHandler(async (event) => {
  const { google, public: pub } = useRuntimeConfig();
  const q = getQuery(event);
  let saved: { state: string; next: string } | null = null;
  try { saved = JSON.parse(getCookie(event, 'indahnya_oauth') || 'null'); } catch { /* ignore */ }
  deleteCookie(event, 'indahnya_oauth', { path: '/' });
  if (!saved || saved.state !== q.state || !q.code) return sendRedirect(event, '/masuk?error=google');

  const tokenRes = await $fetch<{ id_token: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code: String(q.code), client_id: google.clientId, client_secret: google.clientSecret,
      redirect_uri: `${pub.siteUrl}/api/auth/google/callback`, grant_type: 'authorization_code',
    }),
  });
  // The id_token is signed by Google and was just handed to us over TLS from
  // Google's token endpoint in exchange for a one-time code: decoding without
  // re-verifying the signature is the standard server-side code flow.
  const payload = JSON.parse(Buffer.from(tokenRes.id_token.split('.')[1]!, 'base64url').toString()) as { sub: string; email: string; name?: string; email_verified?: boolean };
  if (!payload.email_verified) return sendRedirect(event, '/masuk?error=google');
  const user = await findOrCreateUser(payload.email, payload.name, payload.sub);
  await createSession(event, user.id);
  return sendRedirect(event, saved.next || '/app');
});
