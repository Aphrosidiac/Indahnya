import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, events, eventMembers, kad } from '../../db';
import { requireUser } from '../../utils/session';
import { newId, newToken } from '../../utils/ids';
import { slugify, RESERVED } from '../../utils/slug';
import { defaultSettings } from '../../utils/events';
import { planClocks } from '../../utils/plans';
import { readBodyAs } from '../../utils/validate';
import { rateLimit } from '../../utils/rate';
import { parseEventDate } from '../../utils/dates';

const Body = z.object({
  type: z.enum(['kahwin', 'aqiqah', 'birthday', 'corporate', 'graduation', 'lain']).default('kahwin'),
  names: z.object({ a: z.string().trim().min(1).max(60), b: z.string().trim().max(60).optional() }),
  title: z.string().trim().max(120).optional(),
  date: z.string().max(40).nullable().optional(),
  venue: z.object({ name: z.string().trim().max(120).optional(), address: z.string().trim().max(300).optional() }).default({}),
  locale: z.enum(['ms', 'en']).default('ms'),
});

/** The create wizard. A slug is minted from the names; a collision gets a short suffix. */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const b = await readBodyAs(event, Body);
  rateLimit(`create:${u.id}`, 20, 3_600_000);
  const db = useDb();
  const names = { a: b.names.a, ...(b.names.b ? { b: b.names.b } : {}) };
  const title = b.title || (names.b ? `${names.a} & ${names.b}` : names.a);
  let base = slugify(names.b ? `${names.a}-${names.b}` : names.a) || 'majlis';
  if (base.length < 3 || RESERVED.has(base)) base = `majlis-${base}`.replace(/-$/, '');
  let slug = base;
  for (let i = 0; ; i++) {
    const [hit] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
    if (!hit) break;
    slug = `${base}-${newId().slice(-4).toLowerCase()}`;
    if (i > 5) throw createError({ statusCode: 500, statusMessage: 'Slug clash' });
  }
  const date = parseEventDate(b.date);
  const settings = { ...defaultSettings(), locale: b.locale };
  const ev = await db.transaction(async (tx) => {
    const [row] = await tx.insert(events).values({
      id: newId(), ownerId: u.id, slug, type: b.type, title, names,
      date, venue: b.venue, settings, tvToken: newToken(), ...planClocks('free', new Date(), date),
    }).returning();
    await tx.insert(eventMembers).values({ eventId: row!.id, userId: u.id, role: 'owner' });
    await tx.insert(kad).values({ eventId: row!.id });
    return row!;
  });
  const { tvToken: _t, ...out } = ev;
  return out;
});
