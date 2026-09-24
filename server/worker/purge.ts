import { and, eq, lt, or, isNull, isNotNull, sql, inArray } from 'drizzle-orm';
import { useDb, media, events, jobs } from '../db';
import { del, delEverywhere, listAll } from '../utils/storage';
import { enqueue } from '../utils/jobs';
import { PUT_TTL_SEC } from '../utils/storage';

/** Everything under events/<id>/ in both buckets goes, then the rows follow. */
export async function purgeEvent(eventId: string) {
  const prefix = `events/${eventId.toLowerCase()}/`;
  const [pub, priv] = await Promise.all([listAll(prefix, 'public'), listAll(prefix, 'private')]);
  await Promise.all([del(pub, 'public'), del(priv, 'private')]);
  await useDb().update(media).set({ status: 'deleted', key: null, thumbKey: null, posterKey: null }).where(eq(media.eventId, eventId));
  await useDb().update(events).set({ purgedAt: sql`coalesce(${events.purgedAt}, now())` }).where(eq(events.id, eventId));
}

/**
 * The hourly sweep. NOTE the parentheses in the deleted-rows query: a raw
 * `or` inside drizzle's and() is spliced verbatim, and without them the
 * sweep once deleted the served copies of every READY row on a dev box.
 *
 *  - slots claimed but never filled (past the PUT URL's life) are failed,
 *    freeing the cap, and anything half-sent is removed;
 *  - rows marked deleted whose bytes may still be in a bucket are cleaned;
 *  - a failed upload keeps its original (it goes in the host's zip, under
 *    gagal/) until the event is purged;
 *  - events past storage end + 30 days grace, and deleted ones, are purged (the mail warnings
 *    are the notify sweep's job, see notify.ts). One purge job per event.
 */
export async function sweep() {
  const db = useDb();
  const stale = await db.update(media).set({ status: 'failed', error: 'tak sampai' })
    .where(and(eq(media.status, 'pending'), lt(media.createdAt, new Date(Date.now() - PUT_TTL_SEC * 1000 - 600_000))))
    .returning({ originalKey: media.originalKey });
  if (stale.length) await del(stale.map(s => s.originalKey), 'private');

  const gone = await db.select().from(media).where(and(eq(media.status, 'deleted'), sql`(${media.key} is not null or ${media.thumbKey} is not null or ${media.posterKey} is not null)`)).limit(500);
  for (const m of gone) {
    await delEverywhere([m.key, m.thumbKey, m.posterKey].filter((k): k is string => !!k));
    await del([m.originalKey], 'private');
    await db.update(media).set({ key: null, thumbKey: null, posterKey: null }).where(eq(media.id, m.id));
  }

  const grace = new Date(Date.now() - 30 * 86_400_000);
  // expired past grace, or deleted by the owner; purgedAt is only set once the bytes are gone, so a purge that gave up comes back here
  const expired = await db.select({ id: events.id }).from(events)
    .where(and(isNull(events.purgedAt), or(lt(events.storageEndsAt, grace), isNotNull(events.deletedAt)))).limit(50);
  if (!expired.length) return;
  const queued = await db.select({ ref: jobs.ref }).from(jobs)
    .where(and(eq(jobs.kind, 'purge_event'), isNull(jobs.doneAt), inArray(jobs.ref, expired.map(e => e.id))));
  const have = new Set(queued.map(q => q.ref));
  for (const e of expired) if (!have.has(e.id)) await enqueue('purge_event', e.id);
}
