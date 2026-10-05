import archiver from 'archiver';
import type { Readable } from 'node:stream';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { useDb, messages } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { getStream } from '../../../utils/storage';
import { safeName } from '../../../utils/media';
import { contentDisposition } from '../../../utils/disposition';

/**
 * Every wish as a keepsake: ucapan.txt with the words, and the voice notes
 * as m4a files named by time and sender. Streamed like the photo zip — one
 * recording open at a time, everything released if the download is cancelled.
 */
const stamp = (d: Date) => new Date(d.getTime() + 8 * 3_600_000).toISOString().replace(/[:T]/g, '-').slice(0, 16);
const safe = (s: string | null) => safeName(s ?? '') || 'Tetamu';

export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const rows = await useDb().select().from(messages).where(and(eq(messages.eventId, ev.id), inArray(messages.status, ['visible', 'hidden']))).orderBy(asc(messages.createdAt));
  setHeader(event, 'content-type', 'application/zip');
  setHeader(event, 'content-disposition', contentDisposition(`ucapan-${ev.slug}.zip`));
  setHeader(event, 'cache-control', 'no-store');
  setHeader(event, 'x-accel-buffering', 'no');
  const zip = archiver('zip', { zlib: { level: 6 } });
  const res = event.node.res;
  let aborted = false, current: Readable | null = null, cancel: ((e: Error) => void) | null = null;
  res.on('close', () => { if (res.writableFinished) return; aborted = true; zip.abort(); current?.destroy(); cancel?.(new Error('aborted')); });
  zip.pipe(res);
  const text = rows.map(m => `${stamp(m.createdAt).replace(/-(\d\d)-(\d\d)$/, ' $1:$2')} — ${m.name ?? 'Tetamu'}${m.status === 'hidden' ? ' (disembunyikan)' : ''}\n${m.kind === 'audio' ? `[ucapan suara: ${stamp(m.createdAt)}-${safe(m.name)}.m4a]` : m.body ?? ''}\n`).join('\n');
  zip.append(`Ucapan untuk ${ev.title}\n\n${text}`, { name: 'ucapan.txt' });
  (async () => {
    for (const m of rows) {
      if (aborted) return;
      if (!m.audioKey) continue;
      let s: Readable;
      try { s = await getStream(m.audioKey, m.status === 'visible' ? 'public' : 'private'); } catch { continue; }
      if (aborted) { s.destroy(); return; }
      current = s;
      await new Promise<void>((resolve, reject) => {
        const onEntry = () => { zip.off('error', onError); cancel = null; resolve(); };
        const onError = (e: Error) => { zip.off('entry', onEntry); cancel = null; reject(e); };
        cancel = (e) => { zip.off('entry', onEntry); zip.off('error', onError); reject(e); };
        zip.once('entry', onEntry); zip.once('error', onError);
        zip.append(s, { name: `suara/${stamp(m.createdAt)}-${safe(m.name)}-${m.id.slice(-4).toLowerCase()}.m4a` });
      });
      current = null;
    }
    if (!aborted) await zip.finalize();
  })().catch((e) => { current?.destroy(); if (!aborted) { console.error('[ucapan zip]', (e as Error).message); res.destroy(); } });
  return new Promise<void>(resolve => res.on('close', () => resolve()));
});
