import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { readBodyAs } from '../../../utils/validate';

const Body = z.object({ moves: z.array(z.object({ rsvpId: z.string().max(40), tableId: z.string().max(40).nullable() })).min(1).max(500) });

/**
 * Seat (or un-seat) guests — one drag, or a batch. Only replies that are
 * coming can take a seat, and only at this event's tables. Capacity is
 * advice, not a wall: the board shows a table over capacity in red, but a
 * family of six at a table of five is the host's call.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { moves } = await readBodyAs(event, Body);
  const db = useDb();
  const tableIds = [...new Set(moves.map(m => m.tableId).filter((t): t is string => !!t))];
  if (tableIds.length) {
    const ok = await db.select({ id: tables.id }).from(tables).where(and(eq(tables.eventId, ev.id), inArray(tables.id, tableIds)));
    if (ok.length !== tableIds.length) throw createError({ statusCode: 400, statusMessage: 'Meja tak jumpa' });
  }
  let n = 0;
  await db.transaction(async (tx) => {
    for (const m of moves) {
      const r = await tx.update(rsvps).set({ tableId: m.tableId, updatedAt: new Date() })
        .where(and(eq(rsvps.id, m.rsvpId), eq(rsvps.eventId, ev.id), ...(m.tableId ? [eq(rsvps.attending, true)] : []))).returning({ id: rsvps.id });
      n += r.length;
    }
  });
  return { ok: true, n };
});
