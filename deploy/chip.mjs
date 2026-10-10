#!/usr/bin/env node
/**
 * CHIP Collect set up through its API. Run on the Mac; idempotent, so run it
 * again after changing keys (test → live) or the site address:
 *
 *   node deploy/chip.mjs                              # for https://indahnya.my
 *   node deploy/chip.mjs --site https://x.trycloudflare.com   # a test tunnel
 *
 * Reads NUXT_CHIP_SECRET_KEY and NUXT_CHIP_BRAND_ID from
 * ~/.config/indahnya/production.env (portal.chip-in.asia → Developers → API
 * keys / Brands). A test key sets up test mode, a live key live mode: CHIP
 * keeps the two apart, webhooks included.
 *
 * It checks the key and brand, lists the payment methods the account has
 * activated, and creates (or updates) the account webhook that sends
 * refunds, chargebacks, failures and cancellations to <site>/api/chip/webhook,
 * writing its public key into production.env as NUXT_CHIP_WEBHOOK_PUBLIC_KEY.
 * Paid purchases also arrive through each purchase's own success callback,
 * signed with the company key, so a payment never depends on this webhook alone.
 */
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = 'https://gate.chip-in.asia/api/v1';
const PROD = join(homedir(), '.config/indahnya/production.env');
const EVENTS = [
  'purchase.paid', 'purchase.payment_failure', 'purchase.cancelled', 'purchase.pending_execute',
  'payment.refunded', 'purchase.refund_failure', 'payment.charged_back', 'payment.chargeback_reversed',
];
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };

const readEnv = (file) => existsSync(file)
  ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }))
  : {};
const writeEnv = (file, values) => {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [k, v] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(`${k}=`));
    if (i >= 0) lines[i] = `${k}=${v}`; else lines.splice(lines.at(-1) === '' ? lines.length - 1 : lines.length, 0, `${k}=${v}`);
  }
  writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'));
  chmodSync(file, 0o600);
};

const env = readEnv(PROD);
const KEY = env.NUXT_CHIP_SECRET_KEY, BRAND = env.NUXT_CHIP_BRAND_ID;
if (!KEY || !BRAND) { console.error(`NUXT_CHIP_SECRET_KEY and NUXT_CHIP_BRAND_ID go in ${PROD} first`); process.exit(1); }
const SITE = (arg('--site') ?? (env.NUXT_PUBLIC_SITE_URL || 'https://indahnya.my')).replace(/\/$/, '');
const CALLBACK = `${SITE}/api/chip/webhook`;
if (new URL(CALLBACK).port) { console.error(`CHIP refuses callback URLs with a port: ${CALLBACK}`); process.exit(1); }

async function chip(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* reported below */ }
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
  return json;
}
const ok = (m) => console.log(`  ✓ ${m}`);

console.log('== key and brand');
const methods = await chip('GET', `/payment_methods/?brand_id=${BRAND}&currency=MYR&amount=5900`);
ok('the key works and the brand belongs to it');
const names = methods.names ?? {};
console.log(`  payment methods for RM59: ${(methods.available_payment_methods ?? []).map((m) => names[m] ?? m).join(', ') || 'none'}`);
const pk = await chip('GET', '/public_key/');
ok(`company public key (${typeof pk === 'string' && pk.includes('BEGIN PUBLIC KEY') ? 'PEM' : 'unexpected format'})`);

console.log(`== webhook → ${CALLBACK}`);
const all = [];
for (let url = '/webhooks/'; url;) {
  const page = await chip('GET', url);
  all.push(...(page.results ?? []));
  url = page.next ? page.next.replace(BASE, '') : null;
}
let hook = all.find((w) => w.callback === CALLBACK);
const same = hook && !hook.all_events && EVENTS.every((e) => hook.events?.includes(e)) && hook.events.length === EVENTS.length;
if (!hook) { hook = await chip('POST', '/webhooks/', { title: 'Indahnya', events: EVENTS, callback: CALLBACK }); ok(`created webhook ${hook.id}`); }
else if (!same) { hook = await chip('PATCH', `/webhooks/${hook.id}/`, { events: EVENTS, all_events: false }); ok(`updated webhook ${hook.id}'s events`); }
else ok(`webhook ${hook.id} already set up`);
const others = all.filter((w) => w.id !== hook.id && /indahnya/i.test(`${w.title} ${w.callback}`));
for (const w of others) console.log(`  · another Indahnya webhook exists: ${w.id} → ${w.callback} (delete it in the portal if it is stale)`);

if (!hook.public_key) { console.error('  ✗ CHIP returned no public_key for the webhook'); process.exit(1); }
writeEnv(PROD, { NUXT_CHIP_WEBHOOK_PUBLIC_KEY: hook.public_key.trim().replace(/\r?\n/g, '\\n') });
ok('NUXT_CHIP_WEBHOOK_PUBLIC_KEY written to production.env (deploy/env.sh push --reload sends it)');
