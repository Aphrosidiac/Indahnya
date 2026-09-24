<script setup lang="ts">
import { Logo } from '~/ui';
import type { LegalDoc } from '~/composables/useLegal';

/** The privacy notice and the terms share one plain reading page: the landing's ground, one column, BM or EN. */
const props = defineProps<{ doc: Record<'ms' | 'en', LegalDoc>; path: string }>();
const route = useRoute();
const lang = computed<'ms' | 'en'>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const d = computed(() => props.doc[lang.value]);
const site = useRuntimeConfig().public.siteUrl;
useHead({
  htmlAttrs: { lang: () => lang.value },
  link: [
    { rel: 'canonical', href: () => `${site}${props.path}${lang.value === 'en' ? '?lang=en' : ''}` },
    { rel: 'alternate', hreflang: 'ms', href: `${site}${props.path}` },
    { rel: 'alternate', hreflang: 'en', href: `${site}${props.path}?lang=en` },
  ],
});
useSeoMeta({ title: () => `${d.value.title} · Indahnya`, description: () => d.value.intro });
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-ink-800">
    <header class="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-5">
      <NuxtLink to="/" aria-label="Indahnya — laman utama"><Logo :size="26" /></NuxtLink>
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
        <NuxtLink to="/" class="hover:text-ink-900">indahnya.my</NuxtLink> · FF Dev Studio ·
        <NuxtLink :to="path === '/privasi' ? '/terma' : '/privasi'" class="hover:text-ink-900">{{ path === '/privasi' ? (lang === 'en' ? 'Terms' : 'Terma') : (lang === 'en' ? 'Privacy' : 'Privasi') }}</NuxtLink>
      </p>
    </main>
  </div>
</template>
