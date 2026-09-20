import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: 'ms' },
      title: 'Indahnya',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [
        { rel: 'preconnect', href: 'https://rsms.me/' },
        { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' },
      ],
    },
  },
  routeRules: {
    /** The host dashboard is an app, not a document: client-only, like ANK Ops. */
    '/app/**': { ssr: false },
    '/masuk': { ssr: false },
    '/tv/**': { ssr: false },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/indahnya',
    sessionSecret: process.env.SESSION_SECRET || 'dev-only-change-me',
    s3: {
      endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
      region: process.env.S3_REGION || 'auto',
      bucket: process.env.S3_BUCKET || 'indahnya-media',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
      /** Where the public reads come from. Dev: MinIO straight; prod: media.indahnya.my. */
      publicBase: process.env.S3_PUBLIC_BASE || 'http://127.0.0.1:9000/indahnya-media',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      priceStd: process.env.STRIPE_PRICE_STD || '',
      priceFull: process.env.STRIPE_PRICE_FULL || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    smtp: {
      url: process.env.SMTP_URL || '',
      from: process.env.MAIL_FROM || 'Indahnya <hello@indahnya.my>',
    },
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3180',
      mediaBase: process.env.S3_PUBLIC_BASE || 'http://127.0.0.1:9000/indahnya-media',
    },
  },
  nitro: { experimental: { tasks: true } },
});
