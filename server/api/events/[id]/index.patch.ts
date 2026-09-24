import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { slugify, RESERVED } from '../../../utils/slug';
import { PLANS, planClocks } from '../../../utils/plans';
import { readBodyAs } from '../../../utils/validate';
import { parseEventDate } from '../../../utils/dates';

/** Waze/Maps links are rendered as <a href> on a public page: http(s) only, never javascript:. */
const Url = z.string().trim().max(500).refine(v => v === '' || /^https:\/\//i.test(v), 'Link mesti bermula dengan https://').optional();
const Body = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  names: z.object({ a: z.string().trim().min(1).max(60), b: z.string().trim().max(60).optional(), short: z.string().trim().max(60).optional() }).optional(),
  type: z.enum(['kahwin', 'aqiqah', 'birthday', 'corporate', 'graduation', 'lain']).optional(),
  date: z.string().max(40).nullable().optional(),
  venue: z.object({ name: z.string().trim().max(120).optional(), address: z.string().trim().max(300).optional(), waze: Url, gmaps: Url }).optional(),
  slug: z.string().max(60).optional(),
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
  if (ev.purgedAt) throw createError({ statusCode: 410, statusMessage: 'Majlis ni dah tamat simpanan' });
  const b = await readBodyAs(event, Body);
  const patch: Partial<typeof events.$inferInsert> = {};
  if (b.title !== undefined) patch.title = b.title;
  if (b.names) patch.names = { a: b.names.a, ...(b.names.b ? { b: b.names.b } : {}), ...(b.names.short ? { short: b.names.short } : {}) };
  if (b.type) patch.type = b.type;
  if (b.date !== undefined) {
    patch.date = parseEventDate(b.date);
    // A postponed majlis moves the clocks with it; an earlier one never takes
    // time away. Only while the majlis is still ahead and storage is live —
    // re-dating a finished or expired event must not buy it more time.
    const now = Date.now();
    const ahead = !ev.date || ev.date.getTime() + 86_400_000 > now;
    if (ahead && ev.storageEndsAt.getTime() > now && patch.date) {
      const c = planClocks(ev.plan, ev.planPaidAt ?? ev.createdAt, patch.date);
      if (c.uploadWindowEndsAt > ev.uploadWindowEndsAt) patch.uploadWindowEndsAt = c.uploadWindowEndsAt;
      if (c.storageEndsAt > ev.storageEndsAt) patch.storageEndsAt = c.storageEndsAt;
    }
  }
  if (b.venue) patch.venue = { ...ev.venue, ...b.venue };
  if (b.slug !== undefined && b.slug !== ev.slug) {
    if (!PLANS[ev.plan].customSlug) throw createError({ statusCode: 402, statusMessage: 'Link sendiri untuk pakej berbayar' });
    const s = slugify(b.slug);
    if (s.length < 3 || RESERVED.has(s) || s.startsWith('deleted-')) throw createError({ statusCode: 400, statusMessage: 'Link tu tak boleh guna' });
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
  if (!Object.keys(patch).length) return ev;
  const [row] = await useDb().update(events).set(patch).where(eq(events.id, ev.id)).returning();
  return row;
});
