<script setup lang="ts">
import { Logo } from '~/ui';
import type { LegalDoc } from '~/composables/useLegal';

/**
 * The privacy notice and the terms share one plain reading page: the
 * landing's ground, one column, BM or EN. Each language is its own URL
 * (`?lang=en`) with reciprocal hreflang, and a WebPage JSON-LD that points
 * at the site-wide Organization and WebSite by @id (useSiteGraph).
 */
const props = defineProps<{ doc: Record<'ms' | 'en', LegalDoc>; path: string }>();
const route = useRoute();
const lang = computed<'ms' | 'en'>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const d = computed(() => props.doc[lang.value]);
const site = useRuntimeConfig().public.siteUrl;
const url = computed(() => `${site}${props.path}${lang.value === 'en' ? '?lang=en' : ''}`);
const title = computed(() => `${d.value.title} · Indahnya`);
useHead({
  htmlAttrs: { lang: () => (lang.value === 'en' ? 'en-MY' : 'ms-MY') },
  link: [
    { rel: 'canonical', href: url },
    { rel: 'alternate', hreflang: 'ms-MY', href: `${site}${props.path}` },
    { rel: 'alternate', hreflang: 'en-MY', href: `${site}${props.path}?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${site}${props.path}` },
  ],
  script: () => [{ type: 'application/ld+json', innerHTML: ldJson([{
    '@type': 'WebPage', '@id': `${url.value}#webpage`, url: url.value, name: d.value.title, description: d.value.intro,
    inLanguage: lang.value === 'en' ? 'en-MY' : 'ms-MY', isPartOf: { '@id': `${site}/#website` }, publisher: { '@id': `${site}/#org` },
  }]) }],
});
useSeoMeta({
  title, description: () => d.value.intro,
  ogTitle: title, ogDescription: () => d.value.intro, ogUrl: url, ogType: 'website', ogSiteName: 'Indahnya',
  ogLocale: () => (lang.value === 'en' ? 'en_MY' : 'ms_MY'), ogImage: `${site}/og.jpg`, ogImageWidth: 1200, ogImageHeight: 630, twitterCard: 'summary_large_image',
});
const LINKS = [{ path: '/tentang', ms: 'Tentang', en: 'About' }, { path: '/privasi', ms: 'Privasi', en: 'Privacy' }, { path: '/terma', ms: 'Terma', en: 'Terms' }];
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-ink-800">
    <header class="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-5">
      <NuxtLink to="/" aria-label="Indahnya — laman utama"><Logo :size="22" /></NuxtLink>
      <NuxtLink :to="lang === 'en' ? { path } : { path, query: { lang: 'en' } }" class="rounded-sm px-2.5 py-2 text-[13px] font-medium text-ink-500 hover:bg-sand hover:text-ink-900">{{ d.other }}</NuxtLink>
    </header>
    <main class="reveal mx-auto w-full max-w-[760px] px-5 pb-20 pt-6">
      <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">{{ d.title }}</h1>
      <p class="mt-2 text-[13px] text-ink-500">{{ d.updated }}</p>
      <p class="mt-6 text-[16px] leading-[1.65] text-ink-700">{{ d.intro }}</p>
      <section v-for="s in d.sections" :key="s.h" class="mt-9">
        <h2 class="text-[18px] font-semibold leading-7 text-ink-900">{{ s.h }}</h2>
        <ul v-if="s.ul" class="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-ink-700 marker:text-ink-300">
          <li v-for="x in s.ul" :key="x">{{ x }}</li>
        </ul>
        <p v-for="x in s.p ?? []" :key="x" class="mt-3 text-[15px] leading-[1.65] text-ink-700">{{ x }}</p>
      </section>
      <p class="mt-14 border-t border-line-100 pt-6 text-[13px] text-ink-500">
        <NuxtLink to="/" class="inline-block py-2.5 hover:text-ink-900">indahnya.my</NuxtLink> · FF Dev Studio
        <template v-for="l in LINKS.filter(x => x.path !== path)" :key="l.path"> · <NuxtLink :to="lang === 'en' ? { path: l.path, query: { lang: 'en' } } : l.path" class="inline-block py-2.5 hover:text-ink-900">{{ l[lang] }}</NuxtLink></template>
      </p>
    </main>
  </div>
</template>
