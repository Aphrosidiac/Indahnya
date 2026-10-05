import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { useDb, events, slugHistory } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { slugify, slugTaken, isUniqueViolation } from '../../../utils/slug';
import { PLANS, planClocks } from '../../../utils/plans';
import { readBodyAs } from '../../../utils/validate';
import { parseEventDate } from '../../../utils/dates';
import { rsvpSettings } from '../../../utils/rsvp';

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
    rsvp: z.object({
      deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), 'Tarikh tak sah').nullable(),
      maxPax: z.number().int().min(1).max(30),
      meals: z.array(z.string().trim().min(1).max(40)).max(6),
      sides: z.boolean(),
    }).partial().optional(),
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
    if (s.length < 3 || s.startsWith('deleted-')) throw createError({ statusCode: 400, statusMessage: 'Link tu tak boleh guna' });
    if (await slugTaken(s, ev.id)) throw createError({ statusCode: 409, statusMessage: 'Link tu dah ada orang guna' });
    if (s !== ev.slug) patch.slug = s;
  }
  /**
   * Settings are merged INTO the stored object by the database (jsonb ||),
   * only for the sections this request sent: a save from a stale tab cannot
   * undo what another writer set meanwhile (the retention mails' record, a
   * payment clearing it, a co-host's change to another section).
   */
  let settingsPatch: Record<string, unknown> | null = null;
  if (b.settings) {
    const s = b.settings;
    settingsPatch = {
      ...(s.locale !== undefined ? { locale: s.locale } : {}),
      ...(s.approvalMode !== undefined ? { approvalMode: s.approvalMode } : {}),
      ...(s.guestDeleteHours !== undefined ? { guestDeleteHours: s.guestDeleteHours } : {}),
      ...(s.modules ? { modules: { ...ev.settings.modules, ...s.modules } } : {}),
      ...(s.slideshow ? { slideshow: { ...ev.settings.slideshow, ...s.slideshow } } : {}),
      ...(s.rsvp ? { rsvp: { ...rsvpSettings(ev), ...s.rsvp } } : {}),
    };
  }
  if (!Object.keys(patch).length && !settingsPatch) return ev;
  const set = { ...patch, ...(settingsPatch ? { settings: sql`${events.settings} || ${JSON.stringify(settingsPatch)}::jsonb` } : {}) };
  try {
    return await useDb().transaction(async (tx) => {
      // the old link keeps working for this event and can never be taken by another one
      if (patch.slug) await tx.insert(slugHistory).values({ slug: ev.slug, eventId: ev.id }).onConflictDoNothing();
      const [row] = await tx.update(events).set(set as typeof patch).where(eq(events.id, ev.id)).returning();
      return row;
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw createError({ statusCode: 409, statusMessage: 'Link tu dah ada orang guna' });
    throw e;
  }
});
