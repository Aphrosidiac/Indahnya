import { newToken } from '../../../utils/ids';

export default defineEventHandler((event) => {
  const { google, public: pub } = useRuntimeConfig();
  if (!google.clientId) throw createError({ statusCode: 501, statusMessage: 'Google belum disambung' });
  const state = newToken();
  const next = (getQuery(event).next as string) || '/app';
  setCookie(event, 'indahnya_oauth', JSON.stringify({ state, next }), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', google.clientId);
  u.searchParams.set('redirect_uri', `${pub.siteUrl}/api/auth/google/callback`);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', state);
  u.searchParams.set('prompt', 'select_account');
  return sendRedirect(event, u.toString());
});
