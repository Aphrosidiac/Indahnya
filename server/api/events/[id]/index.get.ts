import { eq, count, and, sql } from 'drizzle-orm';
import { useDb, eventMembers, users, rsvps, messages } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { mediaCounts, uploadsUsed, uploadsOpen } from '../../../utils/events';
import { PLANS, offers } from '../../../utils/plans';

export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const db = useDb();
  const [counts, used, members, [rsvp], [ucapan]] = await Promise.all([
    mediaCounts(ev.id), uploadsUsed(ev.id),
    db.select({ userId: eventMembers.userId, role: eventMembers.role, email: users.email, name: users.name }).from(eventMembers)
      .innerJoin(users, eq(users.id, eventMembers.userId)).where(eq(eventMembers.eventId, ev.id)),
    db.select({ n: count(), pax: sql<number>`coalesce(sum(case when ${rsvps.attending} then ${rsvps.pax} else 0 end),0)` }).from(rsvps).where(eq(rsvps.eventId, ev.id)),
    db.select({ n: count() }).from(messages).where(and(eq(messages.eventId, ev.id), eq(messages.status, 'visible'))),
  ]);
  const plan = PLANS[ev.plan];
  const { notified: _n, ...settings } = ev.settings;
  return {
    ...ev, settings, isOwner: ev.ownerId === user.id, members, counts,
    uploads: { used, cap: plan.uploadCap, open: uploadsOpen(ev) },
    rsvp: { n: Number(rsvp?.n ?? 0), pax: Number(rsvp?.pax ?? 0) },
    ucapan: Number(ucapan?.n ?? 0),
    planInfo: plan,
    offers: offers(ev),
  };
});
