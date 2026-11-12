<script setup lang="ts">
import '~/assets/css/landing.css';
import { ArrowRight, MessageCircle } from 'lucide-vue-next';
import LNav from '~/components/landing/LNav.vue';
import LFinal from '~/components/landing/LFinal.vue';
import { LANDING } from '~/composables/useLanding';
import { linkIn, pathIn } from '~~/shared/utils/site-pages';
import type { Crumb } from '~/composables/usePublicSeo';
import { longDate } from '~/data/rivals';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';

/**
 * The frame every long-form public page uses (feature pages, /panduan,
 * /banding, the English guides): the landing's nav and close, a visible
 * breadcrumb, one H1, the answer-first lead, the visible updated date, the
 * page's own sections (default slot), an optional visible FAQ, and an honest
 * call to action.
 *
 * The head (canonical, hreflang, BreadcrumbList, dateModified) comes from
 * usePublicSeo with the same title, crumbs and date, so what the page shows
 * and what the markup says can never drift apart.
 *
 * Pre-launch: while sign-up is closed (runtimeConfig.public.preview) the
 * second button says so and opens /mula; the day it opens, it becomes the
 * normal "start free" button with no page edits.
 */
const props = defineProps<{
  /** <title>, 25–60 characters. */
  title: string;
  /** Meta description, 120–160 characters. */
  description: string;
  h1: string;
  /** First 40–60 words: the answer, naming Indahnya with its category. */
  lead: string;
  /** YYYY-MM-DD; shown as "Dikemas kini …" and used as dateModified. */
  modified: string;
  /** Trail after Home; the last crumb is this page. */
  crumbs: Crumb[];
  kicker?: string;
  faq?: { q: string; a: string }[];
  type?: 'WebPage' | 'Article' | 'CollectionPage';
}>();

const lang = useLang();
const L = computed(() => LANDING[lang.value]);
const en = computed(() => lang.value === 'en');
const route = useRoute();
// the same page in the other language, or that language's home when this page has no twin
const other = computed(() => pathIn(route.path, en.value ? 'ms' : 'en') ?? linkIn('/', en.value ? 'ms' : 'en'));
const preview = useRuntimeConfig().public.preview;
const site = useRuntimeConfig().public.siteUrl;
const demoQr = qrArtDataUrl(`${site}/aina-hakim`);

usePublicSeo({
  title: () => props.title,
  description: () => props.description,
  type: props.type === 'CollectionPage' ? 'CollectionPage' : 'WebPage',
  modified: props.modified,
  crumbs: () => props.crumbs,
  extra: url => (props.type ?? 'Article') === 'Article'
    ? [{ '@type': 'Article', '@id': `${url}#article`, headline: props.h1, inLanguage: en.value ? 'en-MY' : 'ms-MY', dateModified: `${props.modified}T00:00:00+08:00`, author: { '@id': `${site}/#org` }, publisher: { '@id': `${site}/#org` }, mainEntityOfPage: { '@id': `${url}#webpage` } }]
    : [],
});

const updated = computed(() => `${en.value ? 'Updated' : 'Dikemas kini'} ${longDate(props.modified, lang.value)}`);
const trail = computed(() => [{ name: en.value ? 'Home' : 'Laman utama', path: linkIn('/', lang.value) }, ...props.crumbs]);
onBeforeUnmount(() => document.documentElement.classList.remove('l-lock'));
</script>

<template>
  <div class="landing relative min-h-screen">
    <LNav :L="L" :other="other" :home="false" />
    <main>
      <header class="l-wrap pb-10 pt-28 md:pb-14 md:pt-36">
        <nav :aria-label="en ? 'Breadcrumb' : 'Laluan'" class="text-[14px] text-[#55524f]">
          <ol class="flex flex-wrap items-center gap-x-2 gap-y-1" role="list">
            <li v-for="(c, i) in trail" :key="c.path" class="flex items-center gap-2">
              <NuxtLink v-if="i < trail.length - 1" :to="c.path" class="underline decoration-[#1a1a1a]/20 underline-offset-2 hover:text-[#1a1a1a]">{{ c.name }}</NuxtLink>
              <span v-else aria-current="page" class="text-[#1a1a1a]">{{ c.name }}</span>
              <span v-if="i < trail.length - 1" aria-hidden="true">/</span>
            </li>
          </ol>
        </nav>
        <div class="mt-8 max-w-[880px]">
          <p v-if="kicker" class="text-[15px] font-semibold text-[#27622a]">{{ kicker }}</p>
          <h1 class="l-display mt-3 text-[clamp(40px,5.6vw,84px)]">{{ h1 }}</h1>
          <p class="l-lead mt-6 !max-w-[64ch]">{{ lead }}</p>
          <p class="mt-5 text-[13px] text-[#69655f]">{{ updated }}</p>
        </div>
      </header>

      <div class="l-wrap">
        <div class="l-prose max-w-[760px]">
          <slot />
        </div>
      </div>

      <section v-if="faq?.length" class="l-wrap py-16 md:py-20">
        <div class="max-w-[760px]">
          <h2 class="l-h3">{{ en ? 'Common questions' : 'Soalan lazim' }}</h2>
          <div class="mt-6 divide-y divide-[#1a1a1a]/10 border-y border-[#1a1a1a]/10">
            <div v-for="f in faq" :key="f.q" class="py-5">
              <h3 class="text-[17px] font-semibold leading-[1.4] text-[#1a1a1a]">{{ f.q }}</h3>
              <p class="mt-2 text-[16px] leading-[1.6] text-[#55524f]">{{ f.a }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="l-wrap pb-20 md:pb-28">
        <div class="max-w-[760px] rounded-[28px] bg-[#e6f3e1] p-6 md:p-10">
          <h2 class="l-h3">{{ en ? 'See it working first' : 'Tengok dulu macam mana jalan' }}</h2>
          <p class="mt-3 text-[16px] leading-[1.6] text-[#1a1a1a]">
            <template v-if="preview">{{ en ? 'Indahnya isn\'t open to the public yet. The sample majlis below is fictional and shows every part: the kad, the gallery, RSVP, seating and wishes.' : 'Indahnya belum buka untuk umum. Majlis contoh di bawah ni rekaan, dan tunjuk semua bahagian: kad, galeri, RSVP, meja dan ucapan.' }}</template>
            <template v-else>{{ en ? 'The sample majlis is fictional and shows every part. When you are ready, the free plan has every feature for 50 uploads.' : 'Majlis contoh ni rekaan dan tunjuk semua bahagian. Bila dah sedia, pakej percuma ada semua ciri untuk 50 upload.' }}</template>
          </p>
          <div class="mt-6 flex flex-wrap gap-2">
            <NuxtLink :to="linkIn('/contoh', lang)" class="l-btn l-btn-ink">{{ L.sample }}<ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" /></NuxtLink>
            <a v-if="preview" href="https://wa.me/60139078719" target="_blank" rel="noopener" class="l-btn l-btn-line"><MessageCircle class="size-4" :stroke-width="2" aria-hidden="true" />{{ en ? 'WhatsApp us' : 'WhatsApp kami' }}</a>
            <NuxtLink v-else to="/app?new=1" class="l-btn l-btn-go">{{ L.cta }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>
    <LFinal :L="L" :other="other" :qr="demoQr" :lang="lang" />
  </div>
</template>
