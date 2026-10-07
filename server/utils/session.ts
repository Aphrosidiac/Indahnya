import type { H3Event } from 'h3';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { useDb, sessions, users, events, eventMembers } from '../db';
import { newId, newToken, tokenHash } from './ids';

const COOKIE = 'indahnya_s';
const TTL = 90 * 86_400_000;

export async function createSession(event: H3Event, userId: string) {
  const db = useDb();
  const token = newToken();
  // the table holds the hash; only the browser holds the token
  await db.insert(sessions).values({ id: tokenHash(token), userId, expiresAt: new Date(Date.now() + TTL) });
  setCookie(event, COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/', maxAge: TTL / 1000 });
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE);
  if (token) await useDb().delete(sessions).where(eq(sessions.id, tokenHash(token)));
  deleteCookie(event, COOKIE, { path: '/' });
}

export async function currentUser(event: H3Event) {
  if (event.context.user !== undefined) return event.context.user;
  const token = getCookie(event, COOKIE);
  let user = null;
  if (token) {
    const [row] = await useDb().select({ u: users }).from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, tokenHash(token)), gt(sessions.expiresAt, new Date()), isNull(users.deletedAt)));
    user = row?.u ?? null;
  }
  event.context.user = user;
  return user;
}

export async function requireUser(event: H3Event) {
  const u = await currentUser(event);
  if (!u) throw createError({ statusCode: 401, statusMessage: 'Sila log masuk' });
  return u;
}

/**
 * A host may act on an event they own or co-host. Returns the event row.
 * A deleted majlis is gone for its hosts too: its id answers 404.
 */
export async function requireEventAccess(event: H3Event, eventId: string) {
  const u = await requireUser(event);
  const db = useDb();
  const [ev] = await db.select().from(events).where(eq(events.id, eventId));
  if (!ev || ev.deletedAt) throw createError({ statusCode: 404, statusMessage: 'Majlis tak jumpa' });
  if (ev.ownerId !== u.id) {
    const [m] = await db.select().from(eventMembers).where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.userId, u.id)));
    if (!m) throw createError({ statusCode: 403, statusMessage: 'Bukan majlis anda' });
  }
  return { user: u, ev };
}

export async function findOrCreateUser(email: string, name?: string, googleSub?: string) {
  const db = useDb();
  const lower = email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, lower));
  if (existing) {
    if ((googleSub && !existing.googleSub) || (name && !existing.name)) {
      const [u] = await db.update(users).set({ googleSub: existing.googleSub ?? googleSub, name: existing.name ?? name }).where(eq(users.id, existing.id)).returning();
      return u!;
    }
    return existing;
  }
  const [u] = await db.insert(users).values({ id: newId(), email: lower, name, googleSub }).returning();
  return u!;
}
