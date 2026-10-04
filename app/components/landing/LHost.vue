<script setup lang="ts">
import { Check, EyeOff, Download, FileArchive, Copy, MonitorPlay } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { PHOTOS, photo } from '~/composables/useLanding';
import { useLandingMotion, prefersReduced } from '~/composables/useLandingMotion';
import QrStand from '~/components/print/QrStand.vue';

/**
 * The host's side as a sticky stack: each card pins near the top and the
 * one before it sinks back as the next arrives. Each card plays its control
 * once it is the one on top: a photo approved and one hidden, the zip
 * filling, the TV link copied, the print cards fanning out.
 */
const props = defineProps<{ L: LandingCopy; qr: string; url: string }>();
const root = ref<HTMLElement>();
const cards = ref<HTMLElement[]>([]);
const on = ref<boolean[]>([false, false, false, false]);
const zip = ref(0);
let zipTimer: ReturnType<typeof setInterval> | undefined;
const files = Object.keys(PHOTOS).length;
const BG = ['#fdfcfb', '#e6f3e1', '#1b1f1c', '#ebe8e5'];

function play(i: number) {
  if (on.value[i]) return;
  on.value[i] = true;
  if (i === 1) { zip.value = 0; zipTimer = setInterval(() => { zip.value = Math.min(files, zip.value + 1); if (zip.value >= files) clearInterval(zipTimer); }, 110); }
}

let triggers: { kill: () => void }[] = [];
let io: IntersectionObserver | undefined;
onMounted(async () => {
  if (prefersReduced()) { on.value = [true, true, true, true]; zip.value = files; return; }
  io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) play(cards.value.indexOf(e.target as HTMLElement));
  }, { rootMargin: '-35% 0px -35% 0px' });
  cards.value.forEach(c => io!.observe(c));
  const { gsap } = await useLandingMotion().boot();
  const mm = gsap.matchMedia();
  // the stack only stacks where the cards are sticky (lg and up)
  mm.add('(min-width: 1024px)', () => {
    cards.value.forEach((card, i) => {
      const nextCard = cards.value[i + 1];
      if (!nextCard) return;
      // explicit from/to on transform and a shade's opacity: a filter tween from "none" has no
      // start value, and scrolling back to the start left the card nearly black
      const st = { trigger: nextCard, start: 'top bottom', end: 'top 20%', scrub: true };
      gsap.fromTo(card.firstElementChild!, { scale: 1 }, { scale: 0.93, ease: 'none', immediateRender: false, scrollTrigger: st });
      gsap.fromTo(card.querySelector('.stack-shade'), { opacity: 0 }, { opacity: 0.22, ease: 'none', immediateRender: false, scrollTrigger: st });
    });
  });
  triggers.push({ kill: () => mm.revert() });
});
onBeforeUnmount(() => { triggers.forEach(t => t.kill()); io?.disconnect(); clearInterval(zipTimer); });

const pending = ['g18', 'g03', 'g11'];
</script>

<template>
  <section ref="root" class="l-wrap py-20 md:py-28">
    <h2 class="l-h2 max-w-[14ch]">{{ L.host.title }}</h2>

    <div class="mt-12 md:mt-16">
      <div v-for="(c, i) in L.host.cards" :key="c.title" ref="cards" class="stack-slot sticky pb-6" :style="{ top: `calc(92px + ${i * 22}px)` }">
        <div class="relative origin-top overflow-hidden rounded-[28px] [will-change:transform] shadow-[0_1px_0_rgba(26,26,26,.04),0_30px_80px_-40px_rgba(60,48,36,.35)]" :style="{ background: BG[i], color: i === 2 ? '#f3f1ee' : '#1a1a1a' }">
          <div class="stack-shade pointer-events-none absolute inset-0 z-10 bg-[#0e110f] opacity-0" aria-hidden="true" />
          <div class="grid min-h-[min(560px,72vh)] grid-cols-1 items-center gap-8 p-6 md:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
            <div class="lg:col-span-5">
              <h3 class="l-display text-[clamp(30px,3.4vw,50px)] !leading-[1.02]">{{ c.title }}</h3>
              <p class="mt-4 max-w-[40ch] text-[17px] leading-[1.55]" :class="i === 2 ? 'text-[#b9b6b1]' : 'text-[#55524f]'">{{ c.body }}</p>
            </div>

            <div class="relative lg:col-span-7" :class="on[i] && 'is-on'">
              <!-- approval -->
              <div v-if="i === 0" class="grid grid-cols-3 gap-3">
                <div v-for="(id, k) in pending" :key="id" class="appr rounded-[18px] bg-[#f6f4f3] p-2" :class="['is-ok', 'is-hidden', ''][k]" :style="{ '--k': k }">
                  <div class="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-[#ebe8e5]"><img :src="photo(id)" alt="" class="appr-img size-full object-cover" loading="lazy" /></div>
                  <div class="mt-2 grid grid-cols-2 gap-1.5">
                    <span class="appr-yes inline-flex h-8 items-center justify-center gap-1 rounded-full bg-white text-[12px] font-semibold"><Check class="size-3.5" :stroke-width="2.5" />{{ L.host.approve }}</span>
                    <span class="appr-no inline-flex h-8 items-center justify-center gap-1 rounded-full bg-white text-[12px] font-semibold"><EyeOff class="size-3.5" :stroke-width="2" />{{ L.host.hide }}</span>
                  </div>
                </div>
              </div>

              <!-- the zip -->
              <div v-else-if="i === 1" class="mx-auto max-w-[520px]">
                <div class="relative h-[200px]">
                  <img v-for="(id, k) in ['g08', 'g04', 'g21', 'g11', 'g02', 'g14']" :key="id" :src="photo(id)" alt="" class="zip-fly absolute left-1/2 top-1/2 w-[120px] rounded-[10px] shadow-lg" loading="lazy" :style="{ '--k': k, '--x': `${(k - 2.5) * 70}px`, '--r': `${(k - 2.5) * 6}deg` }" />
                </div>
                <div class="relative rounded-[20px] bg-white p-4 shadow-[0_20px_40px_-24px_rgba(39,98,42,.4)]">
                  <div class="flex items-center gap-3">
                    <span class="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[#e6f3e1] text-[#27622a]"><FileArchive class="size-6" :stroke-width="1.75" /></span>
                    <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-semibold">{{ L.host.zip }}</span><span class="block text-[13px] tabular-nums text-[#55524f]">{{ zip }} {{ L.host.files }}</span></span>
                    <span class="grid size-10 place-items-center rounded-full bg-[#1a1a1a] text-white"><Download class="size-4" :stroke-width="2" /></span>
                  </div>
                  <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe8e5]"><div class="h-full rounded-full bg-[#3d8f39] transition-[width] duration-150" :style="{ width: `${(zip / files) * 100}%` }" /></div>
                </div>
              </div>

              <!-- the TV link -->
              <div v-else-if="i === 2" class="mx-auto max-w-[620px]">
                <div class="laptop overflow-hidden rounded-t-[16px] border-[10px] border-b-0 border-[#2a2e2b] bg-black">
                  <div class="relative aspect-video">
                    <img :src="photo('g22', 'l')" alt="" class="size-full object-cover" loading="lazy" />
                    <div class="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                      <span class="text-[12px] font-semibold text-white">Aina &amp; Hakim</span>
                      <img v-if="qr" :src="qr" alt="" class="size-10 rounded-[4px] bg-white p-1" />
                    </div>
                  </div>
                </div>
                <div class="mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-[12px] bg-[#3a3f3b]" />
                <div class="link-pill mx-auto mt-6 flex max-w-[420px] items-center gap-3 rounded-full bg-white/10 p-1.5 pl-4 ring-1 ring-white/10">
                  <MonitorPlay class="size-4 shrink-0 text-[#7dd56f]" :stroke-width="2" />
                  <span class="min-w-0 flex-1 truncate text-[14px] text-[#f3f1ee]">indahnya.my/tv/aina-hakim</span>
                  <span class="copy inline-flex h-9 items-center gap-1.5 rounded-full bg-[#7dd56f] px-4 text-[13px] font-semibold text-[#1a1a1a]"><Copy class="size-3.5" :stroke-width="2" />{{ L.host.tv }}</span>
                </div>
              </div>

              <!-- print, fanned: the real stands, in three kad templates -->
              <div v-else class="fan relative mx-auto h-[380px] max-w-[580px] md:h-[440px]">
                <div v-for="(t, k) in L.host.print" :key="t" class="fan-card absolute bottom-8 left-1/2" :style="{ '--k': k, width: ['40%', '44%', '50%'][k] }">
                  <QrStand
                    class="overflow-hidden rounded-[10px] shadow-[0_30px_50px_-28px_rgba(60,48,36,.55)]"
                    :url="url" link="indahnya.my/aina-hakim" :template="(['garden', 'emas', 'klasik'] as const)[k]" :format="k === 2 ? 'landscape' : 'portrait'"
                    :names="{ a: 'Aina', b: 'Hakim' }" title="Walimatulurus" date="15.08.2026" hashtag="#AinaHakim" :locale="L.nav.lang === 'EN' ? 'ms' : 'en'"
                  />
                  <span class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[13px] font-semibold text-[#55524f]">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.appr { transition: transform .6s var(--l-ease), box-shadow .4s, opacity .5s; }
.appr-img { transition: filter .6s, opacity .6s; }
.is-on .appr.is-ok { box-shadow: 0 0 0 2px #7dd56f; transition-delay: calc(.4s + var(--k) * .5s); }
.is-on .appr.is-ok .appr-yes { background: #7dd56f; transition: background-color .3s calc(.4s); }
.is-on .appr.is-hidden .appr-img { filter: grayscale(1) blur(3px); opacity: .45; transition-delay: 1s; }
.is-on .appr.is-hidden .appr-no { background: #1a1a1a; color: #fff; transition: background-color .3s 1s, color .3s 1s; }

.zip-fly { transform: translate(-50%, -50%) translateX(var(--x)) rotate(var(--r)); transition: transform .9s var(--l-ease), opacity .6s; transition-delay: calc(var(--k) * 90ms); }
.is-on .zip-fly { transform: translate(-50%, 40%) scale(.3); opacity: 0; transition-delay: calc(.3s + var(--k) * 130ms); }

.copy { transition: transform .2s var(--l-ease); }
.is-on .copy { animation: press .5s 1s var(--l-ease) backwards; }
@keyframes press { 40% { transform: scale(.92); } }

.fan-card { transform: translateX(-50%) rotate(0deg); transform-origin: 50% 100%; transition: transform 1s var(--l-ease); }
.fan-card:nth-child(2) { z-index: 1; }
.is-on .fan-card { transform: translateX(calc(-50% + (var(--k) - 1) * 66%)) rotate(calc((var(--k) - 1) * 8deg)); }
.fan-card:hover { z-index: 2; }
@media (prefers-reduced-motion: reduce) { .appr, .appr-img, .zip-fly, .fan-card { transition: none; } }
@media (max-width: 1023px) { .stack-slot { position: relative; top: 0 !important; } }
</style>
