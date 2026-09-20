import { and, eq, sql, count } from 'drizzle-orm';
import { useDb, events, media, type EventSettings, type Plan } from '../db';
import { PLANS, days } from './plans';

export const defaultSettings = (): EventSettings => ({
  locale: 'ms',
  approvalMode: false,
  modules: { gambar: true, ucapan: true, rsvp: true, tempat: false, kad: true },
  slideshow: { intervalSec: 7, showNames: true, shuffle: false },
  guestDeleteHours: 24,
});

/** Paying stretches both clocks from the moment of payment, not from the event date. */
export function planClocks(plan: Plan, from = new Date()) {
  const p = PLANS[plan];
  return {
    uploadWindowEndsAt: new Date(from.getTime() + days(p.uploadWindowDays)),
    storageEndsAt: new Date(from.getTime() + days(p.storageDays)),
  };
}

export async function mediaCounts(eventId: string) {
  const rows = await useDb().select({ status: media.status, n: count() }).from(media)
    .where(eq(media.eventId, eventId)).groupBy(media.status);
  const out = { ready: 0, hidden: 0, pending: 0, uploaded: 0, failed: 0, deleted: 0 };
  for (const r of rows) (out as Record<string, number>)[r.status] = Number(r.n);
  return out;
}

/** Uploads that count against the cap: everything a guest finished sending that is not deleted or failed. */
export async function uploadsUsed(eventId: string) {
  const [r] = await useDb().select({ n: count() }).from(media)
    .where(and(eq(media.eventId, eventId), sql`${media.status} not in ('deleted','failed')`));
  return Number(r?.n ?? 0);
}

export function uploadsOpen(ev: typeof events.$inferSelect) {
  return !ev.purgedAt && ev.uploadWindowEndsAt.getTime() > Date.now();
}

export function publicEvent(ev: typeof events.$inferSelect) {
  const p = PLANS[ev.plan];
  return {
    id: ev.id, slug: ev.slug, type: ev.type, title: ev.title, names: ev.names, date: ev.date, venue: ev.venue,
    plan: ev.plan, badge: !p.badgeFree,
    settings: { locale: ev.settings.locale, modules: ev.settings.modules, approvalMode: ev.settings.approvalMode, guestDeleteHours: ev.settings.guestDeleteHours },
    uploadsOpen: uploadsOpen(ev), uploadWindowEndsAt: ev.uploadWindowEndsAt, storageEndsAt: ev.storageEndsAt, purged: !!ev.purgedAt,
  };
}
