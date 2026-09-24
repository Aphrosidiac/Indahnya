import { and, eq } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { readBodyAs } from '../../../../utils/validate';
import { HostRsvp } from '../../../../utils/rsvp-body';
import { newId } from '../../../../utils/ids';
import { msisdn } from '../../../../../shared/utils/kad-templates';

/** The host adds a reply taken by phone or in person. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const b = await readBodyAs(event, HostRsvp);
  if (b.tableId) {
    const [t] = await useDb().select({ id: tables.id }).from(tables).where(and(eq(tables.id, b.tableId), eq(tables.eventId, ev.id)));
    if (!t) throw createError({ statusCode: 400, statusMessage: 'Meja tak jumpa' });
  }
  const [row] = await useDb().insert(rsvps).values({
    id: newId(), eventId: ev.id, source: 'host', name: b.name, phone: b.phone || null, phoneKey: b.phone ? msisdn(b.phone) : null,
    attending: b.attending, pax: b.attending ? Math.max(1, b.pax) : 0, side: b.side ?? null, meal: b.meal || null, note: b.note || null,
    tableId: b.attending ? b.tableId ?? null : null,
  }).returning();
  return row;
});
