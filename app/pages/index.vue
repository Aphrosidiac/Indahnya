<script setup lang="ts">
import '~/assets/css/landing.css';
import { LANDING, type LandingLang } from '~/composables/useLanding';
import { useLandingMotion } from '~/composables/useLandingMotion';
import LNav from '~/components/landing/LNav.vue';
import LHero from '~/components/landing/LHero.vue';
import LStory from '~/components/landing/LStory.vue';
import LHow from '~/components/landing/LHow.vue';
import LDewan from '~/components/landing/LDewan.vue';
import LKad from '~/components/landing/LKad.vue';
import LGuests from '~/components/landing/LGuests.vue';
import LHost from '~/components/landing/LHost.vue';
import LPricing from '~/components/landing/LPricing.vue';
import LFaq from '~/components/landing/LFaq.vue';
import LFinal from '~/components/landing/LFinal.vue';

/**
 * The landing, told as the day of a majlis: a QR on a table becomes the
 * gallery (hero), the three steps, the dewan where the lights go down and
 * the slideshow plays (and where a visitor can send a real photo to the
 * screen), the kad people open first, the guests' side, the host's side,
 * the price, the questions, one last door.
 *
 * Every demo on the page is the product itself: the hero's QR scans, the
 * TV's QR uploads through the real pipeline (a sandbox), the kad is the
 * guest component in a frame, the seat search asks the sample event.
 * Motion: Lenis + ScrollTrigger, loaded after first paint, all of it off
 * under prefers-reduced-motion. Nothing owns its resting state.
 */
definePageMeta({ layout: 'bare' });
const route = useRoute();
const lang = computed<LandingLang>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const L = computed(() => LANDING[lang.value]);
const other = computed(() => (lang.value === 'ms' ? '/?lang=en' : '/'));

const site = useRuntimeConfig().public.siteUrl;
const canonical = computed(() => (lang.value === 'en' ? `${site}/?lang=en` : `${site}/`));
useHead({
  htmlAttrs: { lang: () => lang.value },
  link: [
    { rel: 'canonical', href: canonical },
    { rel: 'alternate', hreflang: 'ms', href: `${site}/` },
    { rel: 'alternate', hreflang: 'en', href: `${site}/?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${site}/` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${site}/#org`, name: 'FF Dev Studio', url: 'https://ffdev.studio' },
        {
          '@type': 'SoftwareApplication', name: 'Indahnya', url: `${site}/`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web',
          inLanguage: lang.value === 'en' ? 'en-MY' : 'ms-MY', description: L.value.hero.sub, publisher: { '@id': `${site}/#org` },
          offers: [0, 59, 99].map(price => ({ '@type': 'Offer', price: String(price), priceCurrency: 'MYR' })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: L.value.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
      ],
    }),
  }],
});
useSeoMeta({
  title: () => lang.value === 'ms' ? 'Indahnya: galeri gambar majlis dengan QR' : 'Indahnya: QR photo gallery for your event',
  description: () => L.value.hero.sub,
  ogTitle: () => `Indahnya: ${L.value.hero.h1a} ${L.value.hero.h1b}`,
  ogDescription: () => L.value.hero.sub,
  ogUrl: canonical,
  ogType: 'website',
  ogSiteName: 'Indahnya',
  ogLocale: () => (lang.value === 'en' ? 'en_MY' : 'ms_MY'),
  ogImage: `${site}/og.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Indahnya: galeri gambar majlis dengan QR',
  twitterCard: 'summary_large_image',
});

const motion = useLandingMotion();
const dim = ref(false);
onMounted(() => { void motion.boot(); });
onBeforeUnmount(() => { motion.teardown(); document.documentElement.classList.remove('l-lock'); });
const go = (id: string) => motion.scrollTo(id);
const demoQr = ref('');
onMounted(async () => { demoQr.value = await (await import('qrcode')).toDataURL(`${site}/aina-hakim`, { margin: 0, width: 280, color: { dark: '#1a1a1a', light: '#00000000' } }); });
</script>

<template>
  <div class="landing min-h-screen" :class="{ 'is-dim': dim }">
    <div class="l-night" aria-hidden="true" />
    <LNav :L="L" :other="other" :dim="dim" @go="go" />
    <main>
      <LHero :L="L" :qr-url="`${site}/aina-hakim`" @go="go" />
      <LStory :L="L" />
      <LHow :L="L" :qr="demoQr" />
      <LDewan :L="L" @dim="dim = $event" />
      <LKad :L="L" />
      <LGuests :L="L" />
      <LHost :L="L" :qr="demoQr" />
      <LPricing :L="L" />
      <LFaq :L="L" />
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>
