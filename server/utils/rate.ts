import type { H3Event } from 'h3';
import { sql } from 'drizzle-orm';
import { isIP } from 'node:net';
import { useDb } from '../db';

/**
 * Fixed-window counters in Postgres (an UNLOGGED table), so every web
 * process shares one count and a second instance does not double the limits.
 *
 * Limits are keyed by what the request is about, not only by IP: a wedding
 * hall is two hundred phones behind one wifi, so an IP limit tight enough to
 * stop a script would stop the guests first. `cost` counts several things
 * at once (a batch of 30 upload slots is 30).
 */
export async function rateLimit(key: string, limit: number, windowMs: number, cost = 1) {
  const now = Date.now();
  // the bucket is the window's END, so the hourly sweep can drop every finished window with one comparison
  const bucket = (Math.floor(now / windowMs) + 1) * windowMs;
  const r = await useDb().execute(sql`
    insert into rate_limits (key, bucket, n) values (${`${key}|${windowMs}`}, ${bucket}, ${cost})
    on conflict (key, bucket) do update set n = rate_limits.n + ${cost}
    returning n`);
  const n = Number((r.rows[0] as { n: number } | undefined)?.n ?? 0);
  if (n > limit) {
    throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak cubaan, tunggu sekejap', data: { retryAfterSec: Math.ceil((bucket - now) / 1000) } });
  }
}

/** Finished windows. Run from the worker's hourly sweep. */
export async function pruneRateLimits() {
  await useDb().execute(sql`delete from rate_limits where bucket < ${Date.now()}`);
}

const LOOPBACK = /^(127\.|::1$|::ffff:127\.)/;

/**
 * The client's address, for rate limits.
 *
 * `X-Forwarded-For` is never read: nginx's usual `$proxy_add_x_forwarded_for`
 * APPENDS, so its first entry is whatever the client typed, and trusting it
 * turned every IP limit into a suggestion. Instead:
 *
 *   - when the connection comes from this machine (nginx in front, the app
 *     bound to 127.0.0.1), use `X-Real-IP`, which our nginx SETS to the
 *     address it saw (behind Cloudflare, the real_ip module first replaces
 *     that with CF-Connecting-IP, from Cloudflare's own ranges only);
 *   - otherwise the socket's own address — a client talking to Node
 *     directly cannot choose it.
 */
export function clientIp(event: H3Event) {
  const peer = event.node.req.socket?.remoteAddress ?? '';
  if (LOOPBACK.test(peer)) {
    const real = String(event.node.req.headers['x-real-ip'] ?? '').trim();
    if (real && isIP(real)) return real;
  }
  return peer.replace(/^::ffff:/, '') || 'unknown';
}
