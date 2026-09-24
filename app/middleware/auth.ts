import { useAuth } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  await auth.restore();
  if (!auth.user) return navigateTo({ path: '/masuk', query: { next: to.fullPath } });
});
