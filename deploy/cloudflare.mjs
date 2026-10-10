#!/usr/bin/env node
/**
 * Everything Indahnya needs from Cloudflare, set up through the API. Run on the
 * Mac; idempotent, so run it again after any change (or to check):
 *
 *   node deploy/cloudflare.mjs            # set up / verify
 *   node deploy/cloudflare.mjs --rotate   # also mint fresh app credentials
 *
 * Reads ~/.config/indahnya/cloudflare.env (never in the repo, which is public):
 *   CF_API_TOKEN    bootstrap token on the personal account (see docs/deployment.md
 *                   for its permissions). Used here only; never sent to the server.
 *   CF_ACCOUNT_ID   the personal account
 *   VPS_IP          the server's IPv4 (VPS_IPV6 optional)
 *   FORWARD_TO      the inbox hello@indahnya.my forwards to (verified once by mail)
 *   RESEND_API_KEY  a full-access Resend key, used here only to add the domain and
 *                   create the server's send-only key
 *
 * Writes the credentials it mints into ~/.config/indahnya/production.env (mode
 * 600), which deploy/env.sh push merges into the server's /etc/indahnya/env,
 * and the origin certificate into ~/.config/indahnya/origin.{pem,key}.
 *
 * What it does: DNS (apex + www to the VPS, proxied; indahnya.ffdev.studio when
 * the FF token is around), SSL Full (strict), three R2 buckets with CORS and
 * lifecycle rules, media.indahnya.my on the public bucket, an origin
 * certificate, Email Routing (hello@ → FORWARD_TO), the indahnya.my domain on
 * Resend with its DKIM/SPF records and DMARC, and the server's credentials:
 * R2 objects (media + private), R2 backups, cache purge (Cloudflare tokens)
 * and a send-only Resend key.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const DOMAIN = 'indahnya.my';
const MEDIA_HOST = `media.${DOMAIN}`;
const BUCKETS = { media: 'indahnya-media', priv: 'indahnya-private', backups: 'indahnya-backups' };
const CONF = join(homedir(), '.config/indahnya');
const ROTATE = process.argv.includes('--rotate');

const readEnv = (file) => existsSync(file)
  ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^(['"])(.*)\1$/, '$2')]; }))
  : {};
/** Upsert keys in an env file, keeping every other line as it was. */
const writeEnv = (file, values) => {
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : ['# Indahnya production secrets — merged into /etc/indahnya/env by deploy/env.sh push. Never commit.'];
  for (const [k, v] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(`${k}=`));
    if (i >= 0) lines[i] = `${k}=${v}`; else lines.splice(lines.at(-1) === '' ? lines.length - 1 : lines.length, 0, `${k}=${v}`);
  }
  writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'));
  chmodSync(file, 0o600);
};

mkdirSync(CONF, { recursive: true, mode: 0o700 });
const cfg = readEnv(join(CONF, 'cloudflare.env'));
const PROD = join(CONF, 'production.env');
const prod = readEnv(PROD);
for (const k of ['CF_API_TOKEN', 'CF_ACCOUNT_ID', 'VPS_IP']) {
  if (!cfg[k]) { console.error(`${k} is missing from ${join(CONF, 'cloudflare.env')} (see docs/deployment.md)`); process.exit(1); }
}
const ACCT = cfg.CF_ACCOUNT_ID;

async function cf(method, path, body, token = cfg.CF_API_TOKEN) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ success: false, errors: [{ message: `HTTP ${res.status}` }] }));
  if (!json.success) {
    const err = new Error(`${method} ${path}: ${(json.errors || []).map((e) => `${e.code ?? ''} ${e.message}`).join('; ')}`);
    err.codes = (json.errors || []).map((e) => e.code);
    throw err;
  }
  return json.result;
}
const ok = (msg) => console.log(`  ✓ ${msg}`);
const todo = [];
/** A step that can fail without stopping the rest; failures are listed at the end. */
async function step(name, fn) {
  try { await fn(); } catch (e) { console.log(`  ✗ ${name}: ${e.message}`); todo.push(`${name}: ${e.message}`); }
}

// ── zone ──────────────────────────────────────────────────────────────────────
console.log(`== zone ${DOMAIN}`);
const zones = await cf('GET', `/zones?name=${DOMAIN}`);
if (!zones.length) { console.error(`  the token cannot see ${DOMAIN}: add Zone permissions for it`); process.exit(1); }
const zone = zones[0];
if (zone.account.id !== ACCT) { console.error(`  ${DOMAIN} is on account ${zone.account.name}, not CF_ACCOUNT_ID`); process.exit(1); }
const ZONE = zone.id;
ok(`${zone.status}, account ${zone.account.name}`);

async function upsertRecord(zoneId, rec, token) {
  const existing = await cf('GET', `/zones/${zoneId}/dns_records?type=${rec.type}&name=${rec.name}`, undefined, token);
  const same = existing.find((r) => r.content === rec.content && (rec.priority === undefined || r.priority === rec.priority));
  if (same) {
    if (rec.proxied !== undefined && same.proxied !== rec.proxied) await cf('PATCH', `/zones/${zoneId}/dns_records/${same.id}`, { proxied: rec.proxied }, token);
    return ok(`${rec.type} ${rec.name} → ${rec.content}`);
  }
  // A/AAAA/CNAME have one answer here: replace a stale one instead of adding a second
  const stale = ['A', 'AAAA', 'CNAME'].includes(rec.type) ? existing[0] : undefined;
  if (stale) await cf('PUT', `/zones/${zoneId}/dns_records/${stale.id}`, { ttl: 1, ...rec }, token);
  else await cf('POST', `/zones/${zoneId}/dns_records`, { ttl: 1, ...rec }, token);
  ok(`${rec.type} ${rec.name} → ${rec.content}${stale ? ` (was ${stale.content})` : ''}`);
}

console.log('== DNS');
await step('DNS', async () => {
  await upsertRecord(ZONE, { type: 'A', name: DOMAIN, content: cfg.VPS_IP, proxied: true });
  if (cfg.VPS_IPV6) await upsertRecord(ZONE, { type: 'AAAA', name: DOMAIN, content: cfg.VPS_IPV6, proxied: true });
  await upsertRecord(ZONE, { type: 'CNAME', name: `www.${DOMAIN}`, content: DOMAIN, proxied: true });
});

console.log('== TLS and zone settings');
await step('zone settings', async () => {
  for (const [id, value] of [['ssl', 'strict'], ['always_use_https', 'on'], ['min_tls_version', '1.2'], ['automatic_https_rewrites', 'on'], ['http3', 'on'], ['brotli', 'on']]) {
    await cf('PATCH', `/zones/${ZONE}/settings/${id}`, { value }).then(() => ok(`${id} = ${value}`), (e) => { if (id === 'brotli') ok('brotli (not editable on this plan, skipped)'); else throw e; });
  }
});

console.log('== origin certificate');
await step('origin certificate', async () => {
  const pem = join(CONF, 'origin.pem'), key = join(CONF, 'origin.key');
  if (existsSync(pem) && existsSync(key) && !ROTATE) {
    const end = execFileSync('openssl', ['x509', '-in', pem, '-noout', '-enddate']).toString().trim();
    return ok(`already at ${pem} (${end})`);
  }
  const t = mkdtempSync(join(tmpdir(), 'indahnya-cert-'));
  try {
    execFileSync('openssl', ['req', '-new', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
      '-keyout', join(t, 'k'), '-out', join(t, 'csr'), '-subj', `/CN=${DOMAIN}`], { stdio: 'ignore' });
    const cert = await cf('POST', '/certificates', {
      hostnames: [DOMAIN, `*.${DOMAIN}`], requested_validity: 5475, request_type: 'origin-ecc',
      csr: readFileSync(join(t, 'csr'), 'utf8'),
    });
    writeFileSync(pem, cert.certificate); writeFileSync(key, readFileSync(join(t, 'k')));
    chmodSync(pem, 0o600); chmodSync(key, 0o600);
    ok(`issued, valid to ${cert.expires_on}; deploy/env.sh push installs it`);
  } finally { rmSync(t, { recursive: true, force: true }); }
});

// ── R2 ────────────────────────────────────────────────────────────────────────
console.log('== R2');
await step('R2 buckets', async () => {
  const have = new Set((await cf('GET', `/accounts/${ACCT}/r2/buckets`)).buckets.map((b) => b.name));
  for (const name of Object.values(BUCKETS)) {
    if (have.has(name)) { ok(`bucket ${name}`); continue; }
    await cf('POST', `/accounts/${ACCT}/r2/buckets`, { name, locationHint: 'apac' });
    ok(`bucket ${name} created (APAC)`);
  }
  // uploads go from the phone straight to the private bucket; parts expose their ETag
  await cf('PUT', `/accounts/${ACCT}/r2/buckets/${BUCKETS.priv}/cors`, { rules: [{
    allowed: { origins: [`https://${DOMAIN}`], methods: ['PUT', 'GET', 'HEAD'], headers: ['content-type', 'content-length'] },
    exposeHeaders: ['ETag'], maxAgeSeconds: 3600,
  }] });
  ok(`CORS on ${BUCKETS.priv}: https://${DOMAIN}, PUT/GET/HEAD, exposes ETag`);
  await cf('PUT', `/accounts/${ACCT}/r2/buckets/${BUCKETS.priv}/lifecycle`, { rules: [{
    id: 'abort-incomplete-multipart', enabled: true, conditions: { prefix: '' },
    abortMultipartUploadsTransition: { condition: { type: 'Age', maxAge: 86400 } },
  }] });
  ok(`lifecycle on ${BUCKETS.priv}: abort unfinished multipart uploads after 1 day`);
  await cf('PUT', `/accounts/${ACCT}/r2/buckets/${BUCKETS.backups}/lifecycle`, { rules: [{
    id: 'expire-30d', enabled: true, conditions: { prefix: '' },
    deleteObjectsTransition: { condition: { type: 'Age', maxAge: 30 * 86400 } },
    abortMultipartUploadsTransition: { condition: { type: 'Age', maxAge: 86400 } },
  }] });
  ok(`lifecycle on ${BUCKETS.backups}: delete after 30 days`);
});

await step(`custom domain ${MEDIA_HOST}`, async () => {
  const doms = await cf('GET', `/accounts/${ACCT}/r2/buckets/${BUCKETS.media}/domains/custom`);
  const d = (doms.domains || []).find((x) => x.domain === MEDIA_HOST);
  if (d) return ok(`${MEDIA_HOST} → ${BUCKETS.media} (${d.status?.ownership}/${d.status?.ssl})`);
  await cf('POST', `/accounts/${ACCT}/r2/buckets/${BUCKETS.media}/domains/custom`, { domain: MEDIA_HOST, zoneId: ZONE, enabled: true, minTLS: '1.2' });
  ok(`${MEDIA_HOST} → ${BUCKETS.media} attached`);
});
// the private bucket must never be reachable without a signature
await step('private bucket stays private', async () => {
  const doms = await cf('GET', `/accounts/${ACCT}/r2/buckets/${BUCKETS.priv}/domains/custom`);
  const dev = await cf('GET', `/accounts/${ACCT}/r2/buckets/${BUCKETS.priv}/domains/managed`);
  if ((doms.domains || []).length || dev.enabled) throw new Error(`${BUCKETS.priv} has a public domain: remove it`);
  ok(`${BUCKETS.priv} has no public domain`);
});

// ── mail ──────────────────────────────────────────────────────────────────────
console.log('== Email Routing (inbound hello@)');
await step('Email Routing', async () => {
  const s = await cf('GET', `/zones/${ZONE}/email/routing`);
  if (!s.enabled) { await cf('POST', `/zones/${ZONE}/email/routing/dns`, {}).catch(() => {}); await cf('POST', `/zones/${ZONE}/email/routing/enable`, {}); }
  ok('routing enabled (MX + SPF on the apex)');
  if (!cfg.FORWARD_TO) throw new Error('FORWARD_TO not set: no address to forward hello@ to');
  const addrs = await cf('GET', `/accounts/${ACCT}/email/routing/addresses`);
  let a = addrs.find((x) => x.email.toLowerCase() === cfg.FORWARD_TO.toLowerCase());
  if (!a) { a = await cf('POST', `/accounts/${ACCT}/email/routing/addresses`, { email: cfg.FORWARD_TO }); }
  if (!a.verified) todo.push(`Click the verification link Cloudflare mailed to ${cfg.FORWARD_TO}, then re-run`);
  const rules = await cf('GET', `/zones/${ZONE}/email/routing/rules`);
  const want = `hello@${DOMAIN}`;
  if (!rules.some((r) => r.matchers?.some((m) => m.value === want))) {
    await cf('POST', `/zones/${ZONE}/email/routing/rules`, {
      name: 'hello → owner', enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: want }],
      actions: [{ type: 'forward', value: [cfg.FORWARD_TO] }],
    });
  }
  ok(`${want} → ${cfg.FORWARD_TO}${a.verified ? '' : ' (waiting for verification)'}`);
});

console.log('== Resend (outbound sign-in links, receipts, alerts)');
async function resend(method, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method, headers: { Authorization: `Bearer ${cfg.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${method} ${path}: ${res.status} ${json.message || json.name || ''}`);
  return json;
}
await step('Resend domain', async () => {
  if (!cfg.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set (a full-access key; see docs/deployment.md); skipped');
  let d = (await resend('GET', '/domains')).data.find((x) => x.name === DOMAIN);
  // Tokyo is Resend's nearest region to Malaysia
  if (!d) d = await resend('POST', '/domains', { name: DOMAIN, region: 'ap-northeast-1' });
  d = await resend('GET', `/domains/${d.id}`);
  // DKIM on resend._domainkey, bounce MX + SPF on send.: nothing collides with Email Routing's apex MX/SPF
  for (const r of d.records || []) {
    const name = r.name === DOMAIN || r.name.endsWith(`.${DOMAIN}`) ? r.name : `${r.name}.${DOMAIN}`;
    await upsertRecord(ZONE, { type: r.type, name, content: r.value, ...(r.type === 'MX' ? { priority: Number(r.priority ?? 10) } : {}) });
  }
  if (d.status !== 'verified') {
    await resend('POST', `/domains/${d.id}/verify`);
    todo.push(`Resend is verifying ${DOMAIN} (DNS is in place; usually minutes). Re-run to confirm`);
  }
  ok(`${DOMAIN} on Resend: ${d.status}`);
  if (prod.NUXT_SMTP_URL?.includes('smtp.resend.com') && !ROTATE) return ok('NUXT_SMTP_URL already in production.env');
  // the server gets a key that can only send, and only as indahnya.my
  const name = 'indahnya-app';
  const old = (await resend('GET', '/api-keys')).data.filter((k) => k.name === name);
  const k = await resend('POST', '/api-keys', { name, permission: 'sending_access', domain_id: d.id });
  for (const o of old) await resend('DELETE', `/api-keys/${o.id}`);
  writeEnv(PROD, { NUXT_SMTP_URL: `smtps://resend:${encodeURIComponent(k.token)}@smtp.resend.com:465`, NUXT_SMTP_FROM: `Indahnya <hello@${DOMAIN}>` });
  ok('created send-only key indahnya-app → NUXT_SMTP_URL');
});
await step('DMARC', async () => {
  // report-only first; tighten once a few weeks of mail have gone out clean
  const dmarc = await cf('GET', `/zones/${ZONE}/dns_records?type=TXT&name=_dmarc.${DOMAIN}`);
  if (!dmarc.length) await upsertRecord(ZONE, { type: 'TXT', name: `_dmarc.${DOMAIN}`, content: `v=DMARC1; p=none; rua=mailto:hello@${DOMAIN}` });
  else ok(`DMARC present: ${dmarc[0].content}`);
});

// ── credentials for the server ───────────────────────────────────────────────
console.log('== app credentials');
let groups;
const group = async (re) => {
  groups ??= await cf('GET', `/accounts/${ACCT}/tokens/permission_groups`);
  const g = groups.find((x) => re.test(x.name));
  if (!g) throw new Error(`no permission group matching ${re} (have: ${groups.map((x) => x.name).filter((n) => /R2|Cache/i.test(n)).join(', ')})`);
  return { id: g.id };
};
const bucketRes = (b) => `com.cloudflare.edge.r2.bucket.${ACCT}_default_${b}`;
async function mint(name, policies) {
  const old = (await cf('GET', `/accounts/${ACCT}/tokens`)).filter((t) => t.name === name);
  const t = await cf('POST', `/accounts/${ACCT}/tokens`, { name, policies });
  for (const o of old) await cf('DELETE', `/accounts/${ACCT}/tokens/${o.id}`); // rotation: the new one replaces it
  return t;
}
/** R2's S3 credentials ARE an API token: key id = token id, secret = sha256(token value). */
const s3Pair = (t) => ({ id: t.id, secret: createHash('sha256').update(t.value).digest('hex') });
const R2_ENDPOINT = `https://${ACCT}.r2.cloudflarestorage.com`;

await step('R2 token (media + private)', async () => {
  if (prod.NUXT_S3_ACCESS_KEY_ID && !ROTATE) return ok('NUXT_S3_* already in production.env');
  const t = await mint('indahnya-app-r2', [{ effect: 'allow', permission_groups: [await group(/^Workers R2 Storage Bucket Item Write$/)],
    resources: { [bucketRes(BUCKETS.media)]: '*', [bucketRes(BUCKETS.priv)]: '*' } }]);
  const p = s3Pair(t);
  writeEnv(PROD, { NUXT_S3_ENDPOINT: R2_ENDPOINT, NUXT_S3_ACCESS_KEY_ID: p.id, NUXT_S3_SECRET_ACCESS_KEY: p.secret });
  ok('minted indahnya-app-r2 → NUXT_S3_*');
});
await step('R2 token (backups)', async () => {
  if (prod.AWS_ACCESS_KEY_ID && !ROTATE) return ok('backup AWS_* already in production.env');
  const t = await mint('indahnya-backup-r2', [{ effect: 'allow', permission_groups: [await group(/^Workers R2 Storage Bucket Item Write$/)],
    resources: { [bucketRes(BUCKETS.backups)]: '*' } }]);
  const p = s3Pair(t);
  writeEnv(PROD, { AWS_ENDPOINT_URL: R2_ENDPOINT, AWS_ACCESS_KEY_ID: p.id, AWS_SECRET_ACCESS_KEY: p.secret, AWS_DEFAULT_REGION: 'auto', BACKUP_S3_URI: `s3://${BUCKETS.backups}` });
  ok('minted indahnya-backup-r2 → AWS_* (scripts/backup-db.sh)');
});
await step('cache purge token', async () => {
  if (prod.NUXT_CLOUDFLARE_API_TOKEN && !ROTATE) return ok('NUXT_CLOUDFLARE_* already in production.env');
  const t = await mint('indahnya-app-purge', [
    { effect: 'allow', permission_groups: [await group(/^Cache Purge$/)], resources: { [`com.cloudflare.api.account.zone.${ZONE}`]: '*' } },
  ]);
  writeEnv(PROD, { NUXT_CLOUDFLARE_ZONE_ID: ZONE, NUXT_CLOUDFLARE_API_TOKEN: t.value });
  ok('minted indahnya-app-purge → NUXT_CLOUDFLARE_*');
});

// ── indahnya.ffdev.studio → 301 (the old name in the plan) ──────────────────
console.log('== indahnya.ffdev.studio');
await step('indahnya.ffdev.studio', async () => {
  const ff = readEnv(join(homedir(), 'Desktop/dev/ffdevstudio/.env'));
  if (!ff.CLOUDFLARE_API_TOKEN) throw new Error('FF token not found (~/Desktop/dev/ffdevstudio/.env); skipped');
  const [z] = await cf('GET', '/zones?name=ffdev.studio', undefined, ff.CLOUDFLARE_API_TOKEN);
  // nginx answers it with a 301 to indahnya.my; ffdev.studio's SSL mode is Full, so the origin cert serves it
  await upsertRecord(z.id, { type: 'CNAME', name: 'indahnya.ffdev.studio', content: DOMAIN, proxied: true }, ff.CLOUDFLARE_API_TOKEN);
});

console.log(todo.length ? `\nStill to do:\n  - ${todo.join('\n  - ')}` : '\nCloudflare is set up.');
console.log(`Secrets: ${PROD} (merge into the server with deploy/env.sh push)`);
process.exit(todo.length ? 2 : 0);
