import { desc, eq, or, inArray, sql, count, and } from 'drizzle-orm';
import { useDb, events, eventMembers, media } from '../../db';
import { requireUser } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb();
  const memberOf = db.select({ id: eventMembers.eventId }).from(eventMembers).where(eq(eventMembers.userId, u.id));
  const rows = await db.select().from(events)
    .where(or(eq(events.ownerId, u.id), inArray(events.id, memberOf)))
    .orderBy(desc(events.createdAt));
  if (!rows.length) return [];
  const counts = await db.select({ eventId: media.eventId, n: count() }).from(media)
    .where(and(inArray(media.eventId, rows.map(r => r.id)), sql`${media.status} in ('ready','hidden')`))
    .groupBy(media.eventId);
  const byId = Object.fromEntries(counts.map(c => [c.eventId, Number(c.n)]));
  return rows.map(r => ({ ...r, tvToken: undefined, mediaCount: byId[r.id] ?? 0, isOwner: r.ownerId === u.id }));
});
