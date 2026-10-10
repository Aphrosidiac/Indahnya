import { createVerify } from 'node:crypto';

/**
 * CHIP Collect (chip-in.asia), the payment gateway: FPX, cards, DuitNow QR and
 * e-wallets in MYR. One host for test and live; the secret key decides the
 * mode (purchases made with a test key carry `is_test`). Paths are plural and
 * end in a slash. Reference: docs.chip-in.asia, openapi/chip-collect.yaml.
 */
const BASE = 'https://gate.chip-in.asia/api/v1';

export type ChipStatus =
  | 'created' | 'sent' | 'viewed' | 'error' | 'cancelled' | 'overdue' | 'expired' | 'blocked'
  | 'hold' | 'released' | 'pending_release' | 'pending_capture' | 'preauthorized'
  | 'paid' | 'pending_execute' | 'pending_charge' | 'cleared' | 'settled'
  | 'chargeback' | 'pending_refund' | 'refunded';

/** The parts of a Purchase this app reads. */
export interface ChipPurchase {
  id: string;
  status: ChipStatus;
  checkout_url: string;
  is_test: boolean;
  reference?: string | null;
  purchase: { total: number; currency: string; metadata?: Record<string, unknown> | null };
  payment?: { amount: number; currency: string; paid_on?: number | null } | null;
  transaction_data?: { payment_method?: string | null } | null;
  refundable_amount?: number;
}

/** A Payment (what `payment.*` events carry): `related_to` points at its purchase. */
export interface ChipPayment {
  id: string;
  amount: number;
  currency: string;
  payment_type?: string;
  related_to?: { type: string; id: string } | null;
}

/** `cleared` and `settled` are later states of a paid purchase (cards); both still mean paid. */
export const isPaid = (s: ChipStatus) => s === 'paid' || s === 'cleared' || s === 'settled';
/** No longer payable: `error` is NOT here — a buyer can retry on the same checkout and still pay. */
export const isDead = (s: ChipStatus) => s === 'cancelled' || s === 'expired' || s === 'blocked';

export function chipConfig() {
  const { chip } = useRuntimeConfig();
  if (!chip.secretKey || !chip.brandId) throw createError({ statusCode: 501, statusMessage: 'Bayaran belum disambung' });
  return chip;
}

/** CHIP's errors come as {"__all__": [{message, code}]} (sometimes a bare object); keep whatever says most. */
function chipError(status: number, body: unknown) {
  const all = (body as { __all__?: unknown })?.__all__;
  const first = Array.isArray(all) ? all[0] : all;
  const msg = (first as { message?: string })?.message ?? JSON.stringify(body)?.slice(0, 300);
  return new Error(`CHIP ${status}: ${msg}`);
}

export async function chip<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const { secretKey } = chipConfig();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    // the official plugins defeat caching on reads; a purchase's status must be fresh
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON: reported below */ }
  if (!res.ok) throw chipError(res.status, json ?? text);
  return json as T;
}

export const getPurchase = (id: string) => chip<ChipPurchase>('GET', `/purchases/${id}/`);
/** Guarantees a still-payable purchase can no longer be paid. */
export const cancelPurchase = (id: string) => chip<ChipPurchase>('POST', `/purchases/${id}/cancel/`);

/* ── signatures ─────────────────────────────────────────────────────────── */

/** Keys stored in env files carry literal "\n"s. */
const pem = (k: string) => k.replace(/\\n/g, '\n').trim();

export function verifySignature(raw: Buffer, sigB64: string | undefined, publicKey: string) {
  if (!sigB64 || !publicKey) return false;
  try {
    const v = createVerify('RSA-SHA256');
    v.update(raw);
    v.end();
    return v.verify(pem(publicKey), sigB64, 'base64');
  } catch { return false; }
}

/**
 * The company key signs per-purchase `success_callback`s; GET /public_key/
 * returns it as a JSON-encoded PEM string. Cached per process, fetched again
 * once if a signature fails (the key was rotated, or the cache predates a key change).
 */
let companyKey: { key: string; at: number } | undefined;
async function companyPublicKey(fresh = false) {
  if (!fresh && companyKey && Date.now() - companyKey.at < 24 * 3600_000) return companyKey.key;
  let key: string;
  try { key = await chip<string>('GET', '/public_key/'); }
  catch (e) {
    // cannot verify now, which is not the same as a bad signature: 503, and CHIP delivers again later
    console.error('[chip] could not fetch the company public key:', (e as Error).message);
    throw createError({ statusCode: 503, statusMessage: 'Cannot verify the signature right now' });
  }
  companyKey = { key, at: Date.now() };
  return key;
}

/**
 * A delivery is genuine if it verifies against the account webhook's own key
 * (refunds, chargebacks, failures, cancellations) or the company key
 * (success callbacks). Both arrive at the same endpoint.
 */
export async function verifyDelivery(raw: Buffer, sig: string | undefined) {
  if (!sig) return false;
  const { webhookPublicKey } = chipConfig();
  if (webhookPublicKey && verifySignature(raw, sig, webhookPublicKey)) return true;
  if (verifySignature(raw, sig, await companyPublicKey())) return true;
  // at most one refetch a minute: a stream of forged requests must not turn into calls to CHIP
  if (companyKey && Date.now() - companyKey.at < 60_000) return false;
  return verifySignature(raw, sig, await companyPublicKey(true));
}
