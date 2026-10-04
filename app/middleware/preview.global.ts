/**
 * The static preview (runtimeConfig.public.preview) has no server, so the
 * host side is not open: sign-in, the dashboard, the TV link and the phone
 * half of the TV try all lead to /mula, which says so.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!useRuntimeConfig().public.preview) return;
  if (to.path === '/masuk' || to.path === '/app' || to.path.startsWith('/app/') || to.path.startsWith('/tv/') || to.path === '/contoh/cuba') {
    return navigateTo({ path: '/mula', query: to.query.lang === 'en' ? { lang: 'en' } : {} }, { replace: true });
  }
});
