import { and, eq, ne, sql, inArray } from 'drizzle-orm';
import { useDb, payments, events } from '../db';
import { type ChipPurchase, isPaid, cancelPurchase } from './chip';
import { clocksAfterPayment, offers } from './plans';
import { opsAlert } from './alert';

const RANK = { free: 0, std: 1, full: 2 } as const;

/**
 * Apply a paid CHIP purchase. Idempotent on the purchase id: CHIP retries and
 * may deliver twice, the success callback and the webhook both say "paid", and
 * the return page also asks us to reconcile, sometimes in the same second — so
 * the open→paid step is one conditional UPDATE, and only the request that wins
 * it touches the event.
 *
 * A payment buys exactly what was priced at checkout (plan, kind, amount),
 * judged against the event NOW, under a lock on its row. If that offer no
 * longer exists — two people paid the same upgrade, the gallery was purged
 * or deleted meanwhile, the amount or currency is not what we priced — the
 * payment is recorded, flagged `needsRefund`, and someone is alerted. It is
 * never reinterpreted as something else.
 */
export async function applyPaidPurchase(s: ChipPurchase) {
  if (!isPaid(s.status)) return null;
  const now = new Date();
  const amount = s.payment?.amount ?? s.purchase.total;
  const currency = (s.payment?.currency ?? s.purchase.currency ?? '').toLowerCase();
  const method = s.transaction_data?.payment_method || null;
  const out = await useDb().transaction(async (tx) => {
    // an `expired` row can still be paid: a buyer on the checkout page when it lapsed (FPX resolving late)
    const [p] = await tx.update(payments).set({ status: 'paid', paidAt: now, method })
      .where(and(eq(payments.chipPurchaseId, s.id), inArray(payments.status, ['open', 'expired']))).returning();
    if (!p) return null; // unknown, already applied, or refunded (a late redelivery must not apply it again)
    const [ev] = await tx.select().from(events).where(eq(events.id, p.eventId)).for('update');
    const refund = async (why: string) => {
      await tx.update(payments).set({ needsRefund: true, note: why }).where(eq(payments.id, p.id));
      return { p, applied: false as const, why };
    };
    if (!ev) return refund('event not found');
    if (amount !== p.amountCents || currency !== 'myr') return refund(`paid ${amount} ${currency}, priced ${p.amountCents} myr`);
    if (ev.purgedAt || ev.purgeStartedAt || ev.deletedAt) return refund(`event ${ev.deletedAt ? 'deleted' : 'purged'} before the payment landed`);
    // payments made before `kind` was recorded: read it the way checkout would have priced it
    const kind = p.kind ?? (RANK[p.plan] > RANK[ev.plan] ? 'upgrade' : 'renew');
    const offer = offers(ev, now, { applying: true }).find(o => o.plan === p.plan && o.kind === kind && o.cents === p.amountCents);
    if (!offer) return refund(`the ${kind} to ${p.plan} for RM${(p.amountCents / 100).toFixed(2)} is no longer on offer (plan now ${ev.plan})`);
    const c = clocksAfterPayment(ev, kind, p.plan, now);
    await tx.update(events).set({
      plan: kind === 'upgrade' ? p.plan : ev.plan,
      // a renewal keeps the anchor the paid plan started from (a later upgrade is priced from it)
      planPaidAt: kind === 'upgrade' ? now : ev.planPaidAt ?? now,
      ...c,
      // the retention mails start over for the new clock
      settings: sql`${events.settings} - 'notified' - 'finalWarningAt'`,
    }).where(eq(events.id, ev.id));
    return { p, applied: true as const, why: '' };
  });
  if (!out) return null;
  if (!out.applied) {
    opsAlert('Payment needs a refund', `CHIP purchase ${s.id} (${method ?? 'method unknown'}), event ${out.p.eventId}: ${out.why}. Refund it in the CHIP portal.`);
    return out;
  }
  await expireSiblings(out.p.eventId, s.id);
  return out;
}

/** The event's other open purchases were priced against the state that just changed: cancel them so they cannot be paid. */
async function expireSiblings(eventId: string, paidPurchase: string) {
  const open = await useDb().select({ id: payments.chipPurchaseId }).from(payments)
    .where(and(eq(payments.eventId, eventId), eq(payments.status, 'open'), ne(payments.chipPurchaseId, paidPurchase)));
  for (const o of open) {
    try {
      const c = await cancelPurchase(o.id);
      // paid in the meantime: let the paid event apply it (or flag it for a refund), never mark it expired
      if (isPaid(c.status)) { await applyPaidPurchase(c); continue; }
      await useDb().update(payments).set({ status: 'expired' }).where(and(eq(payments.chipPurchaseId, o.id), eq(payments.status, 'open')));
    } catch (e) {
      // already paid or no longer payable at CHIP: its own event or the next reconcile settles it
      console.warn('[chip] could not cancel', o.id, (e as Error).message);
    }
  }
}
