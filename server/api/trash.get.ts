import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { useDb, events } from '../db';
import { requireUser } from '../utils/session';

/** The owner's majlis deleted in the last 7 days, still restorable. */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  return useDb().select({ id: events.id, title: events.title, slug: events.slug, deletedAt: events.deletedAt, purgeAfter: events.purgeAfter }).from(events)
    .where(and(eq(events.ownerId, u.id), isNotNull(events.deletedAt), isNull(events.purgeStartedAt), isNull(events.purgedAt)))
    .orderBy(desc(events.deletedAt));
});
