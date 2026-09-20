import { and, eq, lt, isNull, sql } from 'drizzle-orm';
import { useDb, media, events } from '../db';
import { del, listAll } from '../utils/storage';
import { enqueue } from '../utils/jobs';

/** Everything under events/<id>/ goes, then the rows follow. */
export async function purgeEvent(eventId: string) {
  const keys = await listAll(`events/${eventId.toLowerCase()}/`);
  const hidden = await listAll(`hidden/events/${eventId.toLowerCase()}/`);
  await del([...keys, ...hidden]);
  await useDb().update(media).set({ status: 'deleted' }).where(eq(media.eventId, eventId));
  await useDb().update(events).set({ purgedAt: new Date() }).where(eq(events.id, eventId));
}

/**
 * The hourly sweep. NOTE the parentheses in the deleted-rows query: a raw
 * `or` inside drizzle's and() is spliced verbatim, and without them the
 * sweep once deleted the served copies of every READY row on a dev box.
 *
 *  - slots claimed but never filled for an hour are dropped, freeing the cap;
 *  - rows marked deleted whose bytes are still in the bucket are cleaned;
 *  - events past storage end + 30 days grace are purged (the mail warnings
 *    are the notify sweep's job, see notify.ts).
 */
export async function sweep() {
  const db = useDb();
  const hourAgo = new Date(Date.now() - 3_600_000);
  await db.update(media).set({ status: 'failed', error: 'tak sampai' })
    .where(and(eq(media.status, 'pending'), lt(media.createdAt, hourAgo)));

  const gone = await db.select().from(media).where(and(eq(media.status, 'deleted'), sql`(${media.key} is not null or ${media.thumbKey} is not null or ${media.posterKey} is not null)`)).limit(500);
  for (const m of gone) {
    await del([m.originalKey, m.key, m.thumbKey, m.posterKey].filter((k): k is string => !!k));
    await db.update(media).set({ key: null, thumbKey: null, posterKey: null }).where(eq(media.id, m.id));
  }

  const grace = new Date(Date.now() - 30 * 86_400_000);
  const expired = await db.select({ id: events.id }).from(events).where(and(isNull(events.purgedAt), lt(events.storageEndsAt, grace))).limit(50);
  for (const e of expired) await enqueue('purge_event', e.id);
}
