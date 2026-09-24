import type { H3Event } from 'h3';

/**
 * A fixed-window counter in memory. One process serves the app (PM2, one
 * VPS), so memory is the whole truth; a restart forgives everyone, which is
 * fine for limits this coarse.
 *
 * Limits are keyed by what the request is about, not only by IP: a wedding
 * hall is two hundred phones behind one wifi, so an IP limit tight enough to
 * stop a script would stop the guests first.
 */
const hits = new Map<string, { n: number; reset: number }>();
let sweptAt = 0;

export function clientIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (now - sweptAt > 60_000) {
    sweptAt = now;
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }
  const h = hits.get(key);
  if (!h || h.reset <= now) { hits.set(key, { n: 1, reset: now + windowMs }); return; }
  if (++h.n > limit) {
    throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak cubaan, tunggu sekejap', data: { retryAfterSec: Math.ceil((h.reset - now) / 1000) } });
  }
}
