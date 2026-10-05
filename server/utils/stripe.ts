import Stripe from 'stripe';

let _s: Stripe | undefined;

/** A live key, secret or restricted (Stripe recommends restricted keys for servers). */
export const isLiveKey = (k: string) => /^(sk|rk)_live_/.test(k);
export function stripe() {
  const { stripe: c } = useRuntimeConfig();
  if (!c.secretKey) throw createError({ statusCode: 501, statusMessage: 'Bayaran belum disambung' });
  return (_s ??= new Stripe(c.secretKey));
}
