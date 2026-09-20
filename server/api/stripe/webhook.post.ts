import { eq } from 'drizzle-orm';
import { useDb, payments, events } from '../../db';
import { stripe } from '../../utils/stripe';
import { planClocks } from '../../utils/events';

/**
 * `checkout.session.completed` flips the plan. Idempotent on the session id:
 * Stripe retries, and the success page also asks us to reconcile.
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
  if (evt.type === 'checkout.session.expired') {
    await useDb().update(payments).set({ status: 'expired' }).where(eq(payments.stripeSessionId, evt.data.object.id));
  }
  return { received: true };
});

export async function applyPaidSession(sessionId: string) {
  const db = useDb();
  const [p] = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId));
  if (!p || p.status === 'paid') return p;
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(payments).set({ status: 'paid', paidAt: now }).where(eq(payments.id, p.id));
    const [ev] = await tx.select().from(events).where(eq(events.id, p.eventId));
    if (!ev) return;
    // never shorten a clock the host already has
    const c = planClocks(p.plan, now);
    await tx.update(events).set({
      plan: p.plan, planPaidAt: now,
      uploadWindowEndsAt: c.uploadWindowEndsAt > ev.uploadWindowEndsAt ? c.uploadWindowEndsAt : ev.uploadWindowEndsAt,
      storageEndsAt: c.storageEndsAt > ev.storageEndsAt ? c.storageEndsAt : ev.storageEndsAt,
    }).where(eq(events.id, ev.id));
  });
  return { ...p, status: 'paid' as const };
}
