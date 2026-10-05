import { z } from 'zod';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { stripe } from '../../../utils/stripe';
import { PLANS, offers } from '../../../utils/plans';
import { newId } from '../../../utils/ids';
import { readBodyAs } from '../../../utils/validate';

const Body = z.object({ plan: z.enum(['std', 'full']) });

/**
 * One Checkout Session per attempt, for one of the event's current offers
 * (an upgrade — the difference only, from a paid plan — or a renewal). Prices
 * are created inline in RM, so no dashboard setup is needed; STRIPE_PRICE_*
 * override that for a full-price purchase. FPX, cards and GrabPay are
 * whatever the Stripe MY account has enabled.
 *
 * The payment row records exactly what was priced (plan, kind, amount): the
 * webhook applies that or flags a refund, never something else. A session
 * lives one hour, not Stripe's default 24, so a price cannot be paid long
 * after the event changed under it.
 */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { plan } = await readBodyAs(event, Body);
  const offer = offers(ev).find(o => o.plan === plan);
  if (!offer) throw createError({ statusCode: 400, statusMessage: ev.purgedAt || ev.purgeStartedAt ? 'Majlis ni dah tamat simpanan' : 'Pakej ni dah aktif' });
  const p = PLANS[plan];
  const { stripe: cfg, public: pub } = useRuntimeConfig();
  const priceId = offer.cents === p.priceCents ? (plan === 'std' ? cfg.priceStd : cfg.priceFull) : '';
  const label = offer.kind === 'renew' ? `Lanjutan ${p.name}` : ev.plan === 'free' ? p.name : `Naik taraf ke ${p.name}`;
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    client_reference_id: ev.id,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    line_items: [priceId
      ? { price: priceId, quantity: 1 }
      : { quantity: 1, price_data: { currency: 'myr', unit_amount: offer.cents, product_data: { name: `${label} — ${ev.title}`, description: 'Indahnya, bayaran sekali untuk satu majlis' } } }],
    success_url: `${pub.siteUrl}/app/${ev.id}?paid=1`,
    cancel_url: `${pub.siteUrl}/app/${ev.id}/tetapan`,
    metadata: { eventId: ev.id, plan, kind: offer.kind, cents: String(offer.cents), userId: user.id },
    payment_intent_data: { description: `Indahnya — ${label} — ${ev.slug}`, metadata: { eventId: ev.id } },
  });
  await useDb().insert(payments).values({ id: newId(), eventId: ev.id, userId: user.id, stripeSessionId: session.id, plan, kind: offer.kind, amountCents: offer.cents });
  return { url: session.url };
});
