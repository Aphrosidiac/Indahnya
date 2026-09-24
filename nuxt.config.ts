import tailwindcss from '@tailwindcss/vite';

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
        { rel: 'preconnect', href: 'https://rsms.me/' },
        { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' },
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
  },
  /**
   * Defaults are for local dev only. Every value is overridden at RUNTIME by
   * a NUXT_-prefixed env var named after its path — NUXT_S3_PRIVATE_BUCKET,
   * NUXT_STRIPE_SECRET_KEY, NUXT_PUBLIC_SITE_URL (see .env.example). Nothing
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
    stripe: { secretKey: '', webhookSecret: '', priceStd: '', priceFull: '' },
    google: { clientId: '', clientSecret: '' },
    smtp: { url: '', from: 'Indahnya <hello@indahnya.my>' },
    public: { siteUrl: 'http://localhost:3180' },
  },
  nitro: { experimental: { tasks: true } },
});
