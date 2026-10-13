<script setup lang="ts">
import '~/assets/css/landing.css';
import { ArrowRight, Check, Minus } from 'lucide-vue-next';
import LNav from '~/components/landing/LNav.vue';
import LVine from '~/components/landing/LVine.vue';
import LPricing from '~/components/landing/LPricing.vue';
import LFaq from '~/components/landing/LFaq.vue';
import LFinal from '~/components/landing/LFinal.vue';
import { LANDING, type LandingLang } from '~/composables/useLanding';
import { PRICING } from '~/composables/usePricing';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';

/**
 * Pricing, its own page: the three plans (the landing's cards, so both
 * always agree), every feature side by side, how paying works, and the
 * money questions. Copy in usePricing; numbers in server/utils/plans.ts.
 */
definePageMeta({ layout: 'bare' });
const route = useRoute();
const lang = computed<LandingLang>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const L = computed(() => LANDING[lang.value]);
const P = computed(() => PRICING[lang.value]);
const other = computed(() => (lang.value === 'ms' ? '/harga?lang=en' : '/harga'));

const site = useRuntimeConfig().public.siteUrl;
const url = computed(() => `${site}/harga${lang.value === 'en' ? '?lang=en' : ''}`);
useHead({
  htmlAttrs: { lang: () => (lang.value === 'en' ? 'en-MY' : 'ms-MY') },
  link: [
    { rel: 'canonical', href: url },
    { rel: 'alternate', hreflang: 'ms-MY', href: `${site}/harga` },
    { rel: 'alternate', hreflang: 'en-MY', href: `${site}/harga?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${site}/harga` },
  ],
  script: [{
    type: 'application/ld+json',
    // the offers themselves live on the app entity in the site graph
    innerHTML: () => ldJson([
      ...siteGraph(site, lang.value),
      {
        '@type': 'WebPage', '@id': `${url.value}#webpage`, url: url.value, name: P.value.seoTitle, description: P.value.seoDesc,
        inLanguage: lang.value === 'en' ? 'en-MY' : 'ms-MY', isPartOf: { '@id': `${site}/#website` }, about: { '@id': `${site}/#app` },
        dateModified: '2026-10-13T00:00:00+08:00',
      },
      {
        '@type': 'FAQPage', '@id': `${url.value}#faq`, isPartOf: { '@id': `${url.value}#webpage` },
        mainEntity: P.value.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ]),
  }],
});
useSeoMeta({
  title: () => P.value.seoTitle, description: () => P.value.seoDesc,
  ogTitle: () => P.value.seoTitle, ogDescription: () => P.value.seoDesc, ogUrl: url, ogType: 'website', ogSiteName: 'Indahnya',
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
      <LPricing :L="L" page :eyebrow="P.eyebrow" />

      <!-- every feature, side by side; on a phone the label takes its own line above the three values -->
      <section class="l-wrap py-16 md:py-24">
        <div class="max-w-[720px]">
          <h2 class="l-h2">{{ P.compare.title }}</h2>
          <p class="l-lead mt-6">{{ P.compare.body }}</p>
        </div>
        <div role="table" :aria-label="P.compare.title" class="mt-10 rounded-[28px] bg-[#fdfcfb] px-4 pb-4 shadow-[0_1px_0_rgba(26,26,26,.04),0_24px_60px_-40px_rgba(60,48,36,.3)] md:mt-14 md:px-8 md:pb-6">
          <div role="rowgroup" class="sticky top-0 z-10 -mx-4 rounded-t-[28px] bg-[#fdfcfb]/95 px-4 backdrop-blur md:-mx-8 md:px-8">
            <div role="row" class="cmp-row border-b border-[#1a1a1a]/10 py-4 md:py-5">
              <span role="columnheader" class="max-sm:sr-only" />
              <span v-for="(n, i) in P.compare.plans" :key="n" role="columnheader" class="cmp-cell text-[15px] font-semibold text-[#1a1a1a] md:text-[17px]" :class="i === 1 && 'is-hot'">{{ n }}</span>
            </div>
          </div>
          <div v-for="g in P.compare.groups" :key="g.title" role="rowgroup">
            <div role="row" class="pb-2 pt-7"><span role="rowheader" class="text-[13px] font-semibold uppercase tracking-[.12em] text-[#27622a]">{{ g.title }}</span></div>
            <div v-for="r in g.rows" :key="r.label" role="row" class="cmp-row border-b border-[#1a1a1a]/[.07] py-3.5 last:border-0 md:py-4">
              <span role="rowheader" class="max-sm:col-span-3 max-sm:pb-1.5">
                <span class="block text-[15px] font-medium leading-[1.35] text-[#1a1a1a] md:text-[16px]">{{ r.label }}</span>
                <span v-if="r.hint" class="mt-0.5 block text-[13px] leading-[1.4] text-[#75716d]">{{ r.hint }}</span>
              </span>
              <span v-for="(v, i) in r.v" :key="i" role="cell" class="cmp-cell text-[15px] text-[#1a1a1a] md:text-[16px]" :class="i === 1 && 'is-hot'">
                <Check v-if="v === true" class="size-5 text-[#27622a]" :stroke-width="2.25" :aria-label="lang === 'en' ? 'Included' : 'Ada'" />
                <Minus v-else-if="v === false" class="size-5 text-[#b9b6b1]" :stroke-width="2" :aria-label="lang === 'en' ? 'Not included' : 'Tiada'" />
                <span v-else class="font-semibold tabular-nums">{{ v }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- how paying works -->
      <section class="l-wrap py-16 md:py-24">
        <h2 class="l-h2 max-w-[16ch]">{{ P.how.title }}</h2>
        <ul class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14" role="list">
          <li v-for="(x, i) in P.how.items" :key="x.title" class="flex flex-col rounded-[28px] p-6 md:p-8" :class="i === 3 ? 'bg-[#e6f3e1]' : 'bg-[#fdfcfb] shadow-[0_1px_0_rgba(26,26,26,.04),0_24px_60px_-40px_rgba(60,48,36,.3)]'">
            <h3 class="l-h3">{{ x.title }}</h3>
            <p class="l-body mt-3">{{ x.body }}</p>
            <NuxtLink v-if="i === 3" :to="lang === 'en' ? '/terma?lang=en' : '/terma'" class="mt-6 inline-flex items-center gap-2 self-start text-[15px] font-semibold text-[#27622a] hover:underline">{{ P.how.terms }}<ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" /></NuxtLink>
          </li>
        </ul>
      </section>

      <LFaq :L="L" :faq="P.faq" />
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>

<style scoped>
.cmp-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: center; column-gap: 8px; }
@media (min-width: 640px) { .cmp-row { grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)); column-gap: 16px; } }
.cmp-cell { display: flex; justify-content: center; text-align: center; }
/* the RM59 column carries the same weight it has among the cards */
.cmp-cell.is-hot { color: #27622a; }
</style>
