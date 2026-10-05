import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireUser } from '../../../utils/session';

/** Undo a deletion inside its 7 days, before the purge has begun. Owner only. */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const id = getRouterParam(event, 'id')!;
  const [row] = await useDb().update(events).set({ deletedAt: null, purgeAfter: null })
    .where(and(eq(events.id, id), eq(events.ownerId, u.id), isNotNull(events.deletedAt), isNull(events.purgeStartedAt), isNull(events.purgedAt)))
    .returning({ id: events.id });
  if (!row) throw createError({ statusCode: 410, statusMessage: 'Majlis ni tak boleh dipulihkan lagi' });
  return { ok: true };
});
