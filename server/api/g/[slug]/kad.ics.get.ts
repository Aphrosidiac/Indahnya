import { eq } from 'drizzle-orm';
import { useDb, kad } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { kadView } from '../../../utils/kad';
import { kadStart } from '../../../../shared/utils/kad-view';

/**
 * "Simpan tarikh": the majlis as a calendar entry, in UTC (the kad's times
 * are Malaysian wall clock, converted by kadStart); without a start time it
 * is an all-day entry. Long lines are folded at 75 octets (RFC 5545).
 */
/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after a space. */
function fold(line: string) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (parts.length ? 74 : 75), bytes.length);
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--; // never split a UTF-8 character
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
  }
  return parts.join('\r\n ');
}
const esc = (s: string) => s.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`);
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.date) throw createError({ statusCode: 404, statusMessage: 'Tarikh belum ditetapkan' });
  const [row] = await useDb().select().from(kad).where(eq(kad.eventId, ev.id));
  const v = kadView(ev, row);
  const day = ev.date.toISOString().slice(0, 10).replace(/-/g, '');
  const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const site = useRuntimeConfig().public.siteUrl;
  // UTC instants: a TZID needs its own VTIMEZONE block, which Outlook insists on and Malaysia never needs (no DST)
  const start = v.time.start ? kadStart(ev.date, v.time.start)! : null;
  let end = v.time.end ? kadStart(ev.date, v.time.end)! : start ? new Date(start.getTime() + 4 * 3_600_000) : null;
  if (start && end && end <= start) end = new Date(end.getTime() + 86_400_000); // a malam majlis that ends after midnight
  const when = start && end ? [`DTSTART:${utc(start)}`, `DTEND:${utc(end)}`] : [`DTSTART;VALUE=DATE:${day}`];
  const title = ev.names.b ? `${v.title} ${ev.names.a} & ${ev.names.b}` : `${v.title} ${ev.names.a}`;
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Indahnya//Kad//MS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${ev.id}@indahnya.my`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    ...when,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc([v.venue.name, v.venue.address].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${esc(`${site}/${ev.slug}`)}`, `URL:${site}/${ev.slug}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(fold).join('\r\n');
  setHeader(event, 'content-type', 'text/calendar; charset=utf-8');
  setHeader(event, 'content-disposition', `attachment; filename="${ev.slug}.ics"`);
  return body;
});
