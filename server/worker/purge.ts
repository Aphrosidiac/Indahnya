import { and, eq, lt, gt, isNull, isNotNull, sql, inArray, notExists } from 'drizzle-orm';
import { useDb, media, events, jobs, messages, rsvps, tables, guests, kad } from '../db';
import { del, delEverywhere, listAll, abortMultipart, PUT_TTL_SEC } from '../utils/storage';
import { enqueue } from '../utils/jobs';
import { purgeDue, GRACE_DAYS } from '../utils/retention';
import { opsAlert } from '../utils/alert';

const TAIL_MS = PUT_TTL_SEC * 1000 + 10 * 60_000;

/**
 * Deletes a majlis's media and its guests' data for good. Safe to queue
 * early and safe to run twice:
 *
 *   1. under a lock on the event row, re-check that it is still due (see
 *      purgeDue). A renewal paid, or a deletion undone, after the job was
 *      queued wins: the job does nothing. Once `purgeStartedAt` is set no
 *      payment can extend the event any more (applyPaidSession flags it for
 *      refund instead), so the check and the purge cannot interleave.
 *   2. everything under events/<id>/ goes from both buckets, unfinished
 *      multipart uploads are aborted, then the rows: guests, wishes, RSVPs,
 *      tables, and the kad's personal fields (parents' names, phone numbers,
 *      bank accounts) — the event row itself stays as the host's history.
 *   3. a tail pass runs once more after the PUT window: an upload signed
 *      before the purge can still land after it, and must not stay behind.
 */
export async function purgeEvent(eventId: string) {
  const db = useDb();
  const mode = await db.transaction(async (tx) => {
    const [ev] = await tx.select().from(events).where(eq(events.id, eventId)).for('update');
    if (!ev) return 'none' as const;
    if (ev.purgedAt) return 'tail' as const;
    if (!ev.purgeStartedAt) {
      const d = purgeDue(ev);
      if (!d.due) return 'skip' as const;
      if (d.unwarned) opsAlert('Purge without a final warning', `Event ${ev.id} ("${ev.title}") is purged ${GRACE_DAYS}+ days after storage ended, but its final warning mail was never sent.`);
      await tx.update(events).set({ purgeStartedAt: new Date() }).where(eq(events.id, ev.id));
    }
    return 'go' as const;
  });
  if (mode === 'none' || mode === 'skip') return;

  const prefix = `events/${eventId.toLowerCase()}/`;
  const open = await db.select({ key: media.originalKey, uploadId: media.uploadId }).from(media).where(and(eq(media.eventId, eventId), isNotNull(media.uploadId)));
  for (const o of open) await abortMultipart(o.key, o.uploadId!);
  const [pub, priv] = await Promise.all([listAll(prefix, 'public'), listAll(prefix, 'private')]);
  await Promise.all([del(pub, 'public'), del(priv, 'private')]);
  if (mode === 'tail') return;

  await db.transaction(async (tx) => {
    await tx.update(media).set({ status: 'deleted', key: null, midKey: null, thumbKey: null, posterKey: null, uploadId: null, guestId: null }).where(eq(media.eventId, eventId));
    // the people go too: names, phone numbers and wishes are not kept past the photos
    await tx.delete(messages).where(eq(messages.eventId, eventId));
    await tx.delete(rsvps).where(eq(rsvps.eventId, eventId));
    await tx.delete(tables).where(eq(tables.eventId, eventId));
    await tx.delete(guests).where(eq(guests.eventId, eventId));
    await tx.update(kad).set({ fields: {}, musicKey: null, ogKey: null }).where(eq(kad.eventId, eventId));
    await tx.update(events).set({ venue: {}, purgedAt: sql`coalesce(${events.purgedAt}, now())` }).where(eq(events.id, eventId));
  });
  await enqueue('purge_event', eventId, { delayMs: TAIL_MS });
}

/**
 * The hourly sweep. NOTE the parentheses in the raw `or` below: a raw `or`
 * inside drizzle's and() is spliced verbatim, and without them the sweep
 * once deleted the served copies of every READY row on a dev box.
 *
 *  - slots claimed but never filled (past the PUT URL's life) are failed,
 *    freeing the cap, and anything half-sent is removed;
 *  - a slot released while its PUT was still in flight can land afterwards:
 *    deleted rows get their original deleted again once the PUT window ends;
 *  - an upload whose processing job was lost is queued again;
 *  - rows marked deleted whose bytes may still be in a bucket are cleaned;
 *  - a failed upload keeps its original (it goes in the host's zip, under
 *    gagal/) until the event is purged;
 *  - events due for purge (see purgeDue) get one purge job each.
 */
export async function sweep() {
  const db = useDb();
  const now = Date.now();
  const putCut = new Date(now - TAIL_MS);
  const stale = await db.update(media).set({ status: 'failed', error: 'tak sampai' })
    .where(and(eq(media.status, 'pending'), lt(media.createdAt, putCut)))
    .returning({ originalKey: media.originalKey, uploadId: media.uploadId });
  for (const s of stale) if (s.uploadId) await abortMultipart(s.originalKey, s.uploadId);
  if (stale.length) await del(stale.map(s => s.originalKey), 'private');

  const late = await db.select({ originalKey: media.originalKey }).from(media)
    .where(and(eq(media.status, 'deleted'), lt(media.createdAt, putCut), gt(media.createdAt, new Date(now - TAIL_MS - 3 * 3_600_000)))).limit(2000);
  if (late.length) await del(late.map(l => l.originalKey), 'private');

  const lost = await db.select({ id: media.id, kind: media.kind }).from(media)
    .where(and(eq(media.status, 'uploaded'), lt(media.createdAt, new Date(now - 30 * 60_000)),
      notExists(db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.ref, media.id), isNull(jobs.doneAt)))))).limit(200);
  for (const l of lost) await enqueue('process_media', l.id, { lane: l.kind === 'video' ? 'video' : 'photo' });

  // voice ucapan whose recording never arrived, or whose transcode died with the process
  // (read the keys first: RETURNING after the SET would hand back the nulls)
  const staleVoice = await db.select({ id: messages.id, src: messages.audioSrcKey }).from(messages)
    .where(and(inArray(messages.status, ['pending', 'processing']), lt(messages.createdAt, putCut))).limit(500);
  if (staleVoice.length) {
    await db.update(messages).set({ status: 'failed', audioSrcKey: null })
      .where(and(inArray(messages.id, staleVoice.map(v => v.id)), inArray(messages.status, ['pending', 'processing'])));
    const voiceKeys = staleVoice.map(v => v.src).filter((k): k is string => !!k);
    if (voiceKeys.length) await del(voiceKeys, 'private');
  }

  const gone = await db.select().from(media).where(and(eq(media.status, 'deleted'), sql`(${media.key} is not null or ${media.midKey} is not null or ${media.thumbKey} is not null or ${media.posterKey} is not null)`)).limit(500);
  for (const m of gone) {
    await delEverywhere([m.key, m.midKey, m.thumbKey, m.posterKey].filter((k): k is string => !!k));
    await del([m.originalKey], 'private');
    await db.update(media).set({ key: null, midKey: null, thumbKey: null, posterKey: null }).where(eq(media.id, m.id));
  }

  // candidates: deleted ones past their undo window, expired ones past the grace month; purgeDue has the last word
  const candidates = await db.select().from(events)
    .where(and(isNull(events.purgedAt), sql`(
      (${events.deletedAt} is not null and ${events.purgeAfter} <= now())
      or ${events.storageEndsAt} < ${new Date(now - GRACE_DAYS * 86_400_000)}
    )`)).limit(100);
  const due = candidates.filter(e => e.purgeStartedAt || purgeDue(e, now).due);
  if (!due.length) return;
  const queued = await db.select({ ref: jobs.ref }).from(jobs)
    .where(and(eq(jobs.kind, 'purge_event'), isNull(jobs.doneAt), inArray(jobs.ref, due.map(e => e.id))));
  const have = new Set(queued.map(q => q.ref));
  for (const e of due) if (!have.has(e.id)) await enqueue('purge_event', e.id);
}
