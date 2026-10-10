import { and, eq } from 'drizzle-orm';
import { useDb, payments } from '../../db';
import { verifyDelivery, getPurchase, isPaid, type ChipPurchase, type ChipPayment } from '../../utils/chip';
import { applyPaidPurchase } from '../../utils/payments';
import { opsAlert } from '../../utils/alert';

/**
 * Everything CHIP tells us, verified against the raw body (RSA-SHA256,
 * X-Signature). Two kinds of delivery arrive here:
 *   - each purchase's `success_callback` (company key, GET /public_key/), and
 *   - the account webhook (its own key, NUXT_CHIP_WEBHOOK_PUBLIC_KEY), set up by
 *     deploy/chip.mjs for: purchase.paid, purchase.payment_failure,
 *     purchase.cancelled, purchase.pending_execute, payment.refunded,
 *     purchase.refund_failure, payment.charged_back, payment.chargeback_reversed.
 * The body is the Purchase (or, for payment.*, the Payment) with `event_type` added.
 *
 * A purchase that is not ours (a test purchase on the live server, another
 * app on the same CHIP account) matches no row and changes nothing. Every
 * verified delivery is answered 2xx, even ones we ignore: CHIP holds back a
 * purchase's later events until its earlier ones succeed. A database error
 * answers 500, so CHIP retries (up to 36 hours). Duplicates are expected.
 */
export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event, false);
  if (!raw) throw createError({ statusCode: 400 });
  if (!await verifyDelivery(raw, getHeader(event, 'x-signature'))) throw createError({ statusCode: 401, statusMessage: 'Bad signature' });
  let body: (ChipPurchase | ChipPayment) & { event_type?: string };
  try { body = JSON.parse(raw.toString('utf8')); } catch { throw createError({ statusCode: 400 }); }
  const type = body.event_type ?? '';
  const db = useDb();

  switch (type) {
    case 'purchase.paid': {
      const s = body as ChipPurchase;
      const r = await applyPaidPurchase(s);
      if (r === null && isPaid(s.status)) {
        const [known] = await db.select({ status: payments.status }).from(payments).where(eq(payments.chipPurchaseId, s.id));
        if (!known) console.warn(`[chip] paid purchase ${s.id} is not one of ours${s.is_test ? ' (test)' : ''}`);
      }
      break;
    }
    case 'purchase.cancelled':
      await db.update(payments).set({ status: 'expired' })
        .where(and(eq(payments.chipPurchaseId, (body as ChipPurchase).id), eq(payments.status, 'open')));
      break;
    // a failed attempt is not the end: the buyer can try again on the same checkout. Nothing to record.
    case 'purchase.payment_failure':
    case 'purchase.pending_execute':
      break;
    case 'payment.refunded': {
      const pay = body as ChipPayment;
      const purchaseId = pay.related_to?.type === 'purchase' ? pay.related_to.id : null;
      if (!purchaseId) break;
      const [row] = await db.select().from(payments).where(eq(payments.chipPurchaseId, purchaseId));
      if (!row) break;
      // CHIP calls a purchase `refunded` after a partial refund too: what is left to refund decides
      const s = await getPurchase(purchaseId);
      const full = (s.refundable_amount ?? 0) === 0;
      const rm = (c: number) => `RM${(c / 100).toFixed(2)}`;
      // the running total (several partial refunds each send one of these), from what CHIP says is left
      const paid = s.payment?.amount ?? s.purchase.total;
      const refunded = paid - (s.refundable_amount ?? 0);
      const what = full ? `refunded in full (${rm(paid)})` : `${rm(refunded)} of ${rm(paid)} refunded so far (this refund ${rm(pay.payment?.amount ?? 0)})`;
      if (full) await db.update(payments).set({ status: 'refunded', needsRefund: false, note: what }).where(eq(payments.id, row.id));
      else await db.update(payments).set({ note: what }).where(eq(payments.id, row.id));
      // the plan is NOT taken back automatically: a refund is a decision someone made, and they decide this too
      opsAlert('Payment refunded', `CHIP purchase ${purchaseId} for event ${row.eventId}: ${what}. The event keeps its plan until someone changes it.`);
      break;
    }
    case 'purchase.refund_failure': {
      const s = body as ChipPurchase;
      opsAlert('Refund failed', `CHIP could not refund purchase ${s.id}. See the CHIP portal for the reason, then try again there.`);
      break;
    }
    case 'payment.charged_back':
    case 'payment.chargeback_reversed': {
      const pay = body as ChipPayment;
      const purchaseId = pay.related_to?.id ?? '?';
      const [row] = purchaseId !== '?' ? await db.select({ eventId: payments.eventId }).from(payments).where(eq(payments.chipPurchaseId, purchaseId)) : [];
      if (row || purchaseId === '?') {
        opsAlert(type === 'payment.charged_back' ? 'Payment charged back' : 'Chargeback reversed',
          `CHIP purchase ${purchaseId}${row ? `, event ${row.eventId}` : ''}: RM${((pay.payment?.amount ?? 0) / 100).toFixed(2)}. Details in the CHIP portal.`);
      }
      break;
    }
    default:
      console.warn(`[chip] ignored ${type || 'an event without event_type'}`);
  }
  return { received: true };
});
