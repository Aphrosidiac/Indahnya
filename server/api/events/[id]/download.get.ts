import archiver from 'archiver';
import type { Readable } from 'node:stream';
import { and, eq, inArray, asc } from 'drizzle-orm';
import { useDb, media, guests } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { getStream } from '../../../utils/storage';
import { downloadName, extOf, servedWhere } from '../../../utils/media';

/**
 * Everything, as one zip, streamed from the buckets through the app —
 * nothing is staged on disk. Originals for photos (full quality); the served
 * copy for video, because the original may be HEVC that nothing outside an
 * iPhone plays. Hidden media goes in its own folder, and uploads the worker
 * could not process go in gagal/ as the guest sent them.
 *
 * ONE object is open at a time: the next GET starts only when archiver has
 * written the previous entry. Opening every stream up front (append in a
 * loop) holds a socket per photo and a 2,000-photo majlis times out.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const rows = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(eq(media.eventId, ev.id), inArray(media.status, ['ready', 'hidden', 'failed'])))
    .orderBy(asc(media.createdAt));
  setHeader(event, 'content-type', 'application/zip');
  setHeader(event, 'content-disposition', `attachment; filename="indahnya-${ev.slug}.zip"`);
  setHeader(event, 'cache-control', 'no-store');
  const zip = archiver('zip', { zlib: { level: 0 } });
  const res = event.node.res;

  /**
   * A cancelled download must settle everything it holds: archiver emits
   * neither `entry` nor `error` after abort(), so the wait for the current
   * entry is rejected by hand and the open S3 stream destroyed — otherwise
   * each cancelled zip keeps a socket of the pool the worker also needs.
   */
  let aborted = false;
  let current: Readable | null = null;
  let cancelWait: ((e: Error) => void) | null = null;
  res.on('close', () => {
    if (res.writableFinished) return;
    aborted = true;
    zip.abort();
    current?.destroy();
    cancelWait?.(new Error('aborted'));
  });
  zip.on('warning', e => console.warn('[zip]', e.message));
  zip.pipe(res);

  (async () => {
    for (const { m, guestName } of rows) {
      if (aborted) return;
      // failed uploads: the original, as sent — the guest's photo is never simply lost
      const [key, where] = m.kind === 'photo' || m.status === 'failed' ? [m.originalKey, 'private' as const]
        : m.key ? [m.key, servedWhere(m.status)] : [m.originalKey, 'private' as const];
      let stream: Readable;
      try { stream = await getStream(key, where); } catch { continue; } // a missing object is skipped, not fatal
      if (aborted) { stream.destroy(); return; }
      current = stream;
      const folder = m.status === 'hidden' ? 'disembunyikan/' : m.status === 'failed' ? 'gagal/' : '';
      await new Promise<void>((resolve, reject) => {
        const onEntry = () => { zip.off('error', onError); cancelWait = null; resolve(); };
        const onError = (e: Error) => { zip.off('entry', onEntry); cancelWait = null; reject(e); };
        cancelWait = (e) => { zip.off('entry', onEntry); zip.off('error', onError); reject(e); };
        zip.once('entry', onEntry);
        zip.once('error', onError);
        zip.append(stream, { name: `${folder}${downloadName(m, extOf(key), guestName)}`, date: m.takenAt ?? m.createdAt });
      });
      current = null;
    }
    if (!aborted) await zip.finalize();
  })().catch((e) => {
    current?.destroy();
    if (!aborted) { console.error('[zip] failed', (e as Error).message); res.destroy(); }
  });
  return new Promise<void>(resolve => res.on('close', () => resolve()));
});
