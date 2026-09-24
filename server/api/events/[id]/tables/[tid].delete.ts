import { and, eq } from 'drizzle-orm';
import { useDb, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';

/** Removing a table un-seats its guests (the foreign key sets their table to null); nobody is deleted. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().delete(tables).where(and(eq(tables.id, getRouterParam(event, 'tid')!), eq(tables.eventId, ev.id))).returning({ id: tables.id });
  if (!row) throw createError({ statusCode: 404 });
  return { ok: true };
});
