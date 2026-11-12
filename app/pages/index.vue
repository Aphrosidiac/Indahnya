<script setup lang="ts">
import '~/assets/css/landing.css';
import { LANDING } from '~/composables/useLanding';
import { linkIn } from '~~/shared/utils/site-pages';
import { useLandingMotion } from '~/composables/useLandingMotion';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';
import LNav from '~/components/landing/LNav.vue';
import LVine from '~/components/landing/LVine.vue';
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
definePageMeta({ layout: 'bare', alias: ['/en'] });
const lang = useLang();
const L = computed(() => LANDING[lang.value]);
const other = computed(() => linkIn('/', lang.value === 'ms' ? 'en' : 'ms'));

const site = useRuntimeConfig().public.siteUrl;
/** The snippet answers "what is it, for whom, what does it cost" (the hero line is a feeling, not a definition). */
usePublicSeo({
  title: () => (lang.value === 'ms' ? 'Indahnya: galeri gambar majlis dengan QR, e-kad dan RSVP' : 'Indahnya: QR photo gallery, e-invite and RSVP for events'),
  description: () => (lang.value === 'ms'
    ? 'Galeri gambar majlis dengan QR: tetamu scan dan upload tanpa app, terus ke galeri dan TV dewan. E-kad, RSVP dan cari meja dalam satu link. Percuma untuk mula.'
    : 'A QR photo gallery for Malaysian events: guests scan and upload with no app, straight to the gallery and venue screen. E-invite, RSVP and seating in one link.'),
  ogTitle: () => `Indahnya: ${L.value.hero.h1a} ${L.value.hero.h1b}`,
  modified: '2026-11-12',
  graph: true,
});

const motion = useLandingMotion();
const dim = ref(false);
onMounted(() => { void motion.boot(); });
onBeforeUnmount(() => { motion.teardown(); document.documentElement.classList.remove('l-lock'); });
const go = (id: string) => motion.scrollTo(id);
const demoQr = qrArtDataUrl(`${site}/aina-hakim`);
</script>

<template>
  <div class="landing relative min-h-screen" :class="{ 'is-dim': dim }">
    <div class="l-night" aria-hidden="true" />
    <LVine />
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
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" :updated="lang === 'en' ? 'Updated 12 November 2026' : 'Dikemas kini 12 November 2026'" />
  </div>
</template>
