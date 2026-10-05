import { and, eq, sql, count } from 'drizzle-orm';
import { useDb, events, media, type EventSettings } from '../db';
import { PLANS } from './plans';

export const defaultSettings = (): EventSettings => ({
  locale: 'ms',
  approvalMode: false,
  modules: { gambar: true, ucapan: true, rsvp: true, tempat: false, kad: true },
  slideshow: { intervalSec: 7, showNames: true, shuffle: false },
  guestDeleteHours: 24,
  rsvp: { deadline: null, maxPax: 5, meals: [], sides: true },
});

export async function mediaCounts(eventId: string) {
  const rows = await useDb().select({ status: media.status, n: count() }).from(media)
    .where(eq(media.eventId, eventId)).groupBy(media.status);
  const out = { ready: 0, hidden: 0, pending: 0, uploaded: 0, failed: 0, deleted: 0 };
  for (const r of rows) (out as Record<string, number>)[r.status] = Number(r.n);
  return out;
}

/**
 * How long an asked-for upload slot holds its place in a capped gallery. A
 * slot is a reservation, not a photo: past this, a slot whose bytes have not
 * arrived stops counting (it can still finish, if there is room then — see
 * the complete step). Without it, anyone could fill a free gallery's 50 with
 * slots they never use, and a guest who picked 30 photos on bad wifi and
 * walked away locked everyone out for hours.
 */
export const SLOT_HOLD_MIN = 20;

/** Uploads that count against the cap: everything sent and not deleted or failed, plus slots still inside their hold. */
export async function uploadsUsed(eventId: string, db: Pick<ReturnType<typeof useDb>, 'select'> = useDb(), exceptId?: string) {
  const [r] = await db.select({ n: count() }).from(media)
    .where(and(eq(media.eventId, eventId), sql`${media.status} not in ('deleted','failed')`,
      sql`(${media.status} <> 'pending' or ${media.createdAt} > now() - make_interval(mins => ${SLOT_HOLD_MIN}))`,
      ...(exceptId ? [sql`${media.id} <> ${exceptId}`] : [])));
  return Number(r?.n ?? 0);
}

export function uploadsOpen(ev: typeof events.$inferSelect) {
  return !ev.purgedAt && !ev.deletedAt && !ev.settings.demo && ev.uploadWindowEndsAt.getTime() > Date.now();
}

/** What a guest's browser is told about the majlis. No clocks it does not need, no tokens. */
export function publicEvent(ev: typeof events.$inferSelect) {
  const p = PLANS[ev.plan];
  return {
    id: ev.id, slug: ev.slug, type: ev.type, title: ev.title, names: ev.names, date: ev.date, venue: ev.venue,
    plan: ev.plan, badge: !p.badgeFree, demo: !!ev.settings.demo,
    settings: { locale: ev.settings.locale, modules: ev.settings.modules, approvalMode: ev.settings.approvalMode, guestDeleteHours: ev.settings.guestDeleteHours },
    uploadsOpen: uploadsOpen(ev), uploadWindowEndsAt: ev.uploadWindowEndsAt, storageEndsAt: ev.storageEndsAt, purged: !!ev.purgedAt,
  };
}
