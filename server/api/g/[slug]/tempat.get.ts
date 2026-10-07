import { and, eq, isNotNull, ilike, asc, or } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { rateLimit, clientIp } from '../../../utils/rate';

/**
 * "Cari nama → nombor meja". Only what the search needs leaves the server:
 * the name as the guest wrote it and the table's name — never phones, pax,
 * sides or notes — for at most five matches of at least three letters,
 * matched from the start of a word.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.tempat) throw createError({ statusCode: 404, statusMessage: 'Tempat duduk ditutup' });
  await rateLimit(`tempat:${clientIp(event)}`, 120, 60_000);
  await rateLimit(`tempat:ev:${ev.id}`, 1200, 60_000);
  const q = String(getQuery(event).q ?? '').trim().replace(/[%_\\]/g, '');
  if (q.length < 3) return { items: [] };
  // from the start of a word: "ros" finds "Makcik Ros", but "a" + "b" + "c" cannot walk the whole list
  const rows = await useDb().select({ name: rsvps.name, table: tables.name }).from(rsvps)
    .innerJoin(tables, eq(tables.id, rsvps.tableId))
    .where(and(eq(rsvps.eventId, ev.id), eq(rsvps.attending, true), isNotNull(rsvps.tableId), or(ilike(rsvps.name, `${q}%`), ilike(rsvps.name, `% ${q}%`))))
    .orderBy(asc(rsvps.name)).limit(5);
  return { items: rows };
});
