<script setup lang="ts">
import { Menu, X, ArrowRight } from 'lucide-vue-next';
import { Logo } from '~/ui';
import type { LandingCopy } from '~/composables/useLanding';

/**
 * A floating pill. Clear over the hero, paper once the page moves, out of
 * the way while reading down, back the moment the reader scrolls up. Goes
 * dark with the page in the dewan. Phones get a sheet.
 *
 * On the landing the section links scroll (Lenis, via `go`); on any other
 * page (`home: false`, e.g. /tentang) they are links back to that section.
 */
const props = withDefaults(defineProps<{ L: LandingCopy; other: string; dim?: boolean; home?: boolean }>(), { dim: false, home: true });
const emit = defineEmits<{ go: [target: string] }>();

const solid = ref(false);
const hidden = ref(false);
const sheet = ref(false);
let last = 0;
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    solid.value = y > 24;
    hidden.value = y > 520 && y > last + 2 && !sheet.value;
    if (y < last - 2) hidden.value = false;
    last = y; ticking = false;
  });
}
onMounted(() => { addEventListener('scroll', onScroll, { passive: true }); onScroll(); });
onBeforeUnmount(() => removeEventListener('scroll', onScroll));

const route = useRoute();
const en = computed(() => props.L.nav.lang === 'BM'); // the switch names the other language
const links = computed(() => ([
  { id: '#cara', label: props.L.nav.how },
  { id: '#kad', label: props.L.nav.kad },
  { id: '#harga', label: props.L.nav.pricing },
  { id: '#soalan', label: props.L.nav.faq },
  { id: '', page: '/tentang', label: props.L.nav.about },
] as { id: string; page?: string; label: string }[]).map(l => ({
  ...l,
  to: { path: l.page ?? '/', hash: l.id || undefined, query: en.value ? { lang: 'en' } : undefined },
  scroll: !l.page && props.home, // a section of the page we are on
  here: !!l.page && route.path === l.page,
})));
function go(l: { id: string; scroll: boolean }, e: MouseEvent) {
  sheet.value = false;
  if (l.scroll) { e.preventDefault(); emit('go', l.id); }
}
watch(sheet, v => document.documentElement.classList.toggle('l-lock', v));
</script>

<template>
  <header class="nav fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4" :class="{ 'nav-hidden': hidden }">
    <div class="nav-pill mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-3 rounded-full pl-4 pr-2 md:pl-5" :class="{ 'is-solid': solid || sheet, 'is-dim': dim && !sheet }">
      <NuxtLink to="/" class="rounded-full" aria-label="Indahnya"><Logo :size="24" class="nav-logo" /></NuxtLink>
      <nav class="hidden items-center gap-0.5 lg:flex" aria-label="Utama">
        <NuxtLink v-for="l in links" :key="l.label" :to="l.to" class="nav-link" :class="l.here && 'is-here'" :aria-current="l.here ? 'page' : undefined" @click="go(l, $event)">{{ l.label }}</NuxtLink>
      </nav>
      <div class="flex items-center gap-1">
        <NuxtLink :to="other" class="nav-link !px-3" :aria-label="L.nav.lang === 'EN' ? 'English' : 'Bahasa Melayu'">{{ L.nav.lang }}</NuxtLink>
        <NuxtLink to="/masuk" class="nav-link max-sm:!hidden">{{ L.nav.login }}</NuxtLink>
        <NuxtLink to="/app?new=1" class="l-btn l-btn-go l-btn-sm ml-1 hidden sm:inline-flex">{{ L.cta }}</NuxtLink>
        <button type="button" class="nav-link !size-11 !p-0 lg:!hidden" :aria-expanded="sheet" :aria-label="sheet ? L.nav.close : L.nav.menu" @click="sheet = !sheet">
          <X v-if="sheet" class="size-5" :stroke-width="1.75" /><Menu v-else class="size-5" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <Transition name="sheet">
      <div v-if="sheet" class="sheet mx-auto mt-2 max-w-[1280px] rounded-[28px] p-3 lg:hidden">
        <NuxtLink v-for="l in links" :key="l.label" :to="l.to" class="flex h-14 items-center rounded-[16px] px-4 text-[20px] font-semibold tracking-[-0.02em] text-[#1a1a1a] active:bg-[#ebe8e5]" :aria-current="l.here ? 'page' : undefined" @click="go(l, $event)">{{ l.label }}</NuxtLink>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <NuxtLink to="/masuk" class="l-btn l-btn-line">{{ L.nav.login }}</NuxtLink>
          <NuxtLink to="/app?new=1" class="l-btn l-btn-go !px-4">{{ L.cta }}<ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" /></NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.nav { transition: transform .5s var(--l-ease); }
.nav-hidden { transform: translateY(-110%); }
.nav-pill { transition: background-color .35s, box-shadow .35s, color .35s; color: #1a1a1a; }
.nav-pill.is-solid { background: rgb(253 252 251 / .82); backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4); box-shadow: 0 1px 0 rgb(26 26 26 / .05), 0 10px 30px -18px rgb(60 48 36 / .35), inset 0 0 0 1px rgb(255 255 255 / .6); }
.nav-pill.is-dim { background: rgb(24 28 25 / .72); color: #f3f1ee; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .08); }
.nav-pill.is-dim :deep(.logo) { color: #f3f1ee; }
.nav-link {
  display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 14px; border-radius: 999px;
  font-size: 15px; font-weight: 500; color: inherit; opacity: .8; transition: opacity .2s, background-color .2s;
}
/* our own flag, not [aria-current]: the router also marks the language switch current (same path, other ?lang) */
.nav-link:hover, .nav-link.is-here { opacity: 1; background: rgb(26 26 26 / .05); }
.is-dim .nav-link:hover { background: rgb(255 255 255 / .08); }
.sheet { background: rgb(253 252 251 / .96); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 20px 50px -24px rgb(60 48 36 / .5); }
.sheet-enter-active, .sheet-leave-active { transition: opacity .25s, transform .35s var(--l-ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(-8px) scale(.98); }
@supports not (backdrop-filter: blur(1px)) { .nav-pill.is-solid, .sheet { background: #fdfcfb; } }
</style>
