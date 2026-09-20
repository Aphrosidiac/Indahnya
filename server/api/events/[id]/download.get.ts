import archiver from 'archiver';
import { and, eq, inArray, asc } from 'drizzle-orm';
import { useDb, media } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { getStream } from '../../../utils/storage';

/**
 * Everything, as one zip, streamed from the bucket through the app — nothing
 * is staged on disk. Originals for photos (full quality); the served copy for
 * video, because the original may be HEVC that nothing outside an iPhone
 * plays. Filenames are time-ordered so a folder reads like the day.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const rows = await useDb().select().from(media)
    .where(and(eq(media.eventId, ev.id), inArray(media.status, ['ready', 'hidden'])))
    .orderBy(asc(media.createdAt));
  setHeader(event, 'content-type', 'application/zip');
  setHeader(event, 'content-disposition', `attachment; filename="indahnya-${ev.slug}.zip"`);
  const zip = archiver('zip', { zlib: { level: 0 } });
  const res = event.node.res;
  zip.pipe(res);
  (async () => {
    let i = 0;
    for (const m of rows) {
      const key = m.kind === 'photo' ? m.originalKey : (m.key ?? m.originalKey);
      const ext = key.split('.').pop() || 'bin';
      const stamp = (m.takenAt ?? m.createdAt).toISOString().replace(/[:T]/g, '-').slice(0, 19);
      const name = `${m.status === 'hidden' ? 'disembunyikan/' : ''}${stamp}-${String(++i).padStart(4, '0')}.${ext}`;
      try { zip.append(await getStream(key), { name }); } catch { /* a missing object is skipped, not fatal */ }
    }
    await zip.finalize();
  })().catch((e) => { console.error('zip failed', e); res.destroy(); });
  return new Promise<void>(resolve => res.on('close', () => resolve()));
});
