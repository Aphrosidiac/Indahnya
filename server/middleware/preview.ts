/**
 * Before launch the real server runs with NUXT_PUBLIC_PREVIEW=true, like the
 * static Pages preview: guests can open the sample majlis, but the host side
 * is not open. app/middleware/preview.global.ts sends the pages to /mula; this
 * closes the doors behind them, so nobody signs in (and nothing reaches
 * CHIP before payments are switched on) by calling the API directly. The TV try on
 * the landing stays in the browser in preview, so its upload route closes too.
 */
export default defineEventHandler((event) => {
  if (!useRuntimeConfig().public.preview) return;
  const path = (event.node.req.url ?? '').split('?')[0]!;
  if (path.startsWith('/api/auth/') || path === '/api/cuba' || path.startsWith('/api/chip/')) {
    throw createError({ statusCode: 403, statusMessage: 'Indahnya is not open yet' });
  }
});
