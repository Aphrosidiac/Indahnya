import { and, desc, eq, lt, inArray, sql } from 'drizzle-orm';
import { useDb, media, guests, reactions } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { currentGuest } from '../../../../utils/guest';
import { publicUrl } from '../../../../utils/storage';

/**
 * The gallery feed. Only `ready` media, newest first, 40 a page. Each item
 * carries the reaction tallies and which one this browser gave, plus
 * whether this browser may still delete it.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const q = getQuery(event);
  const me = await currentGuest(event, ev.id);
  const limit = Math.min(Number(q.limit) || 40, 100);
  const where = [eq(media.eventId, ev.id), eq(media.status, 'ready')];
  if (typeof q.cursor === 'string' && q.cursor) where.push(lt(media.id, q.cursor));
  if (q.mine === '1') { if (!me) return { items: [], next: null }; where.push(eq(media.guestId, me.id)); }
  const db = useDb();
  const rows = await db.select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(...where)).orderBy(desc(media.id)).limit(limit + 1);
  const page = rows.slice(0, limit);
  const ids = page.map(r => r.m.id);
  const tallies = ids.length
    ? await db.select({ mediaId: reactions.mediaId, kind: reactions.kind, n: sql<number>`count(*)` }).from(reactions)
      .where(inArray(reactions.mediaId, ids)).groupBy(reactions.mediaId, reactions.kind)
    : [];
  const mine = ids.length && me
    ? await db.select({ mediaId: reactions.mediaId, kind: reactions.kind }).from(reactions)
      .where(and(inArray(reactions.mediaId, ids), eq(reactions.guestId, me.id)))
    : [];
  const tallyBy: Record<string, Record<string, number>> = {};
  for (const t of tallies) (tallyBy[t.mediaId] ??= {})[t.kind] = Number(t.n);
  const mineBy = Object.fromEntries(mine.map(m => [m.mediaId, m.kind]));
  const deleteWindow = ev.settings.guestDeleteHours * 3_600_000;
  const items = page.map(({ m, guestName }) => ({
    id: m.id, kind: m.kind, width: m.width, height: m.height, durationSec: m.durationSec,
    createdAt: m.createdAt, takenAt: m.takenAt, guestName,
    url: publicUrl(m.key!), thumb: m.thumbKey ? publicUrl(m.thumbKey) : null, poster: m.posterKey ? publicUrl(m.posterKey) : null,
    reactions: tallyBy[m.id] ?? {}, mine: mineBy[m.id] ?? null,
    canDelete: !!me && m.guestId === me.id && Date.now() - m.createdAt.getTime() < deleteWindow,
  }));
  return { items, next: rows.length > limit ? items[items.length - 1]!.id : null };
});
