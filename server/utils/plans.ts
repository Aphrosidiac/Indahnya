import type { Plan } from '../db/schema';

/**
 * The pricing table from PLAN.md, as numbers. Free is limited by count and
 * retention, never by features.
 *
 * Both clocks (upload window, storage) run from the LATER of "now" and the
 * day of the majlis. A couple who sets up two months early must not find
 * uploads closed on the day itself — a clock that starts at creation made a
 * free event's gallery expire before the wedding it was made for.
 */
export const PLANS: Record<Plan, {
  name: string; priceCents: number; uploadCap: number | null;
  uploadWindowDays: number; storageDays: number; cohosts: number; customSlug: boolean; badgeFree: boolean;
}> = {
  free: { name: 'Percuma',          priceCents: 0,    uploadCap: 50,   uploadWindowDays: 30,  storageDays: 30,  cohosts: 0, customSlug: false, badgeFree: false },
  std:  { name: 'Indahnya',         priceCents: 5900, uploadCap: null, uploadWindowDays: 183, storageDays: 365, cohosts: 1, customSlug: true,  badgeFree: false },
  full: { name: 'Indahnya Lengkap', priceCents: 9900, uploadCap: null, uploadWindowDays: 365, storageDays: 730, cohosts: 5, customSlug: true,  badgeFree: true },
};

export const MEDIA_LIMITS = {
  photoBytes: 40 * 1024 * 1024,
  videoBytes: 100 * 1024 * 1024,
  videoSec: 60,
  audioBytes: 10 * 1024 * 1024,
  audioSec: 60,
  filesPerBatch: 30,
  /** Slots one browser may hold open (asked for, not yet sent) at once. */
  pendingPerGuest: 90,
};

export const days = (n: number) => n * 86_400_000;
const RANK: Record<Plan, number> = { free: 0, std: 1, full: 2 };
/** A renewal is offered once storage has less than this left (or has already ended). */
export const RENEW_WINDOW_DAYS = 30;
/** How far ahead a majlis date may push a clock (weddings are booked ~18 months out). Stops "date: 2099" from buying free storage. */
const MAX_LEAD_DAYS = 540;

/** The moment both clocks start: the later of `from` and the end of the majlis day. */
export function clockAnchor(from: Date, eventDate: Date | null | undefined) {
  if (!eventDate) return from;
  const endOfDay = Math.min(eventDate.getTime() + days(1), from.getTime() + days(MAX_LEAD_DAYS));
  return new Date(Math.max(from.getTime(), endOfDay));
}

export function planClocks(plan: Plan, from: Date, eventDate: Date | null | undefined) {
  const p = PLANS[plan];
  const a = clockAnchor(from, eventDate).getTime();
  return { uploadWindowEndsAt: new Date(a + days(p.uploadWindowDays)), storageEndsAt: new Date(a + days(p.storageDays)) };
}

const later = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b);

interface ClockState { plan: Plan; date: Date | null; uploadWindowEndsAt: Date; storageEndsAt: Date; purgedAt: Date | null; deletedAt?: Date | null; planPaidAt?: Date | null }

export type Offer = { plan: Exclude<Plan, 'free'>; kind: 'upgrade' | 'renew'; cents: number };

/**
 * What this event may buy right now, and for how much.
 *   - a higher plan: an upgrade. From a paid plan, only the difference is charged.
 *   - the same paid plan: a renewal, offered in the last 30 days of storage or
 *     during the grace month after it — "extend by paying again".
 * Nothing for a purged or deleted event: there is nothing left to extend.
 */
export function offers(ev: ClockState, now = new Date()): Offer[] {
  if (ev.purgedAt || ev.deletedAt) return [];
  const out: Offer[] = [];
  for (const plan of ['std', 'full'] as const) {
    if (RANK[plan] > RANK[ev.plan]) {
      out.push({ plan, kind: 'upgrade', cents: PLANS[plan].priceCents - PLANS[ev.plan].priceCents });
    } else if (plan === ev.plan && ev.storageEndsAt.getTime() - now.getTime() < days(RENEW_WINDOW_DAYS)) {
      out.push({ plan, kind: 'renew', cents: PLANS[plan].priceCents });
    }
  }
  return out;
}

/**
 * The clocks after a paid session. Never shorter than what the host has.
 *   upgrade — from free: the new plan's windows from max(paid, majlis day).
 *             From a paid plan: from the SAME anchor the paid plan started
 *             at. The difference buys the longer plan, not a fresh clock —
 *             otherwise a host near expiry pays RM40 for two new years
 *             instead of RM59 for one.
 *   renew   — storage continues from where it ends (or from now, in grace);
 *             the upload window reopens from now.
 */
export function clocksAfterPayment(ev: ClockState, kind: Offer['kind'], plan: Plan, paidAt: Date) {
  const p = PLANS[plan];
  if (kind === 'renew') {
    return {
      uploadWindowEndsAt: later(ev.uploadWindowEndsAt, new Date(paidAt.getTime() + days(p.uploadWindowDays))),
      storageEndsAt: new Date(later(ev.storageEndsAt, paidAt).getTime() + days(p.storageDays)),
    };
  }
  const from = ev.plan !== 'free' && ev.planPaidAt ? ev.planPaidAt : paidAt;
  const c = planClocks(plan, from, ev.date);
  return { uploadWindowEndsAt: later(ev.uploadWindowEndsAt, c.uploadWindowEndsAt), storageEndsAt: later(ev.storageEndsAt, c.storageEndsAt) };
}
