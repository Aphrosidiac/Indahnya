import type Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { useDb, payments } from '../../db';
import { stripe } from '../../utils/stripe';
import { applyPaidSession } from '../../utils/payments';
import { opsAlert } from '../../utils/alert';

/**
 * Stripe's events, verified against the raw body. Subscribe the endpoint to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   charge.refunded, charge.dispute.created
 *
 * An event from the other mode (a test event reaching the live server, or
 * the reverse) is acknowledged and ignored. A database error answers 500,
 * so Stripe retries it.
 */
export default defineEventHandler(async (event) => {
  const { stripe: cfg } = useRuntimeConfig();
  const sig = getHeader(event, 'stripe-signature');
  const raw = await readRawBody(event);
  if (!sig || !raw || !cfg.webhookSecret) throw createError({ statusCode: 400 });
  let evt: Stripe.Event;
  try { evt = stripe().webhooks.constructEvent(raw, sig, cfg.webhookSecret); }
  catch { throw createError({ statusCode: 400, statusMessage: 'Bad signature' }); }
  if (evt.livemode !== cfg.secretKey.startsWith('sk_live')) {
    console.warn(`[stripe] ignored ${evt.livemode ? 'live' : 'test'} event ${evt.id} on a ${evt.livemode ? 'test' : 'live'} server`);
    return { received: true };
  }
  const db = useDb();
  switch (evt.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = evt.data.object;
      // FPX can complete the session before the money moves: wait for async_payment_succeeded
      if (s.payment_status === 'paid') {
        const r = await applyPaidSession(s);
        if (r === null) {
          const [known] = await db.select({ id: payments.id }).from(payments).where(eq(payments.stripeSessionId, s.id));
          if (!known) console.warn(`[stripe] paid session ${s.id} is not one of ours`);
        }
      }
      break;
    }
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      await db.update(payments).set({ status: 'expired' })
        .where(and(eq(payments.stripeSessionId, evt.data.object.id), eq(payments.status, 'open')));
      break;
    case 'charge.refunded': {
      const ch = evt.data.object;
      const intent = typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent?.id;
      if (!intent) break;
      const [p] = await db.update(payments).set({ status: 'refunded', needsRefund: false })
        .where(eq(payments.stripePaymentIntent, intent)).returning({ eventId: payments.eventId });
      // the plan is NOT taken back automatically: a refund is a decision someone made, and they decide this too
      if (p && ch.refunded) opsAlert('Payment refunded', `Payment ${intent} for event ${p.eventId} was refunded in full. The event keeps its plan until someone changes it.`);
      break;
    }
    case 'charge.dispute.created': {
      const d = evt.data.object;
      opsAlert('Payment disputed', `Dispute ${d.id} on charge ${typeof d.charge === 'string' ? d.charge : d.charge.id}: RM${(d.amount / 100).toFixed(2)}, reason ${d.reason}. Respond in the Stripe dashboard.`);
      break;
    }
  }
  return { received: true };
});
