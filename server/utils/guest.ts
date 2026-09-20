import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb, guests } from '../db';
import { newId, newToken } from './ids';

const COOKIE = 'indahnya_g';

/**
 * A guest is a cookie. One token per browser per event, minted on first
 * contact so "gambar saya" and a 24-hour self-delete work without an account.
 */
export async function ensureGuest(event: H3Event, eventId: string) {
  const db = useDb();
  const jar = readJar(event);
  const token = jar[eventId];
  if (token) {
    const [g] = await db.select().from(guests).where(eq(guests.token, token));
    if (g && g.eventId === eventId) return g;
  }
  const fresh = newToken();
  const [g] = await db.insert(guests).values({ id: newId(), eventId, token: fresh }).returning();
  jar[eventId] = fresh;
  writeJar(event, jar);
  return g!;
}

export async function currentGuest(event: H3Event, eventId: string) {
  const token = readJar(event)[eventId];
  if (!token) return null;
  const [g] = await useDb().select().from(guests).where(eq(guests.token, token));
  return g && g.eventId === eventId ? g : null;
}

function readJar(event: H3Event): Record<string, string> {
  try { return JSON.parse(getCookie(event, COOKIE) || '{}'); } catch { return {}; }
}
function writeJar(event: H3Event, jar: Record<string, string>) {
  // keep the newest 12 events so the cookie never outgrows 4 KB
  const entries = Object.entries(jar).slice(-12);
  setCookie(event, COOKIE, JSON.stringify(Object.fromEntries(entries)), { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/', maxAge: 400 * 86400 });
}
