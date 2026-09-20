import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { slugify, RESERVED } from '../../../utils/slug';
import { PLANS } from '../../../utils/plans';

const Url = z.string().url().or(z.literal('')).optional();
const Body = z.object({
  title: z.string().min(1).max(120).optional(),
  names: z.object({ a: z.string().min(1).max(60), b: z.string().max(60).optional(), short: z.string().max(60).optional() }).optional(),
  type: z.enum(['kahwin', 'aqiqah', 'birthday', 'corporate', 'graduation', 'lain']).optional(),
  date: z.string().nullable().optional(),
  venue: z.object({ name: z.string().max(120).optional(), address: z.string().max(300).optional(), waze: Url, gmaps: Url }).optional(),
  slug: z.string().min(3).max(48).optional(),
  settings: z.object({
    locale: z.enum(['ms', 'en']).optional(),
    approvalMode: z.boolean().optional(),
    modules: z.object({ gambar: z.boolean(), ucapan: z.boolean(), rsvp: z.boolean(), tempat: z.boolean(), kad: z.boolean() }).partial().optional(),
    slideshow: z.object({ intervalSec: z.number().int().min(3).max(60), showNames: z.boolean(), shuffle: z.boolean() }).partial().optional(),
    guestDeleteHours: z.number().int().min(0).max(72).optional(),
  }).optional(),
});

export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const b = Body.parse(await readBody(event));
  const patch: Partial<typeof events.$inferInsert> = {};
  if (b.title !== undefined) patch.title = b.title.trim();
  if (b.names) patch.names = b.names;
  if (b.type) patch.type = b.type;
  if (b.date !== undefined) {
    const d = b.date ? new Date(b.date) : null;
    if (d && Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Tarikh tak sah' });
    patch.date = d;
  }
  if (b.venue) patch.venue = { ...ev.venue, ...b.venue };
  if (b.slug !== undefined) {
    if (!PLANS[ev.plan].customSlug) throw createError({ statusCode: 402, statusMessage: 'Link sendiri untuk pakej berbayar' });
    const s = slugify(b.slug);
    if (s.length < 3 || RESERVED.has(s)) throw createError({ statusCode: 400, statusMessage: 'Link tu tak boleh guna' });
    const [hit] = await useDb().select({ id: events.id }).from(events).where(eq(events.slug, s));
    if (hit && hit.id !== ev.id) throw createError({ statusCode: 409, statusMessage: 'Link tu dah ada orang guna' });
    patch.slug = s;
  }
  if (b.settings) {
    patch.settings = {
      ...ev.settings, ...b.settings,
      modules: { ...ev.settings.modules, ...(b.settings.modules ?? {}) },
      slideshow: { ...ev.settings.slideshow, ...(b.settings.slideshow ?? {}) },
    } as typeof ev.settings;
  }
  const [row] = await useDb().update(events).set(patch).where(eq(events.id, ev.id)).returning();
  return row;
});
