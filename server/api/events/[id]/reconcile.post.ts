import { and, eq, desc } from 'drizzle-orm';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { stripe } from '../../../utils/stripe';
import { applyPaidSession } from '../../../utils/payments';

/** The success page lands before the webhook sometimes: ask Stripe directly about every open session of the event. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const open = await useDb().select().from(payments).where(and(eq(payments.eventId, ev.id), eq(payments.status, 'open'))).orderBy(desc(payments.createdAt)).limit(5);
  let paid = false, applied = false;
  for (const p of open) {
    const s = await stripe().checkout.sessions.retrieve(p.stripeSessionId);
    if (s.payment_status !== 'paid') continue;
    paid = true;
    const r = await applyPaidSession(s);
    if (r?.applied) applied = true;
  }
  return { paid, applied };
});
