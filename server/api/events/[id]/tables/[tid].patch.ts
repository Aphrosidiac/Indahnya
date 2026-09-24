import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { useDb, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { readBodyAs } from '../../../../utils/validate';

const Body = z.object({ name: z.string().trim().min(1).max(40), capacity: z.number().int().min(1).max(100), sort: z.number().int().min(0).max(100000) }).partial();

export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const b = await readBodyAs(event, Body);
  if (!Object.keys(b).length) throw createError({ statusCode: 400 });
  const [row] = await useDb().update(tables).set(b).where(and(eq(tables.id, getRouterParam(event, 'tid')!), eq(tables.eventId, ev.id))).returning();
  if (!row) throw createError({ statusCode: 404 });
  return row;
});
