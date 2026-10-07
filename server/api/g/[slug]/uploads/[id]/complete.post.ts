import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { useDb, media } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { currentGuest } from '../../../../../utils/guest';
import { head, del, completeMultipart } from '../../../../../utils/storage';
import { MEDIA_LIMITS, PLANS } from '../../../../../utils/plans';
import { uploadsUsed, SLOT_HOLD_MIN } from '../../../../../utils/events';
import { enqueue } from '../../../../../utils/jobs';
import { readBodyAs } from '../../../../../utils/validate';

const Body = z.object({ parts: z.array(z.object({ n: z.number().int().min(1).max(10_000), etag: z.string().min(1).max(200) })).max(10_000).optional() });

/**
 * Step 2: the browser says the PUT finished (for a multipart upload, with
 * each part's ETag, and we assemble it). We check the object is really there
 * (a HEAD, never trusting the client), mark it uploaded and queue it — the
 * row and its job in one transaction, so an upload is never `uploaded` with
 * nothing coming to process it.
 *
 * A slot older than its hold no longer reserved a place in a capped
 * gallery: it finishes only if there is still room now.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event, { sandbox: true });
  const id = getRouterParam(event, 'id')!;
  const { parts } = await readBodyAs(event, Body);
  const me = await currentGuest(event, ev.id);
  const db = useDb();
  const [m] = await db.select().from(media).where(and(eq(media.id, id), eq(media.eventId, ev.id)));
  if (!m || !me || m.guestId !== me.id) throw createError({ statusCode: 404 });
  if (m.status !== 'pending') return { id: m.id, status: m.status };

  if (m.uploadId) {
    if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Bahagian fail tak lengkap' });
    try { await completeMultipart(m.originalKey, m.uploadId, parts); }
    catch (e) {
      // completed by an earlier try whose answer was lost: the object is there, carry on
      if (!(await head(m.originalKey, 'private'))) throw createError({ statusCode: 409, statusMessage: 'Fail belum lengkap', data: { reason: (e as Error).message?.slice(0, 120) } });
    }
  }
  const h = await head(m.originalKey, 'private');
  if (!h) throw createError({ statusCode: 409, statusMessage: 'Fail belum sampai' });
  const fail = async (status: number, msg: string) => {
    await del([m.originalKey], 'private');
    await db.update(media).set({ status: 'failed', error: msg, uploadId: null }).where(and(eq(media.id, m.id), eq(media.status, 'pending')));
    throw createError({ statusCode: status, statusMessage: msg });
  };
  const max = ev.settings.sandbox ? MEDIA_LIMITS.sandboxPhotoBytes : m.kind === 'photo' ? MEDIA_LIMITS.photoBytes : MEDIA_LIMITS.videoBytes;
  if ((h.ContentLength ?? 0) > max) await fail(413, `Fail terlalu besar (had ${Math.round(max / 1048576)} MB)`);

  const cap = PLANS[ev.plan].uploadCap;
  const expired = Date.now() - m.createdAt.getTime() > SLOT_HOLD_MIN * 60_000;
  const result = await db.transaction(async (tx) => {
    if (cap !== null && expired && !ev.settings.sandbox) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ev.id}))`);
      if ((await uploadsUsed(ev.id, tx, m.id)) + 1 > cap) return 'full' as const;
    }
    // conditional: two completes racing (a retry after a lost response) enqueue once
    const [won] = await tx.update(media).set({ status: 'uploaded', bytes: h.ContentLength ?? m.bytes, uploadId: null })
      .where(and(eq(media.id, m.id), eq(media.status, 'pending'))).returning({ id: media.id });
    if (won) await enqueue('process_media', m.id, { db: tx, lane: m.kind === 'video' ? 'video' : 'photo', priority: ev.settings.sandbox ? 5 : 0 });
    return 'ok' as const;
  });
  if (result === 'full') await fail(402, `Galeri ni dah penuh (${cap} gambar untuk pakej percuma)`);
  return { id: m.id, status: 'uploaded' };
});
