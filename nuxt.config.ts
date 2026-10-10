import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  /**
   * Stores are imported explicitly. Auto-importing app/stores made unimport
   * misread the defineStore options and register a global named `actions`.
   */
  pinia: { storesDirs: [] },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'ms' },
      title: 'Indahnya',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f5f4f2' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  routeRules: {
    /**
     * Baseline headers everywhere (HSTS belongs to nginx). No page is framed
     * yet; the embeddable gallery (Phase C) will get its own rule.
     */
    '/**': { headers: {
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-frame-options': 'SAMEORIGIN',
      'permissions-policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
    } },
    /** The host dashboard is an app, not a document: client-only, like ANK Ops. */
    '/app/**': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/masuk': { ssr: false, headers: { 'x-robots-tag': 'noindex' } },
    '/tv/**': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' } },
    '/api/**': { headers: { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-store' } },
    /** The gallery widget couples paste into an e-kad on another platform: framing allowed, here only (its CSP: server/plugins/csp.ts). */
    '/embed/**': { headers: { 'x-frame-options': 'ALLOWALL', 'x-robots-tag': 'noindex' } },
  },
  /**
   * Defaults are for local dev only. Every value is overridden at RUNTIME by
   * a NUXT_-prefixed env var named after its path — NUXT_S3_PRIVATE_BUCKET,
   * NUXT_CHIP_SECRET_KEY, NUXT_PUBLIC_SITE_URL (see .env.example). Nothing
   * here reads process.env: that would bake the build machine's secrets into
   * .output and silently ignore the env the server actually starts with.
   * DATABASE_URL is the exception, read directly by server/db and drizzle-kit.
   */
  runtimeConfig: {
    s3: {
      endpoint: 'http://127.0.0.1:9000',
      region: 'auto',
      /** Served copies of ready media only — the bucket behind media.indahnya.my. */
      bucket: 'indahnya-media',
      /** Originals and hidden media. Never public; see server/utils/storage.ts. */
      privateBucket: 'indahnya-private',
      accessKeyId: '',
      secretAccessKey: '',
      /** Where public reads come from. Dev: the app's /media route; prod: https://media.indahnya.my. */
      publicBase: 'http://localhost:3180/media',
    },
    /**
     * CHIP Collect (payments). The secret key decides test or live; the brand is
     * the shop the purchases belong to; the webhook key verifies the account
     * webhook's deliveries (deploy/chip.mjs creates the webhook and writes it).
     */
    chip: { secretKey: '', brandId: '', webhookPublicKey: '' },
    google: { clientId: '', clientSecret: '' },
    smtp: { url: '', from: 'Indahnya <hello@indahnya.my>' },
    /** Where alerts go: refunds needed, jobs given up, purges without a warning, mail failures. */
    alertEmail: '',
    /** Optional: purge media URLs from Cloudflare's edge on hide/delete (token needs Zone → Cache Purge). */
    cloudflare: { zoneId: '', apiToken: '' },
    public: {
      siteUrl: 'http://localhost:3180',
      /**
       * Who runs the service, shown on /privasi and /terma (the e-commerce
       * regulations want the registered name, number and address). Required
       * in production: the server refuses to start without them.
       */
      legal: { name: '', reg: '', address: '' },
      /**
       * The static preview on Cloudflare Pages (scripts/pages/): no server, so
       * the host side is closed (/mula) and the TV try stays in the browser.
       */
      preview: false,
    },
  },
  nitro: {
    experimental: { tasks: true },
    /**
     * heic-convert is only ever loaded by a child process (server/utils/heic.ts),
     * never imported, so the tracer would leave it out of .output: name it.
     */
    externals: { traceInclude: [require.resolve('heic-convert')] },
  },
});
