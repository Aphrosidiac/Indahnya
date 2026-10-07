import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { useDb, rsvps, messages, guests } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { ensureGuest } from '../../../utils/guest';
import { rsvpSettings, rsvpOpen, findOwnRsvp } from '../../../utils/rsvp';
import { newId } from '../../../utils/ids';
import { readBodyAs } from '../../../utils/validate';
import { rateLimit, clientIp } from '../../../utils/rate';
import { msisdn } from '../../../../shared/utils/kad-templates';

const Body = z.object({
  name: z.string().trim().min(1, 'Isi nama').max(80),
  phone: z.string().trim().max(20).regex(/^(\+?[\d\s-]{8,20})?$/, 'Nombor telefon tak sah').optional(),
  attending: z.boolean(),
  pax: z.number().int().min(1).max(30).default(1),
  side: z.enum(['lelaki', 'perempuan', 'rakan', 'lain']).nullable().optional(),
  meal: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(300).optional(),
  /** An ucapan written in the same form — saved as its own wish, not as part of the reply. */
  ucapan: z.string().trim().max(500).optional(),
});

/**
 * Send or change a reply. One reply per browser. A number only claims a
 * reply the host entered from a call (see findOwnRsvp).
 * The host's seat assignment survives an edit, unless the guest now says
 * they are not coming.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.rsvp) throw createError({ statusCode: 404, statusMessage: 'RSVP ditutup' });
  if (ev.settings.demo) throw createError({ statusCode: 403, statusMessage: 'Ini kad contoh' });
  if (!rsvpOpen(ev)) throw createError({ statusCode: 410, statusMessage: 'RSVP dah ditutup' });
  const b = await readBodyAs(event, Body);
  // per IP first: a client that drops its cookie is a new guest on every request
  await rateLimit(`rsvp:ip:${clientIp(event)}`, 60, 10 * 60_000);
  const g = await ensureGuest(event, ev.id);
  await rateLimit(`rsvp:${g.id}`, 15, 10 * 60_000);
  const s = rsvpSettings(ev);
  if (b.attending && b.pax > s.maxPax) throw createError({ statusCode: 400, statusMessage: `Maksimum ${s.maxPax} orang untuk satu RSVP` });
  const meal = b.attending && b.meal && s.meals.includes(b.meal) ? b.meal : null;
  const phoneKey = b.phone ? msisdn(b.phone) : null;
  const db = useDb();
  const values = {
    name: b.name, phone: b.phone || null, phoneKey, attending: b.attending, pax: b.attending ? b.pax : 0,
    side: s.sides ? (b.side ?? null) : null, meal, note: b.note || null, updatedAt: new Date(),
  };
  // one writer per browser at a time (two open tabs), backed by the unique (event, guest) index
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`rsvp:${ev.id}:${g.id}`}))`);
    const own = await findOwnRsvp(ev.id, g.id, phoneKey, tx);
    if (own) {
      await tx.update(rsvps).set({ ...values, guestId: g.id, ...(b.attending ? {} : { tableId: null }) }).where(eq(rsvps.id, own.id));
    } else {
      await tx.insert(rsvps).values({ id: newId(), eventId: ev.id, guestId: g.id, source: 'guest', ...values });
    }
  });
  if (!g.name) await db.update(guests).set({ name: b.name.slice(0, 60) }).where(eq(guests.id, g.id));
  if (b.ucapan && ev.settings.modules.ucapan) {
    await db.insert(messages).values({ id: newId(), eventId: ev.id, guestId: g.id, name: b.name.slice(0, 60), kind: 'text', body: b.ucapan, status: ev.settings.approvalMode ? 'hidden' : 'visible' });
  }
  // the same answer either way: whether a number has replied before is nobody's business
  return { ok: true, attending: b.attending };
});
