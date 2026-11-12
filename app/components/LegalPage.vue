<script setup lang="ts">
import { linkIn } from '~~/shared/utils/site-pages';
import { Logo } from '~/ui';
import type { LegalDoc } from '~/composables/useLegal';
import { COMPANY } from '~~/shared/company';

/**
 * The privacy notice and the terms share one plain reading page: the
 * landing's ground, one column, BM or EN. Each language is its own URL
 * (BM at the root, English under /en) with reciprocal hreflang; the head
 * comes from usePublicSeo.
 */
const props = defineProps<{ doc: Record<'ms' | 'en', LegalDoc>; path: string }>();
const lang = useLang();
const d = computed(() => props.doc[lang.value]);
const title = computed(() => `${d.value.title} · Indahnya QR`);
usePublicSeo({
  title: () => title.value,
  description: () => d.value.desc,
  modified: d.value.mod,
  crumbs: () => [{ name: d.value.title, path: linkIn(props.path, lang.value) }],
});
const cfg = useRuntimeConfig().public.legal;
const legal = { name: cfg.name || COMPANY.name, reg: cfg.reg || COMPANY.reg, address: cfg.address || COMPANY.address };
const LINKS = [
  { path: '/tentang', ms: 'Tentang', en: 'About' }, { path: '/privasi', ms: 'Privasi', en: 'Privacy' }, { path: '/terma', ms: 'Terma', en: 'Terms' },
  { path: '/bayaran-balik', ms: 'Bayaran balik', en: 'Refunds' }, { path: '/penghantaran', ms: 'Penghantaran', en: 'Delivery' },
];
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-ink-800">
    <header class="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-5">
      <NuxtLink :to="linkIn('/', lang)" :aria-label="lang === 'en' ? 'Indahnya home' : 'Indahnya, laman utama'"><Logo :size="22" /></NuxtLink>
      <NuxtLink :to="linkIn(path, lang === 'en' ? 'ms' : 'en')" class="rounded-sm px-2.5 py-2 text-[13px] font-medium text-ink-600 hover:bg-sand hover:text-ink-900">{{ d.other }}</NuxtLink>
    </header>
    <main class="mx-auto w-full max-w-[760px] px-5 pb-20 pt-6">
      <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">{{ d.title }}</h1>
      <p class="mt-2 text-[13px] text-ink-600">{{ d.updated }}</p>
      <p class="mt-6 text-[16px] leading-[1.65] text-ink-700">{{ d.intro }}</p>
      <p v-if="legal.name" class="mt-4 rounded-[12px] border border-line-100 bg-surface-0 px-4 py-3 text-[14px] leading-[1.6] text-ink-700">
        <span class="font-medium text-ink-900">{{ lang === 'en' ? 'Operated by' : 'Dikendalikan oleh' }}:</span> {{ legal.name }}<template v-if="legal.reg"> ({{ legal.reg }})</template><template v-if="legal.address">, {{ legal.address }}</template>
      </p>
      <section v-for="s in d.sections" :key="s.h" class="mt-9">
        <h2 class="text-[18px] font-semibold leading-7 text-ink-900">{{ s.h }}</h2>
        <ul v-if="s.ul" class="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-ink-700 marker:text-ink-300">
          <li v-for="x in s.ul" :key="x">{{ x }}</li>
        </ul>
        <p v-for="x in s.p ?? []" :key="x" class="mt-3 text-[15px] leading-[1.65] text-ink-700">{{ x }}</p>
      </section>
      <footer class="mt-14 border-t border-line-100 pt-6 text-[13px] text-ink-600">
        <p>
          <NuxtLink to="/" class="inline-block py-2.5 hover:text-ink-900">indahnya.my</NuxtLink>
          <template v-for="l in LINKS.filter(x => x.path !== path)" :key="l.path"> · <NuxtLink :to="linkIn(l.path, lang)" class="inline-block py-2.5 hover:text-ink-900">{{ l[lang] }}</NuxtLink></template>
        </p>
        <CompanyInfo class="mt-2" />
      </footer>
    </main>
  </div>
</template>
