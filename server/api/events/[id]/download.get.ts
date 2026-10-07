import archiver from 'archiver';
import type { Readable } from 'node:stream';
import { eq, asc } from 'drizzle-orm';
import { useDb, media, guests } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { getStream } from '../../../utils/storage';
import { downloadName, extOf, zipParts } from '../../../utils/media';

const ZIPPED = ['ready', 'hidden', 'failed'];
import { contentDisposition } from '../../../utils/disposition';

/**
 * Everything, as zips of the ORIGINALS — photos and videos exactly as the
 * guests sent them (the 720p copy is only for playing in the gallery) —
 * streamed from the private bucket through the app; nothing is staged on
 * disk. Hidden media goes in its own folder, and uploads the worker could not
 * process go in gagal/.
 *
 * A big majlis comes in parts of ~2 GB (`?part=1…n`, the count is in the
 * event's `zip` info): a dropped connection costs one part, not the whole
 * 20 GB. `X-Accel-Buffering: no` keeps nginx from spooling it to disk.
 *
 * ONE object is open at a time: the next GET starts only when archiver has
 * written the previous entry. Opening every stream up front (append in a
 * loop) holds a socket per photo and a 2,000-photo majlis times out.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const all = await useDb().select({ m: media, guestName: guests.name, bytes: media.bytes }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(eq(media.eventId, ev.id))
    .orderBy(asc(media.createdAt), asc(media.id));
  const parts = zipParts(all);
  const n = Math.max(1, parts.length);
  const part = Math.min(Math.max(Math.trunc(Number(getQuery(event).part)) || 1, 1), n);
  const rows = (parts[part - 1] ?? []).filter(r => ZIPPED.includes(r.m.status));
  setHeader(event, 'content-type', 'application/zip');
  setHeader(event, 'content-disposition', contentDisposition(n > 1 ? `indahnya-${ev.slug}-bahagian-${part}-dari-${n}.zip` : `indahnya-${ev.slug}.zip`));
  setHeader(event, 'cache-control', 'no-store');
  setHeader(event, 'x-accel-buffering', 'no');
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
      let stream: Readable;
      try { stream = await getStream(m.originalKey, 'private'); } catch { continue; } // a missing object is skipped, not fatal
      if (aborted) { stream.destroy(); return; }
      current = stream;
      const folder = m.status === 'hidden' ? 'disembunyikan/' : m.status === 'failed' ? 'gagal/' : '';
      await new Promise<void>((resolve, reject) => {
        const onEntry = () => { zip.off('error', onError); cancelWait = null; resolve(); };
        const onError = (e: Error) => { zip.off('entry', onEntry); cancelWait = null; reject(e); };
        cancelWait = (e) => { zip.off('entry', onEntry); zip.off('error', onError); reject(e); };
        zip.once('entry', onEntry);
        zip.once('error', onError);
        zip.append(stream, { name: `${folder}${downloadName(m, extOf(m.originalKey), guestName)}`, date: m.takenAt ?? m.createdAt });
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
