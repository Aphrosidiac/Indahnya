<script setup lang="ts">
import '~/assets/css/landing.css';
import { ArrowRight, Check, Mail, MessageCircle } from 'lucide-vue-next';
import LNav from '~/components/landing/LNav.vue';
import LVine from '~/components/landing/LVine.vue';
import LFinal from '~/components/landing/LFinal.vue';
import QrStand from '~/components/print/QrStand.vue';
import { LANDING, type LandingLang } from '~/composables/useLanding';
import { ABOUT } from '~/composables/useAbout';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';

/**
 * About: the landing's own page, same nav, type and close, with the facts
 * a reader (or an answer engine) checks Indahnya against. Copy in useAbout;
 * entities in useSiteGraph.
 */
definePageMeta({ layout: 'bare' });
const route = useRoute();
const lang = computed<LandingLang>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const L = computed(() => LANDING[lang.value]);
const A = computed(() => ABOUT[lang.value]);
const other = computed(() => (lang.value === 'ms' ? '/tentang?lang=en' : '/tentang'));

const site = useRuntimeConfig().public.siteUrl;
const url = computed(() => `${site}/tentang${lang.value === 'en' ? '?lang=en' : ''}`);
useHead({
  htmlAttrs: { lang: () => (lang.value === 'en' ? 'en-MY' : 'ms-MY') },
  link: [
    { rel: 'canonical', href: url },
    { rel: 'alternate', hreflang: 'ms-MY', href: `${site}/tentang` },
    { rel: 'alternate', hreflang: 'en-MY', href: `${site}/tentang?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${site}/tentang` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: () => ldJson([
      ...siteGraph(site, lang.value),
      {
        '@type': 'AboutPage', '@id': `${url.value}#webpage`, url: url.value, name: A.value.title, description: A.value.intro,
        inLanguage: lang.value === 'en' ? 'en-MY' : 'ms-MY', isPartOf: { '@id': `${site}/#website` }, about: { '@id': `${site}/#app` },
        dateModified: '2026-10-04T00:00:00+08:00',
      },
    ]),
  }],
});
useSeoMeta({
  title: () => A.value.seoTitle, description: () => A.value.intro,
  ogTitle: () => A.value.seoTitle, ogDescription: () => A.value.intro, ogUrl: url, ogType: 'website', ogSiteName: 'Indahnya',
  ogLocale: () => (lang.value === 'en' ? 'en_MY' : 'ms_MY'), ogImage: `${site}/og.jpg`, ogImageWidth: 1200, ogImageHeight: 630,
  twitterCard: 'summary_large_image',
});
const demoQr = qrArtDataUrl(`${site}/aina-hakim`);
onBeforeUnmount(() => document.documentElement.classList.remove('l-lock'));
</script>

<template>
  <div class="landing relative min-h-screen">
    <LVine />
    <LNav :L="L" :other="other" :home="false" />
    <main>
      <!-- who and what, in one breath -->
      <section class="l-wrap pb-16 pt-32 md:pb-24 md:pt-40">
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div class="lg:col-span-7">
            <p class="text-[14px] font-semibold uppercase tracking-[.12em] text-[#27622a]">{{ A.eyebrow }}</p>
            <h1 class="l-display mt-4 text-[clamp(48px,7vw,112px)]">{{ A.title }}</h1>
            <p class="l-lead mt-8 !max-w-[60ch]">{{ A.intro }}</p>
            <p class="mt-5 text-[13px] text-[#75716d]">{{ A.updated }}</p>
          </div>
          <!-- the product in a glance: the table cards guests meet (no people, so nobody reads as a customer) -->
          <div class="relative mx-auto aspect-[5/4] w-full max-w-[480px] lg:col-span-5" aria-hidden="true">
            <QrStand
              class="!absolute right-[2%] top-0 w-[47%] rotate-[6deg] overflow-hidden rounded-[12px] shadow-[0_30px_60px_-30px_rgba(60,48,36,.55)]"
              :url="`${site}/aina-hakim`" link="indahnya.my/aina-hakim" template="emas" :names="{ a: 'Aina', b: 'Hakim' }" date="15.08.2026" :locale="lang"
            />
            <QrStand
              class="!absolute bottom-0 left-[2%] w-[47%] -rotate-[5deg] overflow-hidden rounded-[12px] shadow-[0_30px_60px_-30px_rgba(60,48,36,.55)]"
              :url="`${site}/aina-hakim`" link="indahnya.my/aina-hakim" template="garden" :names="{ a: 'Aina', b: 'Hakim' }" date="15.08.2026" :locale="lang"
            />
          </div>
        </div>
      </section>

      <!-- the facts, checkable -->
      <section class="l-wrap py-6 md:py-10">
        <div class="grid grid-cols-1 gap-8 rounded-[28px] bg-[#fdfcfb] p-6 shadow-[0_1px_0_rgba(26,26,26,.04),0_24px_60px_-40px_rgba(60,48,36,.3)] md:p-10 lg:grid-cols-12 lg:gap-16">
          <h2 class="l-h2 lg:col-span-4">{{ A.factsTitle }}</h2>
          <dl class="divide-y divide-[#1a1a1a]/10 lg:col-span-8">
            <div v-for="[k, v] in A.facts" :key="k" class="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr] sm:gap-6">
              <dt class="text-[15px] font-semibold text-[#1a1a1a]">{{ k }}</dt>
              <dd class="text-[16px] leading-[1.55] text-[#55524f]">{{ v }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- why -->
      <section class="l-wrap py-20 md:py-28">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-16">
          <h2 class="text-[14px] font-semibold uppercase tracking-[.12em] text-[#27622a] lg:col-span-4 lg:pt-3">{{ A.why.h }}</h2>
          <div class="lg:col-span-8">
            <p class="l-display text-[clamp(32px,3.8vw,56px)]">{{ A.why.lead }}</p>
            <p class="l-lead mt-6">{{ A.why.p }}</p>
          </div>
        </div>
      </section>

      <!-- how -->
      <section class="l-wrap py-6 md:py-10">
        <h2 class="l-h2 max-w-[16ch]">{{ A.how.h }}</h2>
        <ol class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          <li v-for="(s, i) in A.how.steps" :key="s.t" class="rounded-[28px] bg-[#fdfcfb] p-6 shadow-[0_1px_0_rgba(26,26,26,.04),0_24px_60px_-40px_rgba(60,48,36,.3)] md:p-7">
            <span class="l-display block text-[56px] leading-none text-[#27622a]">{{ i + 1 }}</span>
            <h3 class="l-h3 mt-6">{{ s.t }}</h3>
            <p class="l-body mt-2">{{ s.b }}</p>
          </li>
        </ol>
      </section>

      <!-- privacy, and the people -->
      <section class="l-wrap py-20 md:py-28">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div class="rounded-[28px] bg-[#e6f3e1] p-6 md:p-10">
            <h2 class="l-h3">{{ A.privacy.h }}</h2>
            <ul class="mt-6 space-y-4" role="list">
              <li v-for="x in A.privacy.items" :key="x" class="flex gap-3 text-[16px] leading-[1.55] text-[#1a1a1a]">
                <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#27622a] text-white"><Check class="size-3.5" :stroke-width="3" aria-hidden="true" /></span>{{ x }}
              </li>
            </ul>
            <NuxtLink :to="lang === 'en' ? '/privasi?lang=en' : '/privasi'" class="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#27622a] hover:underline">{{ A.privacy.more }}<ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" /></NuxtLink>
          </div>
          <div class="flex flex-col rounded-[28px] bg-[#1a1a1a] p-6 text-[#f3f1ee] md:p-10">
            <h2 class="l-h3">{{ A.who.h }}</h2>
            <p class="mt-4 text-[17px] leading-[1.6] text-[#b9b6b1]">{{ A.who.p }}</p>
            <div class="mt-auto flex flex-wrap gap-2 pt-8">
              <a href="https://wa.me/60139078719" target="_blank" rel="noopener" class="l-btn l-btn-go"><MessageCircle class="size-5" :stroke-width="2" aria-hidden="true" />{{ A.who.wa }}</a>
              <a href="mailto:hello@ffdev.studio" class="l-btn bg-white/10 text-[#f3f1ee] hover:bg-white/15"><Mail class="size-5" :stroke-width="2" aria-hidden="true" />{{ A.who.email }}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>
