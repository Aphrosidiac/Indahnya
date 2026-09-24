import { and, asc, eq, sql } from 'drizzle-orm';
import { useDb, tables, rsvps } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';

/**
 * The tables, in order, with how many seats each has taken. A join, not a
 * correlated subquery: inside sql`` drizzle printed tables.id unqualified,
 * which the subquery read as rsvps.id — every table showed 0 seated.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const rows = await useDb().select({ t: tables, seated: sql<number>`coalesce(sum(${rsvps.pax}), 0)` }).from(tables)
    .leftJoin(rsvps, and(eq(rsvps.tableId, tables.id), eq(rsvps.attending, true)))
    .where(eq(tables.eventId, ev.id)).groupBy(tables.id).orderBy(asc(tables.sort), asc(tables.name));
  return rows.map(({ t, seated }) => ({ ...t, seated: Number(seated) }));
});
