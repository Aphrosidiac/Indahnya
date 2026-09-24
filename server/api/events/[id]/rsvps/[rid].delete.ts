import { and, eq } from 'drizzle-orm';
import { useDb, rsvps } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';

export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().delete(rsvps).where(and(eq(rsvps.id, getRouterParam(event, 'rid')!), eq(rsvps.eventId, ev.id))).returning({ id: rsvps.id });
  if (!row) throw createError({ statusCode: 404 });
  return { ok: true };
});
