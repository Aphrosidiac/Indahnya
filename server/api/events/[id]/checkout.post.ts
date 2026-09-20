import { z } from 'zod';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { stripe } from '../../../utils/stripe';
import { PLANS } from '../../../utils/plans';
import { newId } from '../../../utils/ids';

const Body = z.object({ plan: z.enum(['std', 'full']) });

/**
 * One Checkout Session per attempt. Prices are created inline (RM, one-time)
 * so no dashboard product setup is needed; STRIPE_PRICE_* override that when
 * set. FPX, cards and GrabPay are whatever the Stripe MY account has enabled —
 * `automatic` lets Stripe pick from that.
 */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { plan } = Body.parse(await readBody(event));
  if (ev.plan === 'full' || (ev.plan === 'std' && plan === 'std')) throw createError({ statusCode: 400, statusMessage: 'Pakej ni dah aktif' });
  const p = PLANS[plan];
  const { stripe: cfg, public: pub } = useRuntimeConfig();
  const priceId = plan === 'std' ? cfg.priceStd : cfg.priceFull;
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [priceId
      ? { price: priceId, quantity: 1 }
      : { quantity: 1, price_data: { currency: 'myr', unit_amount: p.priceCents, product_data: { name: `${p.name} — ${ev.title}`, description: 'Indahnya, bayaran sekali untuk satu majlis' } } }],
    success_url: `${pub.siteUrl}/app/${ev.id}?paid=1`,
    cancel_url: `${pub.siteUrl}/app/${ev.id}/tetapan`,
    metadata: { eventId: ev.id, plan, userId: user.id },
  });
  await useDb().insert(payments).values({ id: newId(), eventId: ev.id, userId: user.id, stripeSessionId: session.id, plan, amountCents: p.priceCents });
  return { url: session.url };
});
