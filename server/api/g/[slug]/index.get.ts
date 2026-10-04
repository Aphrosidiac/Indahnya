import { and, eq, count } from 'drizzle-orm';
import { useDb, media, kad } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { currentGuest } from '../../../utils/guest';
import { publicEvent } from '../../../utils/events';

/** What a guest's browser needs before it shows anything. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const [guest, [n], [k]] = await Promise.all([
    currentGuest(event, ev.id),
    useDb().select({ n: count() }).from(media).where(and(eq(media.eventId, ev.id), eq(media.status, 'ready'))),
    ev.settings.modules.kad ? useDb().select({ template: kad.template }).from(kad).where(eq(kad.eventId, ev.id)) : Promise.resolve([]),
  ]);
  // the kad's template dresses every guest page, so the gallery reads as the same majlis as the card
  return { event: { ...publicEvent(ev), kadTemplate: k?.template ?? null }, me: guest ? { id: guest.id, name: guest.name } : null, ready: Number(n?.n ?? 0) };
});
