import { eventBySlug } from '../../../utils/public';
import { currentGuest } from '../../../utils/guest';
import { rsvpSettings, rsvpOpen, findOwnRsvp } from '../../../utils/rsvp';

/** The RSVP form's rules, and this browser's own reply if it has one. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.rsvp) throw createError({ statusCode: 404, statusMessage: 'RSVP ditutup' });
  const me = await currentGuest(event, ev.id);
  const s = rsvpSettings(ev);
  const mine = me ? await findOwnRsvp(ev.id, me.id, null) : null;
  return {
    open: rsvpOpen(ev), demo: !!ev.settings.demo, deadline: s.deadline, maxPax: s.maxPax, meals: s.meals, sides: s.sides,
    guestName: me?.name ?? null,
    mine: mine ? { name: mine.name, phone: mine.phone, attending: mine.attending, pax: mine.pax, side: mine.side, meal: mine.meal, note: mine.note, updatedAt: mine.updatedAt } : null,
  };
});
