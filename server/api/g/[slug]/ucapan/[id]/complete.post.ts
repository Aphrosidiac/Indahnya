import { and, eq } from 'drizzle-orm';
import { useDb, messages } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { currentGuest } from '../../../../../utils/guest';
import { head, del, delEverywhere } from '../../../../../utils/storage';
import { processVoice, voiceSlot } from '../../../../../utils/audio';
import { MEDIA_LIMITS } from '../../../../../utils/plans';

/**
 * Step 2: the recording landed. A minute of voice transcodes in about a
 * second, so it is done here and the guest sees their wish at once. The
 * served copy is public, or private while approval mode holds it back.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const me = await currentGuest(event, ev.id);
  const id = getRouterParam(event, 'id')!;
  const db = useDb();
  const [m] = await db.select().from(messages).where(and(eq(messages.id, id), eq(messages.eventId, ev.id)));
  if (!m || !me || m.guestId !== me.id || m.kind !== 'audio' || !m.audioSrcKey) throw createError({ statusCode: 404 });
  if (m.status !== 'pending') return { id: m.id, status: m.status };
  const h = await head(m.audioSrcKey, 'private');
  if (!h) throw createError({ statusCode: 409, statusMessage: 'Rakaman belum sampai' });
  // wait for a transcode slot FIRST: a guest turned away here (503) is still `pending`, and their retry works
  const release = await voiceSlot();
  // claim it: a retried request must not transcode twice. `processing` is its own state,
  // so neither the guest's delete nor the host's list mistakes it for a finished failure.
  let won: { id: string } | undefined;
  try { [won] = await db.update(messages).set({ status: 'processing' }).where(and(eq(messages.id, m.id), eq(messages.status, 'pending'))).returning({ id: messages.id }); }
  catch (e) { release(); throw e; }
  if (!won) { release(); return { id: m.id, status: 'processing' }; }
  const status = ev.settings.approvalMode ? 'hidden' as const : 'visible' as const;
  const audioKey = `events/${ev.id.toLowerCase()}/ucapan/${m.id.toLowerCase()}.m4a`;
  try {
    const sec = await processVoice(m.audioSrcKey, audioKey, status === 'visible' ? 'public' : 'private', MEDIA_LIMITS.audioSec);
    // only a row still `processing` finishes: one deleted meanwhile stays deleted, and its fresh file goes
    const [done] = await db.update(messages).set({ status, audioKey, durationSec: sec, audioSrcKey: null })
      .where(and(eq(messages.id, m.id), eq(messages.status, 'processing'))).returning({ id: messages.id });
    if (!done) { await delEverywhere([audioKey]); return { id: m.id, status: 'deleted' }; }
    return { id: m.id, status };
  } catch (e) {
    console.error('[ucapan] voice failed', (e as Error).message);
    await db.update(messages).set({ status: 'failed', audioSrcKey: null }).where(and(eq(messages.id, m.id), eq(messages.status, 'processing')));
    throw createError({ statusCode: 422, statusMessage: 'Rakaman tak dapat dibaca — cuba rakam semula' });
  } finally {
    release();
    await del([m.audioSrcKey], 'private').catch(() => {});
  }
});
