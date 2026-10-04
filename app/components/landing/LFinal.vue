<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { photo } from '~/composables/useLanding';
import { prefersReduced } from '~/composables/useLandingMotion';

/**
 * The last door (Cosmos' close): the guests' photos and a few QR cards
 * drift at different depths around one big button, then the name, cropped
 * by the bottom of the page, filled with the day's photos.
 */
const props = defineProps<{ L: LandingCopy; other: string; qr: string; lang: 'ms' | 'en' }>();
const ITEMS = [
  { id: 'g04', x: 6, y: 10, w: 150, r: -8, d: 0.6 }, { id: 'g21', x: 18, y: 58, w: 120, r: 6, d: 1.1 }, { id: 'qr', x: 4, y: 72, w: 110, r: 9, d: 0.8 },
  { id: 'g11', x: 30, y: 4, w: 130, r: 5, d: 1.3 }, { id: 'g02', x: 72, y: 6, w: 140, r: -6, d: 0.7 }, { id: 'qr', x: 86, y: 18, w: 104, r: -10, d: 1.2 },
  { id: 'g14', x: 79, y: 52, w: 150, r: 7, d: 0.9 }, { id: 'g18', x: 64, y: 70, w: 130, r: -5, d: 1.4 }, { id: 'g15', x: 92, y: 66, w: 110, r: 4, d: 0.5 },
  { id: 'g09', x: 26, y: 72, w: 110, r: -9, d: 1 },
];
const field = ref<HTMLElement>();
let onMove: ((e: PointerEvent) => void) | undefined;
onMounted(() => {
  if (prefersReduced() || !matchMedia('(pointer: fine)').matches || !field.value) return;
  const els = [...field.value.querySelectorAll<HTMLElement>('[data-d]')];
  let raf = 0, mx = 0, my = 0;
  onMove = (e) => {
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; for (const el of els) { const d = Number(el.dataset.d); el.style.translate = `${-mx * 40 * d}px ${-my * 30 * d}px`; } });
  };
  addEventListener('pointermove', onMove, { passive: true });
});
onBeforeUnmount(() => { if (onMove) removeEventListener('pointermove', onMove); });
</script>

<template>
  <section class="relative overflow-hidden pt-10">
    <div ref="field" class="relative mx-auto flex min-h-[86vh] max-w-[1600px] items-center justify-center px-4">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div v-for="(it, i) in ITEMS" :key="i" class="drift absolute" :class="i % 3 === 2 && 'hidden md:block'" :data-d="it.d" :style="{ left: `${it.x}%`, top: `${it.y}%`, width: `clamp(64px, ${it.w / 14.4}vw, ${it.w}px)`, '--r': `${it.r}deg`, '--i': i }">
          <div v-if="it.id === 'qr'" class="drift-in rounded-[10px] bg-[#fdfcfb] p-[10%] shadow-[0_20px_40px_-20px_rgba(60,48,36,.45)]"><img v-if="qr" :src="qr" alt="" class="w-full" /></div>
          <img v-else :src="photo(it.id)" alt="" class="drift-in w-full rounded-[10px] shadow-[0_20px_40px_-20px_rgba(60,48,36,.45)]" loading="lazy" />
        </div>
      </div>
      <div class="relative max-w-[760px] text-center">
        <h2 class="l-display text-[clamp(44px,6.6vw,104px)]">{{ L.final.title }}</h2>
        <p class="l-lead mx-auto mt-6">{{ L.final.body }}</p>
        <NuxtLink to="/app?new=1" class="l-btn l-btn-go mt-10 !h-16 !px-9 !text-[18px]">{{ L.cta }}<ArrowRight class="size-5" :stroke-width="2" aria-hidden="true" /></NuxtLink>
      </div>
    </div>

    <footer class="l-wrap relative">
      <div class="flex flex-col gap-6 border-t border-[#1a1a1a]/10 pt-8 md:flex-row md:items-center md:justify-between">
        <p class="text-[15px] text-[#55524f]">{{ L.footer.tagline }}</p>
        <nav class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-[#55524f]" aria-label="Footer">
          <NuxtLink :to="lang === 'en' ? '/privasi?lang=en' : '/privasi'" class="hover:text-[#1a1a1a]">{{ L.footer.links.privacy }}</NuxtLink>
          <NuxtLink :to="lang === 'en' ? '/terma?lang=en' : '/terma'" class="hover:text-[#1a1a1a]">{{ L.footer.links.terms }}</NuxtLink>
          <a href="https://wa.me/60139078719" target="_blank" rel="noopener" class="hover:text-[#1a1a1a]">{{ L.footer.links.contact }}</a>
          <NuxtLink :to="other" class="hover:text-[#1a1a1a]">{{ L.nav.lang === 'EN' ? 'English' : 'Bahasa Melayu' }}</NuxtLink>
          <span>{{ L.footer.by }} <a href="https://ffdev.studio" target="_blank" rel="noopener" class="font-semibold text-[#1a1a1a] hover:underline">FF Dev Studio</a></span>
        </nav>
      </div>
    </footer>
    <!-- the name, cropped by the page, filled with the day -->
    <p class="wordmark l-display select-none whitespace-nowrap text-center" aria-hidden="true">indahnya</p>
  </section>
</template>

<style scoped>
.drift-in { transform: rotate(var(--r)); }
@media (prefers-reduced-motion: no-preference) {
  .drift-in { animation: float 7s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -700ms); }
}
@keyframes float { to { transform: rotate(calc(var(--r) * -0.6)) translateY(-14px); } }
.drift { transition: translate .9s cubic-bezier(.16, 1, .3, 1); }
.wordmark {
  margin-top: 4vw; margin-bottom: -6.6vw; font-size: 25.5vw; line-height: .8; letter-spacing: -0.06em; font-weight: 700;
  color: transparent; background: url('/landing/g22.jpg') center 55% / cover, #1a1a1a; -webkit-background-clip: text; background-clip: text;
}
@media (prefers-reduced-motion: no-preference) {
  .wordmark { background-size: 115% auto; animation: pan 24s ease-in-out infinite alternate; }
}
@keyframes pan { from { background-position: 0% 30%; } to { background-position: 100% 60%; } }
</style>
