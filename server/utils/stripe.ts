import Stripe from 'stripe';

let _s: Stripe | undefined;
export function stripe() {
  const { stripe: c } = useRuntimeConfig();
  if (!c.secretKey) throw createError({ statusCode: 501, statusMessage: 'Bayaran belum disambung' });
  return (_s ??= new Stripe(c.secretKey));
}
