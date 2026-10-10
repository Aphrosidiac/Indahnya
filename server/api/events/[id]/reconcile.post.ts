import { and, eq, desc } from 'drizzle-orm';
import { useDb, payments } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { getPurchase, isPaid, isDead } from '../../../utils/chip';
import { applyPaidPurchase } from '../../../utils/payments';

/**
 * The return page lands before the callback sometimes: ask CHIP directly
 * about the event's open purchases. CHIP sends no event when a purchase
 * lapses unpaid, so this is also where an abandoned checkout becomes `expired`.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const open = await useDb().select().from(payments).where(and(eq(payments.eventId, ev.id), eq(payments.status, 'open'))).orderBy(desc(payments.createdAt)).limit(5);
  let paid = false, applied = false;
  for (const p of open) {
    const s = await getPurchase(p.chipPurchaseId);
    if (isPaid(s.status)) {
      paid = true;
      const r = await applyPaidPurchase(s);
      if (r?.applied) applied = true;
    } else if (isDead(s.status)) {
      await useDb().update(payments).set({ status: 'expired' }).where(and(eq(payments.id, p.id), eq(payments.status, 'open')));
    }
  }
  return { paid, applied };
});
