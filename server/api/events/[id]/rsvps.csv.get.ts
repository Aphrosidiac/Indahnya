import { asc, eq } from 'drizzle-orm';
import { useDb, rsvps, tables } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { contentDisposition } from '../../../utils/disposition';

/**
 * The guest list for Excel / Google Sheets. UTF-8 with a BOM (so Excel reads
 * Malay names right), and every cell a formula could start from is quoted
 * with a leading apostrophe — a name like "=HYPERLINK(…)" stays text.
 */
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const rows = await useDb().select({ r: rsvps, table: tables.name }).from(rsvps).leftJoin(tables, eq(tables.id, rsvps.tableId))
    .where(eq(rsvps.eventId, ev.id)).orderBy(asc(rsvps.name));
  const head = ['Nama', 'Telefon', 'Hadir', 'Pax', 'Pihak', 'Makanan', 'Meja', 'Nota', 'Sumber', 'Dikemas kini'];
  const fmt = (d: Date) => new Date(d.getTime() + 8 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ');
  const lines = [head, ...rows.map(({ r, table }) => [r.name, r.phone?.replace(/^\+/, '') ?? '', r.attending ? 'Ya' : 'Tidak', r.pax, r.side, r.meal, table, r.note, r.source === 'host' ? 'Tuan majlis' : 'Tetamu', fmt(r.updatedAt)])]
    .map(l => l.map(cell).join(','));
  setHeader(event, 'content-type', 'text/csv; charset=utf-8');
  setHeader(event, 'content-disposition', contentDisposition(`rsvp-${ev.slug}.csv`));
  return `﻿${lines.join('\r\n')}\r\n`;
});
