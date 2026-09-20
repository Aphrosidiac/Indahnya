import { and, eq, count } from 'drizzle-orm';
import { useDb, media } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { currentGuest } from '../../../utils/guest';
import { publicEvent } from '../../../utils/events';

/** What a guest's browser needs before it shows anything. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const [guest, [n]] = await Promise.all([
    currentGuest(event, ev.id),
    useDb().select({ n: count() }).from(media).where(and(eq(media.eventId, ev.id), eq(media.status, 'ready'))),
  ]);
  return { event: publicEvent(ev), me: guest ? { id: guest.id, name: guest.name } : null, ready: Number(n?.n ?? 0) };
});
