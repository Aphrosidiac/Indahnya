import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { rsvpSettings, rsvpSummary, rsvpOpen } from '../../../../utils/rsvp';

/** Every reply for the host, newest first (a wedding is hundreds, not millions), with the totals and the form's rules. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const q = getQuery(event);
  const where = [eq(rsvps.eventId, ev.id)];
  if (q.status === 'yes') where.push(eq(rsvps.attending, true));
  if (q.status === 'no') where.push(eq(rsvps.attending, false));
  if (typeof q.q === 'string' && q.q.trim()) {
    const t = `%${q.q.trim().replace(/[%_\\]/g, '')}%`;
    where.push(or(ilike(rsvps.name, t), ilike(rsvps.phone, t), ilike(rsvps.note, t))!);
  }
  const [items, summary] = await Promise.all([
    useDb().select({ r: rsvps, table: tables.name }).from(rsvps).leftJoin(tables, eq(tables.id, rsvps.tableId))
      .where(and(...where)).orderBy(q.sort === 'name' ? asc(rsvps.name) : desc(rsvps.updatedAt)).limit(3000),
    rsvpSummary(ev.id),
  ]);
  return {
    items: items.map(({ r, table }) => ({ ...r, table })),
    summary, settings: rsvpSettings(ev), open: rsvpOpen(ev),
  };
});
