import { eq } from 'drizzle-orm';
import { useDb, events, slugHistory } from '../db';

export function slugify(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

/** Paths the app owns (pages, routes, public folders); a majlis can never take one. */
export const RESERVED = new Set([
  'app', 'api', 'masuk', 'keluar', 'tv', 'harga', 'contoh', 'blog', 'admin', 'g', 'e', 'assets', '_nuxt',
  'privasi', 'terma', 'tentang', 'bantuan', 'login', 'logout', 'static', 'media', 'embed', 'auth', 'stripe', 'chip',
  'mula', 'landing', 'cuba', 'about', 'privacy', 'terms', 'help', 'health', 'sitemap', 'robots', 'favicon',
]);

/** Is the slug free for a new majlis? Never if it is reserved, in use, or was ever given up by another event. */
export async function slugTaken(slug: string, exceptEventId?: string) {
  if (RESERVED.has(slug)) return true;
  const db = useDb();
  const [live] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
  if (live && live.id !== exceptEventId) return true;
  const [old] = await db.select({ eventId: slugHistory.eventId }).from(slugHistory).where(eq(slugHistory.slug, slug));
  return !!old && old.eventId !== exceptEventId;
}

/** A Postgres unique-violation: two requests took the same slug in the same instant. */
export const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === '23505' || (e as { cause?: { code?: string } })?.cause?.code === '23505';
