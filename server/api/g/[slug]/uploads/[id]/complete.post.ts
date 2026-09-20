import { and, eq } from 'drizzle-orm';
import { useDb, media } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { currentGuest } from '../../../../../utils/guest';
import { head, del } from '../../../../../utils/storage';
import { MEDIA_LIMITS } from '../../../../../utils/plans';
import { enqueue } from '../../../../../utils/jobs';

/**
 * Step 2: the browser says the PUT finished. We check the object is really
 * there (a HEAD, never trusting the client), mark it uploaded and hand it to
 * the worker. A slot whose object never arrives stays `pending` and is
 * reaped by the sweep after an hour, freeing the cap.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const id = getRouterParam(event, 'id')!;
  const me = await currentGuest(event, ev.id);
  const db = useDb();
  const [m] = await db.select().from(media).where(and(eq(media.id, id), eq(media.eventId, ev.id)));
  if (!m || !me || m.guestId !== me.id) throw createError({ statusCode: 404 });
  if (m.status !== 'pending') return { id: m.id, status: m.status };
  const h = await head(m.originalKey);
  if (!h) throw createError({ statusCode: 409, statusMessage: 'Fail belum sampai' });
  const max = m.kind === 'photo' ? MEDIA_LIMITS.photoBytes : MEDIA_LIMITS.videoBytes;
  if ((h.ContentLength ?? 0) > max) {
    await del([m.originalKey]);
    await db.update(media).set({ status: 'failed', error: `Fail terlalu besar (had ${Math.round(max / 1048576)} MB)` }).where(eq(media.id, m.id));
    throw createError({ statusCode: 413, statusMessage: 'Fail terlalu besar' });
  }
  await db.update(media).set({ status: 'uploaded', bytes: h.ContentLength ?? m.bytes }).where(eq(media.id, m.id));
  await enqueue('process_media', m.id);
  return { id: m.id, status: 'uploaded' };
});
