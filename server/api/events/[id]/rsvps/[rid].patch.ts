import { and, eq } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { readBodyAs } from '../../../../utils/validate';
import { HostRsvp } from '../../../../utils/rsvp-body';
import { msisdn } from '../../../../../shared/utils/kad-templates';

/** Edit a reply. Someone marked not coming loses their seat. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const b = await readBodyAs(event, HostRsvp.partial());
  const db = useDb();
  const [cur] = await db.select().from(rsvps).where(and(eq(rsvps.id, getRouterParam(event, 'rid')!), eq(rsvps.eventId, ev.id)));
  if (!cur) throw createError({ statusCode: 404 });
  if (b.tableId) {
    const [t] = await db.select({ id: tables.id }).from(tables).where(and(eq(tables.id, b.tableId), eq(tables.eventId, ev.id)));
    if (!t) throw createError({ statusCode: 400, statusMessage: 'Meja tak jumpa' });
  }
  const attending = b.attending ?? cur.attending;
  const [row] = await db.update(rsvps).set({
    ...(b.name !== undefined ? { name: b.name } : {}),
    ...(b.phone !== undefined ? { phone: b.phone || null, phoneKey: b.phone ? msisdn(b.phone) : null } : {}),
    attending,
    pax: attending ? Math.max(1, b.pax ?? (cur.pax || 1)) : 0,
    ...(b.side !== undefined ? { side: b.side } : {}),
    ...(b.meal !== undefined ? { meal: b.meal || null } : {}),
    ...(b.note !== undefined ? { note: b.note || null } : {}),
    tableId: attending ? (b.tableId !== undefined ? b.tableId : cur.tableId) : null,
    updatedAt: new Date(),
  }).where(eq(rsvps.id, cur.id)).returning();
  return row;
});
