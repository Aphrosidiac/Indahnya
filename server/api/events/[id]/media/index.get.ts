import { and, desc, eq, lt, inArray } from 'drizzle-orm';
import { useDb, media, guests } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { mediaUrls } from '../../../../utils/media';

const STATES = ['ready', 'hidden', 'pending', 'uploaded', 'failed'] as const;

/**
 * Host view: every state except deleted, newest first, keyset-paged on the
 * ULID. Hidden media is served from the private bucket, so its URLs are
 * signed for an hour.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const q = getQuery(event);
  const wanted = typeof q.status === 'string' && q.status !== 'all'
    ? q.status.split(',').filter(s => (STATES as readonly string[]).includes(s)) as (typeof STATES[number])[]
    : [...STATES];
  if (!wanted.length) return { items: [], next: null };
  const limit = Math.min(Math.max(Number(q.limit) || 60, 1), 200);
  const where = [eq(media.eventId, ev.id), inArray(media.status, wanted)];
  if (typeof q.cursor === 'string' && q.cursor) where.push(lt(media.id, q.cursor));
  const rows = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(...where)).orderBy(desc(media.id)).limit(limit + 1);
  const items = await Promise.all(rows.slice(0, limit).map(async ({ m, guestName }) => ({
    id: m.id, kind: m.kind, status: m.status, width: m.width, height: m.height, durationSec: m.durationSec,
    bytes: m.bytes, takenAt: m.takenAt, createdAt: m.createdAt, guestName, error: m.error,
    ...(await mediaUrls(m)),
  })));
  return { items, next: rows.length > limit ? items[items.length - 1]!.id : null };
});
