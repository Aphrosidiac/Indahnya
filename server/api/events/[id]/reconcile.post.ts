import { and, eq, desc } from 'drizzle-orm';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { stripe } from '../../../utils/stripe';
import { applyPaidSession } from '../../stripe/webhook.post';

/** The success page lands before the webhook sometimes; ask Stripe directly about the newest open session. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [p] = await useDb().select().from(payments).where(and(eq(payments.eventId, ev.id), eq(payments.status, 'open'))).orderBy(desc(payments.createdAt)).limit(1);
  if (!p) return { paid: false, applied: false };
  const s = await stripe().checkout.sessions.retrieve(p.stripeSessionId);
  if (s.payment_status !== 'paid') return { paid: false, applied: false };
  await applyPaidSession(s.id);
  return { paid: true, applied: true };
});
