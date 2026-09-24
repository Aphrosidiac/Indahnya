import { and, eq, ne, sql } from 'drizzle-orm';
import { useDb, payments, events } from '../../db';
import { stripe } from '../../utils/stripe';
import { clocksAfterPayment } from '../../utils/plans';

/**
 * `checkout.session.completed` flips the plan. Idempotent on the session id:
 * Stripe retries, and the success page also asks us to reconcile, sometimes
 * in the same second — so the open→paid step is one conditional UPDATE, and
 * only the request that wins it touches the event.
 */
export default defineEventHandler(async (event) => {
  const { stripe: cfg } = useRuntimeConfig();
  const sig = getHeader(event, 'stripe-signature');
  const raw = await readRawBody(event);
  if (!sig || !raw) throw createError({ statusCode: 400 });
  let evt;
  try { evt = stripe().webhooks.constructEvent(raw, sig, cfg.webhookSecret); }
  catch { throw createError({ statusCode: 400, statusMessage: 'Bad signature' }); }
  if (evt.type === 'checkout.session.completed' || evt.type === 'checkout.session.async_payment_succeeded') {
    const s = evt.data.object;
    if (s.payment_status === 'paid') await applyPaidSession(s.id);
  }
  if (evt.type === 'checkout.session.expired' || evt.type === 'checkout.session.async_payment_failed') {
    await useDb().update(payments).set({ status: 'expired' })
      .where(and(eq(payments.stripeSessionId, evt.data.object.id), eq(payments.status, 'open')));
  }
  return { received: true };
});

const RANK = { free: 0, std: 1, full: 2 } as const;

export async function applyPaidSession(sessionId: string) {
  const db = useDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [p] = await tx.update(payments).set({ status: 'paid', paidAt: now })
      .where(and(eq(payments.stripeSessionId, sessionId), ne(payments.status, 'paid'))).returning();
    if (!p) return null; // unknown, or another request already applied it
    const [ev] = await tx.select().from(events).where(eq(events.id, p.eventId)).for('update');
    if (!ev) return p;
    if (ev.purgedAt || ev.deletedAt) {
      // paid inside the session's 24 h after the gallery was purged or deleted: nothing to extend
      console.error(`[stripe] REFUND NEEDED: session ${sessionId} paid for ${ev.deletedAt ? 'deleted' : 'purged'} event ${ev.id}`);
      return p;
    }
    const kind = RANK[p.plan] > RANK[ev.plan] ? 'upgrade' : 'renew';
    const plan = RANK[p.plan] > RANK[ev.plan] ? p.plan : ev.plan;
    const c = clocksAfterPayment(ev, kind, p.plan, now);
    await tx.update(events).set({
      plan, planPaidAt: now, ...c,
      // the retention mails start over for the new clock
      settings: sql`${events.settings} - 'notified'`,
    }).where(eq(events.id, ev.id));
    return p;
  });
}
