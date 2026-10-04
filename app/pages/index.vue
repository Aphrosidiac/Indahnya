<script setup lang="ts">
import '~/assets/css/landing.css';
import { LANDING, type LandingLang } from '~/composables/useLanding';
import { useLandingMotion } from '~/composables/useLandingMotion';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';
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
const pageTitle = computed(() => (lang.value === 'ms' ? 'Indahnya: galeri gambar majlis dengan QR' : 'Indahnya: QR photo gallery for your event'));
/** The snippet answers "what is it, for whom, what does it cost" (the hero line is a feeling, not a definition). */
const pageDesc = computed(() => (lang.value === 'ms'
  ? 'Galeri gambar majlis dengan QR untuk Malaysia. Tetamu scan dan upload tanpa app, semua masuk satu galeri dan TV dewan. E-kad, RSVP, tempat duduk. Percuma untuk mula.'
  : 'QR photo gallery for Malaysian events. Guests scan and upload with no app; every photo in one gallery and on the venue screen. E-invite, RSVP, seating. Free to start.'));
useHead({
  htmlAttrs: { lang: () => (lang.value === 'en' ? 'en-MY' : 'ms-MY') },
  link: [
    { rel: 'canonical', href: canonical },
    { rel: 'alternate', hreflang: 'ms-MY', href: `${site}/` },
    { rel: 'alternate', hreflang: 'en-MY', href: `${site}/?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${site}/` },
  ],
  script: [{
    type: 'application/ld+json',
    // the site-wide entities (useSiteGraph) + this page and its FAQ, every fact also on the page
    innerHTML: () => ldJson([
      ...siteGraph(site, lang.value),
      {
        '@type': 'WebPage', '@id': `${canonical.value}#webpage`, url: canonical.value, name: pageTitle.value, description: pageDesc.value,
        inLanguage: lang.value === 'en' ? 'en-MY' : 'ms-MY', isPartOf: { '@id': `${site}/#website` }, about: { '@id': `${site}/#app` },
      },
      {
        '@type': 'FAQPage', '@id': `${canonical.value}#faq`, isPartOf: { '@id': `${canonical.value}#webpage` },
        mainEntity: L.value.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ]),
  }],
});
useSeoMeta({
  title: pageTitle,
  description: pageDesc,
  ogTitle: () => `Indahnya: ${L.value.hero.h1a} ${L.value.hero.h1b}`,
  ogDescription: pageDesc,
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
const demoQr = qrArtDataUrl(`${site}/aina-hakim`);
</script>

<template>
  <div class="landing min-h-screen" :class="{ 'is-dim': dim }">
    <div class="l-night" aria-hidden="true" />
    <LNav :L="L" :other="other" :dim="dim" @go="go" />
    <main>
      <LHero :L="L" :qr-url="`${site}/aina-hakim`" @go="go" />
      <LStory :L="L" />
      <LHow :L="L" :qr="demoQr" :url="`${site}/aina-hakim`" />
      <LDewan :L="L" @dim="dim = $event" />
      <LKad :L="L" />
      <LGuests :L="L" />
      <LHost :L="L" :qr="demoQr" :url="`${site}/aina-hakim`" />
      <LPricing :L="L" />
      <LFaq :L="L" />
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>
