import { and, eq } from 'drizzle-orm';
import { useDb, media } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { currentGuest } from '../../../../../utils/guest';
import { del } from '../../../../../utils/storage';
import { servedWhere } from '../../../../../utils/media';

/** A guest may take back their own upload inside the event's window (24 h by default). Gone at once, original too. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const me = await currentGuest(event, ev.id);
  const id = getRouterParam(event, 'id')!;
  const [m] = await useDb().select().from(media).where(and(eq(media.id, id), eq(media.eventId, ev.id)));
  if (!m || !me || m.guestId !== me.id || m.status === 'deleted') throw createError({ statusCode: 404 });
  // an unfinished slot (never sent) can always be released — it is nobody's photo yet, and it holds a slot of the cap
  const unsent = m.status === 'pending';
  if (!unsent && Date.now() - m.createdAt.getTime() > ev.settings.guestDeleteHours * 3_600_000) throw createError({ statusCode: 403, statusMessage: 'Tempoh padam dah lepas' });
  await useDb().update(media).set({ status: 'deleted', key: null, thumbKey: null, posterKey: null }).where(eq(media.id, m.id));
  await Promise.all([
    del([m.key, m.thumbKey, m.posterKey].filter((k): k is string => !!k), servedWhere(m.status)),
    del([m.originalKey], 'private'),
  ]);
  return { ok: true };
});
