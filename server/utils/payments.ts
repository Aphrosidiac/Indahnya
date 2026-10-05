import type Stripe from 'stripe';
import { and, eq, ne, sql } from 'drizzle-orm';
import { useDb, payments, events } from '../db';
import { stripe } from './stripe';
import { clocksAfterPayment, offers } from './plans';
import { opsAlert } from './alert';

const RANK = { free: 0, std: 1, full: 2 } as const;

/**
 * Apply a paid Checkout Session. Idempotent on the session id: Stripe
 * retries, and the success page also asks us to reconcile, sometimes in the
 * same second — so the open→paid step is one conditional UPDATE, and only
 * the request that wins it touches the event.
 *
 * A payment buys exactly what was priced at checkout (plan, kind, amount),
 * judged against the event NOW, under a lock on its row. If that offer no
 * longer exists — two people paid the same upgrade, the gallery was purged
 * or deleted meanwhile, the amount or currency is not what we priced — the
 * payment is recorded, flagged `needsRefund`, and someone is alerted. It is
 * never reinterpreted as something else.
 */
export async function applyPaidSession(s: Pick<Stripe.Checkout.Session, 'id' | 'amount_total' | 'currency' | 'payment_intent'>) {
  const now = new Date();
  const intent = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? null;
  const out = await useDb().transaction(async (tx) => {
    const [p] = await tx.update(payments).set({ status: 'paid', paidAt: now, stripePaymentIntent: intent })
      .where(and(eq(payments.stripeSessionId, s.id), ne(payments.status, 'paid'))).returning();
    if (!p) return null; // unknown, or another request already applied it
    const [ev] = await tx.select().from(events).where(eq(events.id, p.eventId)).for('update');
    const refund = async (why: string) => {
      await tx.update(payments).set({ needsRefund: true, note: why }).where(eq(payments.id, p.id));
      return { p, applied: false as const, why };
    };
    if (!ev) return refund('event not found');
    if (s.amount_total !== p.amountCents || (s.currency ?? '').toLowerCase() !== 'myr') return refund(`paid ${s.amount_total} ${s.currency}, priced ${p.amountCents} myr`);
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
    opsAlert('Payment needs a refund', `Stripe session ${s.id} (payment ${intent ?? '?'}), event ${out.p.eventId}: ${out.why}`);
    return out;
  }
  await expireSiblings(out.p.eventId, s.id);
  return out;
}

/** The event's other open sessions were priced against the state that just changed: close them so they cannot be paid. */
async function expireSiblings(eventId: string, paidSession: string) {
  const open = await useDb().select({ id: payments.stripeSessionId }).from(payments)
    .where(and(eq(payments.eventId, eventId), eq(payments.status, 'open'), ne(payments.stripeSessionId, paidSession)));
  for (const o of open) {
    try {
      await stripe().checkout.sessions.expire(o.id);
      await useDb().update(payments).set({ status: 'expired' }).where(and(eq(payments.stripeSessionId, o.id), eq(payments.status, 'open')));
    } catch (e) {
      // already completed or expired at Stripe: the webhook will tell us which
      console.warn('[stripe] could not expire', o.id, (e as Error).message);
    }
  }
}
