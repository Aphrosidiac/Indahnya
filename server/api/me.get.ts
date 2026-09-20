import { currentUser } from '../utils/session';
export default defineEventHandler(async (event) => {
  const u = await currentUser(event);
  const { google } = useRuntimeConfig();
  return { user: u ? { id: u.id, email: u.email, name: u.name } : null, googleEnabled: !!google.clientId };
});
