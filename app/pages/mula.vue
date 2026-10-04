<script setup lang="ts">
import '~/assets/css/landing.css';
import { ArrowRight, MessageCircle } from 'lucide-vue-next';
import LNav from '~/components/landing/LNav.vue';
import LFinal from '~/components/landing/LFinal.vue';
import { LANDING, type LandingLang } from '~/composables/useLanding';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';

/**
 * Where the host side's doors lead in the static preview (see
 * middleware/preview.global.ts): sign-up is not open yet, the sample is.
 * Exists only in the preview; the real site 404s it.
 */
definePageMeta({ layout: 'bare' });
const cfg = useRuntimeConfig().public;
if (!cfg.preview) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });

const route = useRoute();
const lang = computed<LandingLang>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const L = computed(() => LANDING[lang.value]);
const other = computed(() => (lang.value === 'ms' ? '/mula?lang=en' : '/mula'));
const C = computed(() => lang.value === 'en'
  ? { eyebrow: 'Preview', title: 'Indahnya is not open to the public yet.', body: 'This is a preview. You can walk through the sample event for Aina & Hakim, but creating your own event is not open yet. Want Indahnya for your event? WhatsApp us and we will tell you when it opens.', sample: 'See the sample', wa: 'WhatsApp us' }
  : { eyebrow: 'Pratonton', title: 'Indahnya belum buka untuk umum.', body: 'Ni versi pratonton. Korang boleh tengok contoh majlis Aina & Hakim, tapi buat majlis sendiri belum boleh lagi. Nak guna Indahnya untuk majlis korang? WhatsApp kami, nanti kami bagitahu bila dah buka.', sample: 'Tengok contoh', wa: 'WhatsApp kami' });

useHead({ htmlAttrs: { lang: () => (lang.value === 'en' ? 'en-MY' : 'ms-MY') } });
useSeoMeta({ title: () => `${C.value.eyebrow} · Indahnya`, robots: 'noindex' });
const demoQr = qrArtDataUrl(`${cfg.siteUrl}/aina-hakim`);
onBeforeUnmount(() => document.documentElement.classList.remove('l-lock'));
</script>

<template>
  <div class="landing min-h-screen">
    <LNav :L="L" :other="other" :home="false" />
    <main class="l-wrap pb-24 pt-36 md:pb-32 md:pt-48">
      <p class="text-[14px] font-semibold uppercase tracking-[.12em] text-[#27622a]">{{ C.eyebrow }}</p>
      <h1 class="l-display mt-4 max-w-[14ch] text-[clamp(44px,6.4vw,100px)]">{{ C.title }}</h1>
      <p class="l-lead mt-8 !max-w-[56ch]">{{ C.body }}</p>
      <div class="mt-10 flex flex-wrap gap-3">
        <NuxtLink :to="lang === 'en' ? '/aina-hakim?lang=en' : '/aina-hakim'" class="l-btn l-btn-go">{{ C.sample }}<ArrowRight class="size-5" :stroke-width="2" aria-hidden="true" /></NuxtLink>
        <a href="https://wa.me/60139078719" target="_blank" rel="noopener" class="l-btn l-btn-line"><MessageCircle class="size-5" :stroke-width="2" aria-hidden="true" />{{ C.wa }}</a>
      </div>
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>
