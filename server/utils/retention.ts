import type { EventSettings } from '../db';

interface Ev { storageEndsAt: Date; settings: EventSettings; deletedAt?: Date | null; purgedAt?: Date | null; purgeAfter?: Date | null }

const days = (n: number) => n * 86_400_000;

/** After storage ends, the gallery is kept this long (the grace month) before it is deleted. */
export const GRACE_DAYS = 30;
/** The final warning mail goes out at least this long before the purge. */
export const FINAL_NOTICE_DAYS = 7;
/** If no final warning could ever be delivered, the purge still happens this long after storage ends (and someone is alerted). */
export const HARD_STOP_DAYS = 45;
/** How long a deleted majlis can be restored. */
export const UNDO_DAYS = 7;

/**
 * Is this event due to be purged now? Asked by the sweep before queueing a
 * purge AND by the purge itself under a row lock, so a renewal paid in
 * between (or a restore) always wins over a purge queued before it.
 *
 *   deleted by the owner — once its undo window (`purgeAfter`) has passed;
 *   expired — storage end + the grace month, and never sooner than 7 days
 *             after the final warning mail went out; if none could ever be
 *             sent, 45 days after storage ended (alerted).
 */
export function purgeDue(ev: Ev, now = Date.now()): { due: boolean; unwarned?: boolean } {
  if (ev.purgedAt || ev.settings.demo || ev.settings.sandbox) return { due: false };
  if (ev.deletedAt) return { due: !!ev.purgeAfter && ev.purgeAfter.getTime() <= now };
  const end = ev.storageEndsAt.getTime();
  if (end + days(GRACE_DAYS) > now) return { due: false };
  const warned = ev.settings.finalWarningAt ? Date.parse(ev.settings.finalWarningAt) : NaN;
  // a warning that went out (however late) is honoured in full: "at least 7 days from now" means it
  if (Number.isFinite(warned)) return { due: warned + days(FINAL_NOTICE_DAYS) <= now };
  // never warned (mail impossible): the hard stop, and someone is alerted
  return end + days(HARD_STOP_DAYS) <= now ? { due: true, unwarned: true } : { due: false };
}

/**
 * A renewal can still be bought: the purge has not begun and will not be due
 * within the life of a checkout session (an hour, with margin). A payment
 * that still lands after the purge began is flagged for refund, never lost.
 */
export function renewable(ev: Ev & { purgeStartedAt?: Date | null }, now = Date.now()) {
  return !ev.purgeStartedAt && !ev.purgedAt && !ev.deletedAt && !purgeDue(ev, now + 2 * 3_600_000).due;
}
