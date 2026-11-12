import type { H3Event } from 'h3';
import { and, eq, isNull } from 'drizzle-orm';
import { useDb, users, trafficStaffIps } from '../../db';
import { currentUser } from '../session';
import { clientIp } from '../rate';
import { trafficConfig, isStaffEmail } from './config';
import { FT_COOKIE, signupFields } from './channel';

/**
 * Staff = a signed-in user whose email is in NUXT_STAFF_EMAILS. Both sign-in methods prove the mailbox (a spent
 * magic link, Google's verified email), so the match on the stored email is enough; nothing the browser sends is
 * consulted. 401 when signed out, 404 (not 403) when signed in but not staff: the endpoint does not announce itself.
 */
export async function requireStaff(event: H3Event) {
  const u = await currentUser(event);
  if (!u) throw createError({ statusCode: 401, statusMessage: 'Sila log masuk' });
  if (!isStaffEmail(trafficConfig(useRuntimeConfig()), u.email)) throw createError({ statusCode: 404, statusMessage: 'Not found' });
  return u;
}

/**
 * Called right after a sign-in succeeds (magic link, Google), with the user findOrCreateUser returned:
 * - a staff user's IP is remembered, so their browsing in the next 30 days is class `staff`, not a customer's;
 * - a person who has only just been created gets where they first came from (the first-visit cookie).
 * Never throws: analytics must not break signing in.
 */
export async function afterSignIn(event: H3Event, user: typeof users.$inferSelect) {
  try {
    const cfg = trafficConfig(useRuntimeConfig());
    const db = useDb();
    if (isStaffEmail(cfg, user.email)) {
      const ip = clientIp(event);
      if (ip && ip !== 'unknown') await db.insert(trafficStaffIps).values({ ip }).onConflictDoUpdate({ target: trafficStaffIps.ip, set: { seenAt: new Date() } });
    }
    if (!user.signupChannel && !user.signupLanding && Date.now() - user.createdAt.getTime() < 2 * 60_000) {
      const f = signupFields(getCookie(event, FT_COOKIE));
      if (f) await db.update(users).set(f).where(and(eq(users.id, user.id), isNull(users.signupChannel), isNull(users.signupLanding)));
    }
  } catch (e) { console.error('[traffic] after sign-in:', (e as Error).message); }
}
