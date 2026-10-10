import { z } from 'zod';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { chip, chipConfig, type ChipPurchase } from '../../../utils/chip';
import { PLANS, offers } from '../../../utils/plans';
import { newId } from '../../../utils/ids';
import { readBodyAs } from '../../../utils/validate';

const Body = z.object({ plan: z.enum(['std', 'full']) });

/**
 * One CHIP purchase per attempt, for one of the event's current offers (an
 * upgrade — the difference only, from a paid plan — or a renewal), priced in
 * sen here; nothing is set up in CHIP's portal. FPX, cards, DuitNow QR and
 * e-wallets are whatever the CHIP account has activated. CHIP emails the receipt.
 *
 * The payment row records exactly what was priced (plan, kind, amount): the
 * webhook applies that or flags a refund, never something else. A purchase
 * is payable for one hour (`due_strict`), so a price cannot be paid long
 * after the event changed under it.
 *
 * CHIP's rules that bite: the callback and redirect fields go at the TOP
 * level (inside `purchase` they are silently ignored), and the callback URL
 * may not carry a port.
 */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { plan } = await readBodyAs(event, Body);
  const offer = offers(ev).find(o => o.plan === plan);
  if (!offer) throw createError({ statusCode: 400, statusMessage: ev.purgedAt || ev.purgeStartedAt ? 'Majlis ni dah tamat simpanan' : 'Pakej ni dah aktif' });
  const p = PLANS[plan];
  const { brandId } = chipConfig();
  const site = useRuntimeConfig().public.siteUrl;
  const label = offer.kind === 'renew' ? `Lanjutan ${p.name}` : ev.plan === 'free' ? p.name : `Naik taraf ke ${p.name}`;
  const id = newId();
  const purchase = await chip<ChipPurchase>('POST', '/purchases/', {
    brand_id: brandId,
    client: { email: user.email, ...(user.name ? { full_name: user.name.slice(0, 1000) } : {}) },
    purchase: {
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      due_strict: true,
      products: [{ name: `${label} — ${ev.title}`.slice(0, 256), price: offer.cents, quantity: 1 }],
      metadata: { paymentId: id, eventId: ev.id, plan, kind: offer.kind, cents: offer.cents, userId: user.id },
    },
    reference: id,
    due: Math.floor(Date.now() / 1000) + 3600,
    send_receipt: true,
    success_callback: `${site}/api/chip/webhook`,
    success_redirect: `${site}/app/${ev.id}?paid=1`,
    failure_redirect: `${site}/app/${ev.id}/tetapan?bayaran=gagal`,
    cancel_redirect: `${site}/app/${ev.id}/tetapan`,
    creator_agent: 'indahnya',
    platform: 'api',
  });
  if (purchase.is_test) console.warn(`[chip] TEST purchase ${purchase.id} for event ${ev.id}`);
  await useDb().insert(payments).values({ id, eventId: ev.id, userId: user.id, chipPurchaseId: purchase.id, plan, kind: offer.kind, amountCents: offer.cents });
  return { url: purchase.checkout_url };
});
