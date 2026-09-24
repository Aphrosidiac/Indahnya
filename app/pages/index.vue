<script setup lang="ts">
import {
  Camera, QrCode, MonitorPlay, Images, Mail, Users, Mic, Download, ShieldCheck, Link2, Check, ArrowRight,
  Sparkles, Clock, ChevronDown, MessageCircle,
} from 'lucide-vue-next';
import { Logo, Btn, Chip, KpiStrip, Stat, Card, ActionRow, Meter, IconBox } from '~/ui';
import { LANDING, type LandingLang } from '~/composables/useLanding';

/**
 * The landing. Same ground, ink and green as the product, so the site reads
 * as the product's older sibling. The hero is a gallery that fills itself —
 * the product demoing the product — and the rest is POV's proven order:
 * how → features → the host's side → print → price → FAQ → one last door.
 *
 * Motion follows the house rule: nothing owns its resting state. Sections
 * arrive with `.reveal` when they scroll in (no fill mode); the hero grid is
 * a <TransitionGroup> so tiles that are already there simply move.
 */
definePageMeta({ layout: 'bare' });
const route = useRoute();
const lang = computed<LandingLang>(() => (route.query.lang === 'en' ? 'en' : 'ms'));
const L = computed(() => LANDING[lang.value]);
const other = computed(() => (lang.value === 'ms' ? { path: '/', query: { lang: 'en' } } : { path: '/' }));

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
  title: () => lang.value === 'ms' ? 'Indahnya — galeri gambar majlis dengan QR' : 'Indahnya — QR photo gallery for your event',
  description: () => L.value.hero.sub,
  ogTitle: () => `Indahnya — ${L.value.hero.h1a} ${L.value.hero.h1b} ${L.value.hero.h1c}`,
  ogDescription: () => L.value.hero.sub,
  ogUrl: canonical,
  ogType: 'website',
  ogSiteName: 'Indahnya',
  ogLocale: () => (lang.value === 'en' ? 'en_MY' : 'ms_MY'),
  ogImage: `${site}/og.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Indahnya — galeri gambar majlis dengan QR',
  twitterCard: 'summary_large_image',
});

/* ── the photos: free-to-use Unsplash frames, Malaysian where we could find them ── */
const META: Record<string, [number, number]> = { g01: [900, 507], g02: [900, 1351], g03: [900, 600], g04: [900, 1351], g07: [900, 1350], g08: [900, 600], g09: [900, 1350], g10: [900, 1350], g11: [900, 600], g13: [900, 1350], g14: [900, 1350], g15: [900, 620], g17: [900, 1350], g18: [900, 600], g20: [900, 600], g21: [900, 1169], g22: [900, 1350] };
const NAMES = ['Makcik Ros', 'Aiman', 'Team Office', 'Kak Yati', 'Pak Long', 'Nadia & Irfan', 'Abang Faiz', 'Cousins', 'Uncle Lim', 'Syafiq', 'Auntie Mei', 'Hana'];
const ORDER = ['g08', 'g04', 'g18', 'g11', 'g21', 'g15', 'g09', 'g20', 'g13', 'g01', 'g02', 'g17', 'g03', 'g14', 'g22', 'g10', 'g07'];
interface Tile { key: number; src: string; name: string; tall: boolean }
let seq = 0;
const mk = (id: string): Tile => ({ key: ++seq, src: `/landing/s/${id}.webp`, name: NAMES[seq % NAMES.length]!, tall: META[id]![1] > META[id]![0] });
const tiles = ref<Tile[]>(ORDER.slice(0, 9).map(mk));
const liveCount = ref(127);
let cursor = 9;
let liveTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  liveTimer = setInterval(() => {
    if (document.hidden) return;
    tiles.value = [mk(ORDER[cursor % ORDER.length]!), ...tiles.value.slice(0, 8)];
    cursor++; liveCount.value++;
  }, 2600);
});
onBeforeUnmount(() => clearInterval(liveTimer));

/* ── arrive-on-scroll: add `.reveal` once, on entry; before that the element is simply visible ── */
const revealRoot = ref<HTMLElement>();
onMounted(() => {
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { (e.target as HTMLElement).classList.add('reveal'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  revealRoot.value?.querySelectorAll('[data-arrive]').forEach(el => io.observe(el));
  onBeforeUnmount(() => io.disconnect());
});

const FEATURE_ICONS = [Images, MonitorPlay, Mail, Users, Mic, Download, ShieldCheck, Link2];
const open = ref<number | null>(0);
const demoQr = ref('');
onMounted(async () => { demoQr.value = await (await import('qrcode')).toDataURL(`${site}/aina-hakim`, { margin: 0, width: 240, color: { dark: '#1a1a1a', light: '#00000000' } }); });
</script>

<template>
  <div ref="revealRoot" class="min-h-screen bg-surface-50 text-ink-800">
    <!-- nav -->
    <header class="sticky top-0 z-30 bg-surface-50/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
        <NuxtLink to="/" class="rounded-sm"><Logo :size="28" /></NuxtLink>
        <nav class="hidden items-center gap-1 md:flex" aria-label="Utama">
          <a v-for="(label, key) in { how: L.nav.how, features: L.nav.features, pricing: L.nav.pricing, faq: L.nav.faq }" :key="key" :href="`#${key}`"
            class="rounded-sm px-3 py-2 text-[14px] text-ink-600 transition-colors hover:bg-sand hover:text-ink-900">{{ label }}</a>
        </nav>
        <div class="flex items-center gap-2">
          <NuxtLink :to="other" class="rounded-sm px-2.5 py-2 text-[13px] font-medium text-ink-500 transition-colors hover:bg-sand hover:text-ink-900">{{ L.nav.lang }}</NuxtLink>
          <NuxtLink to="/masuk" class="hidden rounded-sm px-3 py-2 text-[14px] text-ink-600 transition-colors hover:bg-sand hover:text-ink-900 sm:block">{{ L.nav.login }}</NuxtLink>
          <Btn to="/app?new=1" variant="accent">{{ L.nav.cta }}</Btn>
        </div>
      </div>
    </header>

    <!-- hero -->
    <section class="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 pb-16 pt-10 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-24 lg:pt-16">
      <div class="reveal lg:col-span-6">
        <Chip tone="green">{{ L.hero.eyebrow }}</Chip>
        <h1 class="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900 sm:text-[52px] lg:text-[60px]">
          {{ L.hero.h1a }}<br>{{ L.hero.h1b }}<br><span class="relative inline-block">{{ L.hero.h1c }}<span class="absolute inset-x-0 -bottom-1 -z-10 h-[0.32em] rounded-full bg-primary-400/70" aria-hidden="true" /></span>
        </h1>
        <p class="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-ink-600">{{ L.hero.sub }}</p>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <Btn to="/app?new=1" variant="accent" size="lg"><Sparkles class="size-[18px]" :stroke-width="1.75" aria-hidden="true" />{{ L.hero.cta }}</Btn>
          <Btn to="/aina-hakim/gambar" variant="secondary" size="lg">{{ L.hero.demo }}<ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" /></Btn>
        </div>
        <p class="mt-4 text-[13px] leading-[18px] text-ink-500">{{ L.hero.trust }} <NuxtLink to="/aina-hakim" class="font-medium text-ink-700 underline underline-offset-2 hover:text-ink-900">{{ L.hero.demoKad }}</NuxtLink></p>
      </div>

      <!-- the gallery that fills itself -->
      <div class="lg:col-span-6">
        <div class="card overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="min-w-0"><p class="truncate text-[14px] font-semibold leading-5 text-ink-900">Aina &amp; Hakim</p><p class="text-[12px] leading-4 text-ink-500">indahnya.my/aina-hakim</p></div>
            <span class="inline-flex h-7 items-center gap-1.5 rounded-full bg-danger-50 px-2.5 text-[12px] font-medium text-danger-600"><span class="size-1.5 animate-pulse rounded-full bg-danger-600" />{{ L.hero.live }} · <span class="num">{{ liveCount }}</span> {{ L.hero.photos }}</span>
          </div>
          <TransitionGroup tag="div" class="grid grid-cols-4 gap-1 bg-line-100 p-1" name="tile" move-class="tile-move">
            <div v-for="(t, i) in tiles" :key="t.key" class="relative aspect-square overflow-hidden rounded-[8px] bg-sand" :class="i === 0 && 'col-span-2 row-span-2'">
              <img :src="i === 0 ? t.src.replace('/s/', '/').replace('.webp', '.jpg') : t.src" alt="" class="size-full object-cover" :loading="i < 8 ? 'eager' : 'lazy'" :fetchpriority="i === 0 ? 'high' : undefined" decoding="async" />
              <span class="pointer-events-none absolute bottom-1.5 left-1.5 max-w-[85%] truncate rounded-full bg-ink-900/60 px-1.5 text-[10px] leading-5 text-white backdrop-blur-sm">{{ t.name }}</span>
            </div>
          </TransitionGroup>
          <div class="flex items-center justify-between gap-3 bg-surface-0 px-4 py-3">
            <div class="flex -space-x-1.5">
              <span v-for="(n, i) in ['MR', 'A', 'TO', 'KY']" :key="n" class="grid size-6 place-items-center rounded-full border-2 border-surface-0 text-[9px] font-semibold text-white" :class="['bg-ink-700', 'bg-steel-600', 'bg-primary-600', 'bg-violet-600'][i]">{{ n }}</span>
            </div>
            <span class="inline-flex h-9 items-center gap-2 rounded-full bg-ink-700 px-4 text-[13px] font-medium text-white"><Camera class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.how.phone.title }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- film strip -->
    <div class="strip overflow-hidden py-2" aria-hidden="true">
      <div class="strip-track flex w-max gap-2">
        <template v-for="rep in 2" :key="rep">
          <img v-for="id in ORDER" :key="`${rep}-${id}`" :src="`/landing/s/${id}.webp`" alt="" :width="Math.round(160 * META[id]![0] / META[id]![1])" height="160" class="h-[120px] w-auto rounded-[10px] object-cover sm:h-[160px]" loading="lazy" decoding="async" />
        </template>
      </div>
    </div>

    <!-- how -->
    <section id="how" class="mx-auto w-full max-w-[1200px] scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
      <div data-arrive class="max-w-[640px]">
        <p class="eyebrow">{{ L.how.eyebrow }}</p>
        <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[40px]">{{ L.how.title }}</h2>
      </div>
      <div class="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- 01 the QR -->
        <div data-arrive class="card flex flex-col overflow-hidden">
          <div class="flex flex-1 items-center justify-center bg-callout-green p-8">
            <div class="w-[190px] rounded-[10px] bg-surface-0 p-4 text-center shadow-md" style="transform: rotate(-2deg)">
              <p class="text-[12px] font-semibold leading-4 text-ink-900">Aina &amp; Hakim</p>
              <p class="mt-1 text-[9px] leading-3 text-ink-500">{{ L.print.headline }}</p>
              <img v-if="demoQr" :src="demoQr" alt="" class="mx-auto mt-3 size-[110px]" />
              <div v-else class="mx-auto mt-3 size-[110px] rounded-[6px] bg-sand" />
              <p class="mt-2 text-[9px] font-medium leading-3 text-ink-900">indahnya.my/aina-hakim</p>
            </div>
          </div>
          <div class="p-5"><p class="num text-[12px] font-medium text-ink-400">{{ L.how.steps[0]!.n }}</p><h3 class="mt-1 text-[17px] font-semibold leading-6 text-ink-900">{{ L.how.steps[0]!.title }}</h3><p class="mt-1.5 text-[14px] leading-5 text-ink-600">{{ L.how.steps[0]!.body }}</p></div>
        </div>
        <!-- 02 the phone -->
        <div data-arrive class="card flex flex-col overflow-hidden">
          <div class="flex flex-1 items-end justify-center bg-sand px-8 pt-8">
            <div class="w-[210px] rounded-t-[26px] border-[6px] border-b-0 border-ink-900 bg-surface-50 px-2.5 pt-3 shadow-lg">
              <div class="mx-auto mb-2.5 h-4 w-16 rounded-full bg-ink-900" />
              <div class="card p-2.5">
                <div class="flex items-center gap-2"><span class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-primary-400 text-ink-900"><Camera class="size-4" :stroke-width="1.75" aria-hidden="true" /></span><span class="min-w-0"><span class="block text-[11px] font-semibold leading-4 text-ink-900">{{ L.how.phone.title }}</span><span class="block truncate text-[9px] leading-3 text-ink-500">{{ L.how.phone.sub }}</span></span></div>
              </div>
              <div class="mt-2 grid grid-cols-3 gap-1">
                <img v-for="id in ['g18', 'g11', 'g20', 'g08', 'g03', 'g15']" :key="id" :src="`/landing/s/${id}.webp`" alt="" class="aspect-square w-full rounded-[6px] object-cover" loading="lazy" />
              </div>
              <div class="card mt-2 p-2.5">
                <p class="text-[10px] font-medium leading-4 text-ink-900">{{ L.how.phone.uploading }}</p>
                <Meter bare :pct="72" tone="green" class="mt-1.5" />
                <p class="mt-1 text-[9px] leading-3 text-ink-500">8 / 12 · 4.1 MB</p>
              </div>
            </div>
          </div>
          <div class="p-5"><p class="num text-[12px] font-medium text-ink-400">{{ L.how.steps[1]!.n }}</p><h3 class="mt-1 text-[17px] font-semibold leading-6 text-ink-900">{{ L.how.steps[1]!.title }}</h3><p class="mt-1.5 text-[14px] leading-5 text-ink-600">{{ L.how.steps[1]!.body }}</p></div>
        </div>
        <!-- 03 the TV -->
        <div data-arrive class="card flex flex-col overflow-hidden">
          <div class="flex flex-1 items-center justify-center bg-ink-700 p-8">
            <div class="relative aspect-video w-full max-w-[300px] overflow-hidden rounded-[8px] bg-[#0f0f0f] shadow-lg ring-4 ring-ink-900">
              <img src="/landing/g08.jpg" alt="" class="absolute inset-0 size-full object-cover" loading="lazy" />
              <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
                <div class="min-w-0"><p class="truncate text-[10px] font-semibold leading-3 text-white">Aina &amp; Hakim</p><p class="text-[8px] leading-3 text-white/70">318 {{ L.hero.photos }}</p></div>
                <p class="truncate rounded-full bg-white/15 px-2 py-0.5 text-[8px] text-white backdrop-blur-sm">📷 Makcik Ros</p>
                <div class="flex shrink-0 items-center gap-1.5"><p class="text-[7px] leading-3 text-white/80">{{ L.how.tv.scan }}</p><img v-if="demoQr" :src="demoQr" alt="" class="size-6 invert" /></div>
              </div>
            </div>
          </div>
          <div class="p-5"><p class="num text-[12px] font-medium text-ink-400">{{ L.how.steps[2]!.n }}</p><h3 class="mt-1 text-[17px] font-semibold leading-6 text-ink-900">{{ L.how.steps[2]!.title }}</h3><p class="mt-1.5 text-[14px] leading-5 text-ink-600">{{ L.how.steps[2]!.body }}</p></div>
        </div>
      </div>
    </section>

    <!-- features -->
    <section id="features" class="scroll-mt-20 bg-surface-0 py-16 lg:py-24">
      <div class="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        <div data-arrive class="max-w-[640px]">
          <p class="eyebrow">{{ L.features.eyebrow }}</p>
          <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[40px]">{{ L.features.title }}</h2>
        </div>
        <div class="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="(f, i) in L.features.items" :key="f.title" data-arrive>
            <IconBox :icon="FEATURE_ICONS[i]" size="lg" :tone="i === 0 ? 'green' : 'dark'" />
            <h3 class="mt-4 text-[16px] font-semibold leading-6 text-ink-900">{{ f.title }}</h3>
            <p class="mt-1.5 text-[14px] leading-5 text-ink-600">{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- the host's side: a real composition of the real primitives -->
    <section class="mx-auto w-full max-w-[1200px] px-5 py-16 lg:px-8 lg:py-24">
      <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div data-arrive class="lg:col-span-4">
          <p class="eyebrow">{{ L.host.eyebrow }}</p>
          <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[36px]">{{ L.host.title }}</h2>
          <p class="mt-4 text-[15px] leading-[1.55] text-ink-600">{{ L.host.body }}</p>
        </div>
        <div data-arrive class="min-w-0 lg:col-span-8">
          <div class="rounded-[18px] bg-sand p-2 sm:p-4">
            <KpiStrip>
              <Stat v-for="(s, i) in L.host.stats" :key="s.label" :label="s.label" :value="s.value" :sub="s.sub" :icon="[Images, Sparkles, Users, MessageCircle][i]" />
            </KpiStrip>
            <div class="mt-3 grid grid-cols-1 items-start gap-3 xl:grid-cols-3">
              <Card class="xl:col-span-2" :title="L.host.recent" :icon="Images" :count="318" :sub="L.host.recentSub" flush>
                <div class="grid grid-cols-4 gap-px bg-line-100 sm:grid-cols-6">
                  <div v-for="id in ['g13', 'g20', 'g17', 'g11', 'g21', 'g18', 'g09', 'g03', 'g14', 'g15', 'g10', 'g01']" :key="id" class="relative aspect-square overflow-hidden bg-surface-0">
                    <img :src="`/landing/s/${id}.webp`" alt="" class="size-full object-cover" loading="lazy" />
                  </div>
                </div>
              </Card>
              <div class="space-y-3">
                <Card :title="L.host.plan" :icon="Sparkles" :sub="L.host.planName">
                  <div class="space-y-2 text-[13px] leading-[18px]">
                    <p class="flex items-center gap-2 text-ink-600"><Clock class="size-4 shrink-0 text-ink-400" :stroke-width="1.5" aria-hidden="true" />{{ L.host.planLine1 }}</p>
                    <p class="flex items-center gap-2 text-ink-600"><Download class="size-4 shrink-0 text-ink-400" :stroke-width="1.5" aria-hidden="true" />{{ L.host.planLine2 }}</p>
                  </div>
                </Card>
                <Card :title="L.host.actions" :icon="Link2" flush>
                  <ActionRow inset :title="L.host.a1" :sub="L.host.a1s" :icon="QrCode" tone="green" class="border-b border-line-100" />
                  <ActionRow inset :title="L.host.a2" :sub="L.host.a2s" :icon="MonitorPlay" tone="blue" class="border-b border-line-100" />
                  <ActionRow inset :title="L.host.a3" :sub="L.host.a3s" :icon="Download" tone="neutral" />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- print -->
    <section class="bg-surface-0 py-16 lg:py-24">
      <div class="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 lg:grid-cols-12 lg:px-8">
        <div data-arrive class="order-2 lg:order-1 lg:col-span-7">
          <div class="grid grid-cols-3 gap-3 sm:gap-5">
            <div v-for="(t, i) in L.print.items" :key="t" class="flex flex-col items-center gap-3">
              <div class="flex w-full flex-col items-center justify-center rounded-[10px] border border-line-200 bg-surface-0 p-3 shadow-sm sm:p-5" :class="i === 0 ? 'aspect-[148/210]' : i === 1 ? 'aspect-[210/297]' : 'aspect-[210/297]'">
                <template v-if="i < 2">
                  <p class="text-[10px] font-semibold leading-3 text-ink-900 sm:text-[13px] sm:leading-4">Aina &amp; Hakim</p>
                  <p class="mt-2 text-center text-[7px] leading-[10px] text-ink-600 sm:text-[9px]">{{ L.print.headline }}</p>
                  <img v-if="demoQr" :src="demoQr" alt="" class="mt-2 w-[45%] sm:mt-3" />
                  <p class="mt-2 text-[7px] font-medium text-ink-900 sm:text-[9px]">indahnya.my/aina-hakim</p>
                </template>
                <template v-else>
                  <div class="flex w-full flex-1 flex-col items-center justify-center border-b border-dashed border-line-200"><p class="text-[9px] font-semibold text-ink-900 sm:text-[11px]">Aina &amp; Hakim</p><img v-if="demoQr" :src="demoQr" alt="" class="mt-1.5 w-[38%]" /></div>
                  <div class="flex w-full flex-1 rotate-180 flex-col items-center justify-center"><p class="text-[9px] font-semibold text-ink-900 sm:text-[11px]">Aina &amp; Hakim</p><img v-if="demoQr" :src="demoQr" alt="" class="mt-1.5 w-[38%]" /></div>
                </template>
              </div>
              <span class="text-[13px] font-medium text-ink-900">{{ t }}</span>
            </div>
          </div>
        </div>
        <div data-arrive class="order-1 lg:order-2 lg:col-span-5">
          <p class="eyebrow">{{ L.print.eyebrow }}</p>
          <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[36px]">{{ L.print.title }}</h2>
          <p class="mt-4 text-[15px] leading-[1.55] text-ink-600">{{ L.print.body }}</p>
        </div>
      </div>
    </section>

    <!-- pricing -->
    <section id="pricing" class="mx-auto w-full max-w-[1200px] scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
      <div data-arrive class="max-w-[640px]">
        <p class="eyebrow">{{ L.pricing.eyebrow }}</p>
        <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[40px]">{{ L.pricing.title }}</h2>
        <p class="mt-4 text-[15px] leading-[1.55] text-ink-600">{{ L.pricing.body }}</p>
      </div>
      <div class="mt-10 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <div v-for="p in L.pricing.plans" :key="p.name" data-arrive class="flex flex-col rounded-md p-6" :class="p.hot ? 'bg-ink-700 text-white shadow-md' : 'card'">
          <div class="flex items-start justify-between gap-2">
            <div><p class="text-[15px] font-semibold leading-6" :class="p.hot ? 'text-white' : 'text-ink-900'">{{ p.name }}</p><p class="num mt-1 text-[36px] font-semibold leading-10 tracking-[-0.03em]" :class="p.hot ? 'text-white' : 'text-ink-900'">{{ p.price }}</p></div>
            <Chip :tone="p.hot ? 'green' : 'neutral'" size="sm">{{ p.tag }}</Chip>
          </div>
          <ul class="mt-5 flex-1 space-y-2.5 text-[14px] leading-5" :class="p.hot ? 'text-white/85' : 'text-ink-600'">
            <li v-for="r in p.rows" :key="r" class="flex items-start gap-2"><Check class="mt-0.5 size-4 shrink-0" :class="p.hot ? 'text-primary-400' : 'text-success-600'" :stroke-width="2" aria-hidden="true" />{{ r }}</li>
          </ul>
          <Btn to="/app?new=1" :variant="p.hot ? 'accent' : 'secondary'" block class="mt-6">{{ p.cta }}</Btn>
        </div>
      </div>
      <p data-arrive class="mt-5 text-[13px] leading-[18px] text-ink-500">{{ L.pricing.note }}</p>
    </section>

    <!-- faq -->
    <section id="faq" class="scroll-mt-20 bg-surface-0 py-16 lg:py-24">
      <div class="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-5 lg:grid-cols-12 lg:px-8">
        <div data-arrive class="lg:col-span-4">
          <p class="eyebrow">{{ L.faq.eyebrow }}</p>
          <h2 class="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900 sm:text-[36px]">{{ L.faq.title }}</h2>
        </div>
        <div data-arrive class="divide-y divide-line-100 lg:col-span-8">
          <div v-for="(f, i) in L.faq.items" :key="f.q">
            <button type="button" class="flex w-full items-center justify-between gap-4 py-4 text-left" :aria-expanded="open === i" @click="open = open === i ? null : i">
              <span class="text-[16px] font-medium leading-6 text-ink-900">{{ f.q }}</span>
              <ChevronDown class="size-5 shrink-0 text-ink-400 transition-transform duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)]" :class="open === i && 'rotate-180'" :stroke-width="1.75" aria-hidden="true" />
            </button>
            <div class="grid transition-[grid-template-rows] duration-[200ms] ease-[cubic-bezier(.2,.8,.2,1)]" :style="{ gridTemplateRows: open === i ? '1fr' : '0fr' }">
              <div class="overflow-hidden"><p class="pb-5 text-[15px] leading-[1.55] text-ink-600">{{ f.a }}</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- last door -->
    <section class="mx-auto w-full max-w-[1200px] px-5 py-16 lg:px-8 lg:py-24">
      <div data-arrive class="relative overflow-hidden rounded-lg bg-ink-900 px-6 py-14 text-center text-white sm:px-12 lg:py-20">
        <div class="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
          <div class="grid grid-cols-6 gap-1 p-1 sm:grid-cols-9">
            <img v-for="id in [...ORDER, ...ORDER.slice(0, 10)]" :key="id + 'cta'" :src="`/landing/s/${id}.webp`" alt="" class="aspect-square w-full rounded-[6px] object-cover" loading="lazy" />
          </div>
        </div>
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/85 to-ink-900/55" aria-hidden="true" />
        <div class="relative">
          <h2 class="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">{{ L.cta.title }}</h2>
          <p class="mx-auto mt-4 max-w-[480px] text-[16px] leading-[1.5] text-white/70">{{ L.cta.body }}</p>
          <Btn to="/app?new=1" variant="accent" size="lg" class="mt-8 inline-block"><Sparkles class="size-[18px]" :stroke-width="1.75" aria-hidden="true" />{{ L.cta.button }}</Btn>
        </div>
      </div>
    </section>

    <footer class="mx-auto w-full max-w-[1200px] px-5 pb-10 lg:px-8">
      <div class="flex flex-col items-start justify-between gap-6 border-t border-line-200 pt-8 sm:flex-row sm:items-center">
        <div><Logo :size="24" /><p class="mt-2 text-[13px] leading-[18px] text-ink-500">{{ L.footer.tagline }}</p></div>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-500">
          <NuxtLink :to="lang === 'en' ? '/privasi?lang=en' : '/privasi'" class="hover:text-ink-900">{{ L.footer.links.privacy }}</NuxtLink>
          <NuxtLink :to="lang === 'en' ? '/terma?lang=en' : '/terma'" class="hover:text-ink-900">{{ L.footer.links.terms }}</NuxtLink>
          <a href="https://wa.me/60139078719" target="_blank" rel="noopener" class="hover:text-ink-900">{{ L.footer.links.contact }}</a>
          <span class="text-ink-400">{{ L.footer.by }} <a href="https://ffdev.studio" target="_blank" rel="noopener" class="font-medium text-ink-600 hover:text-ink-900">FF Dev Studio</a> · © {{ new Date().getFullYear() }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* new tiles pop in; existing ones move. Both are transitions on elements
   that already exist by the time they run, so nothing can strand at 0. */
.tile-enter-active { transition: opacity 260ms cubic-bezier(.2,.8,.2,1), transform 260ms cubic-bezier(.2,.8,.2,1); }
.tile-enter-from { opacity: 0; transform: scale(.92); }
.tile-leave-active { position: absolute; opacity: 0; transition: none; }
.tile-move { transition: transform 320ms cubic-bezier(.2,.8,.2,1); }

/* the film strip: an infinite loop whose resting state is simply "visible" */
.strip-track { animation: strip 60s linear infinite; }
@keyframes strip { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@media (prefers-reduced-motion: reduce) { .strip-track { animation: none; } .tile-move, .tile-enter-active { transition: none; } }
</style>
