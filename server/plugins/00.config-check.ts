import { execFileSync } from 'node:child_process';

/**
 * Refuse to start a production server that is missing what it needs, instead
 * of booting and failing on first use. The worst of these fail silently: a
 * missing NUXT_PUBLIC_SITE_URL puts http://localhost:3180 into sign-in mails,
 * Stripe's return URL and the QR codes hosts PRINT. Every problem is listed
 * at once, then the process exits, so PM2 shows the reason in its log.
 *
 * Skipped in dev and for the static Cloudflare Pages preview (no server).
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev || import.meta.prerender) return;
  const c = useRuntimeConfig();
  if (c.public.preview) return;
  const problems: string[] = [];
  const warn: string[] = [];
  const need = (ok: unknown, msg: string) => { if (!ok) problems.push(msg); };
  const isUrl = (u: string, https = true) => {
    try { const x = new URL(u); return https ? x.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(x.hostname) : true; } catch { return false; }
  };

  /** A production build smoke-tested on a laptop (localhost addresses allowed, nothing else relaxed). */
  const localProd = process.env.INDAHNYA_LOCAL_PROD === '1';
  need(process.env.DATABASE_URL, 'DATABASE_URL is not set');
  need(localProd || (isUrl(c.public.siteUrl) && !c.public.siteUrl.includes('localhost')), 'NUXT_PUBLIC_SITE_URL must be the public https address (it goes into mails, payments and printed QR codes)');
  need(localProd || (c.s3.endpoint && !c.s3.endpoint.includes('127.0.0.1')), 'NUXT_S3_ENDPOINT is not set');
  need(c.s3.accessKeyId && c.s3.secretAccessKey, 'NUXT_S3_ACCESS_KEY_ID / NUXT_S3_SECRET_ACCESS_KEY are not set');
  need(c.s3.bucket && c.s3.privateBucket && c.s3.bucket !== c.s3.privateBucket, 'NUXT_S3_BUCKET and NUXT_S3_PRIVATE_BUCKET must both be set, and differ');
  const mediaPath = (() => { try { return new URL(c.s3.publicBase).pathname; } catch { return ''; } })();
  need(isUrl(c.s3.publicBase) && !/^\/media(\/|$)/.test(mediaPath), 'NUXT_S3_PUBLIC_BASE must be the public bucket\'s https domain (the /media route exists only in dev)');
  need(c.smtp.url, 'NUXT_SMTP_URL is not set (sign-in is by emailed link)');
  need(c.chip.secretKey && c.chip.brandId, 'NUXT_CHIP_SECRET_KEY / NUXT_CHIP_BRAND_ID are not set');
  need(c.public.legal.name && c.public.legal.reg && c.public.legal.address, 'NUXT_PUBLIC_LEGAL_NAME / _REG / _ADDRESS are not set (the legal pages must say who runs the service)');
  if (!c.alertEmail) warn.push('NUXT_ALERT_EMAIL is not set: refunds needed, failed jobs and mail failures will only be logged');
  if (!c.cloudflare.zoneId) warn.push('NUXT_CLOUDFLARE_ZONE_ID is not set: hidden photos leave the CDN when their cache expires (up to an hour), not at once');
  if (!c.chip.webhookPublicKey) warn.push('NUXT_CHIP_WEBHOOK_PUBLIC_KEY is not set: payments still apply (success callbacks use the company key), but refund and chargeback events will be rejected (run deploy/chip.mjs)');

  // the worker shells out to these; a web-only process (WORKER=0) still uses them for voice wishes and kad songs
  for (const tool of ['ffmpeg', 'ffprobe']) {
    try { execFileSync(tool, ['-version'], { stdio: 'ignore', timeout: 5000 }); }
    catch { problems.push(`${tool} is not installed (apt install ffmpeg)`); }
  }

  for (const w of warn) console.warn(`[config] ${w}`);
  if (problems.length) {
    console.error(`[config] Indahnya will not start:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
});
