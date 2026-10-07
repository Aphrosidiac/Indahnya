import { and, eq } from 'drizzle-orm';
import { useDb, messages } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { currentGuest } from '../../../../../utils/guest';
import { delEverywhere, cdnPurge } from '../../../../../utils/storage';

/** A guest may take back their own wish inside the event's delete window (an unsent recording, any time). */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const me = await currentGuest(event, ev.id);
  const [m] = await useDb().select().from(messages).where(and(eq(messages.id, getRouterParam(event, 'id')!), eq(messages.eventId, ev.id)));
  if (!m || !me || m.guestId !== me.id || m.status === 'deleted') throw createError({ statusCode: 404 });
  const unsent = m.status === 'pending' || m.status === 'processing' || m.status === 'failed';
  if (!unsent && Date.now() - m.createdAt.getTime() > ev.settings.guestDeleteHours * 3_600_000) throw createError({ statusCode: 403, statusMessage: 'Tempoh padam dah lepas' });
  await useDb().update(messages).set({ status: 'deleted', body: null, audioKey: null, audioSrcKey: null }).where(eq(messages.id, m.id));
  await delEverywhere([m.audioKey, m.audioSrcKey].filter((k): k is string => !!k));
  if (m.status === 'visible' && m.audioKey) await cdnPurge([m.audioKey]);
  return { ok: true };
});
