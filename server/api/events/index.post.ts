import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, events, eventMembers, kad } from '../../db';
import { requireUser } from '../../utils/session';
import { newId, newToken } from '../../utils/ids';
import { slugify, RESERVED } from '../../utils/slug';
import { defaultSettings, planClocks } from '../../utils/events';

const Body = z.object({
  type: z.enum(['kahwin', 'aqiqah', 'birthday', 'corporate', 'graduation', 'lain']).default('kahwin'),
  names: z.object({ a: z.string().min(1).max(60), b: z.string().max(60).optional() }),
  title: z.string().max(120).optional(),
  date: z.string().nullable().optional(),
  venue: z.object({ name: z.string().max(120).optional(), address: z.string().max(300).optional() }).default({}),
  locale: z.enum(['ms', 'en']).default('ms'),
});

/** The create wizard. A slug is minted from the names; a collision gets a short suffix. */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const b = Body.parse(await readBody(event));
  const db = useDb();
  const title = b.title?.trim() || (b.names.b ? `${b.names.a} & ${b.names.b}` : b.names.a);
  let base = slugify(b.names.b ? `${b.names.a}-${b.names.b}` : b.names.a) || 'majlis';
  if (RESERVED.has(base)) base = `majlis-${base}`;
  let slug = base;
  for (let i = 0; ; i++) {
    const [hit] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
    if (!hit) break;
    slug = `${base}-${newId().slice(-4).toLowerCase()}`;
    if (i > 5) throw createError({ statusCode: 500, statusMessage: 'Slug clash' });
  }
  const date = b.date ? new Date(b.date) : null;
  if (date && Number.isNaN(date.getTime())) throw createError({ statusCode: 400, statusMessage: 'Tarikh tak sah' });
  const settings = { ...defaultSettings(), locale: b.locale };
  const [ev] = await db.insert(events).values({
    id: newId(), ownerId: u.id, slug, type: b.type, title, names: b.names,
    date, venue: b.venue, settings, tvToken: newToken(), ...planClocks('free'),
  }).returning();
  await db.insert(eventMembers).values({ eventId: ev!.id, userId: u.id, role: 'owner' });
  await db.insert(kad).values({ eventId: ev!.id });
  return ev;
});
