<script setup lang="ts">
import { Camera, Check, ImagePlus, Images } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { GUEST_NAMES, photo } from '~/composables/useLanding';
import { prefersReduced } from '~/composables/useLandingMotion';
import QrStand from '~/components/print/QrStand.vue';

/**
 * Three steps, told the way Granola tells a meeting: the step list holds
 * still on the left while the scenes pass on the right, and the active step
 * is the one whose scene is in the middle of the screen. Each scene is the
 * guest's own phone, in the product's own look, playing its step once it
 * arrives: the camera finds the QR, the photos go up, the gallery fills.
 *
 * Phones (and reduced motion) get the same scenes stacked, each under its
 * step, already played.
 */
const props = defineProps<{ L: LandingCopy; qr: string; url: string }>();
const active = ref(0);
const played = ref<boolean[]>([false, false, false]);
const scenes = ref<HTMLElement[]>([]);

/* the upload scene's counter, ticking while its scene is on screen */
const sent = ref(0);
const TOTAL = 12;
let tick: ReturnType<typeof setInterval> | undefined;
function playUpload() {
  clearInterval(tick);
  sent.value = 0;
  tick = setInterval(() => { sent.value++; if (sent.value >= TOTAL) clearInterval(tick); }, 260);
}

onMounted(() => {
  if (prefersReduced()) { played.value = [true, true, true]; sent.value = TOTAL; return; }
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      const i = scenes.value.indexOf(e.target as HTMLElement);
      if (i < 0) continue;
      active.value = i;
      if (!played.value[i]) { played.value[i] = true; if (i === 1) playUpload(); }
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  scenes.value.forEach(el => io.observe(el));
  onBeforeUnmount(() => { io.disconnect(); clearInterval(tick); });
});

const picks = ['g18', 'g11', 'g10', 'g04', 'g03', 'g15', 'g21', 'g02', 'g14'];
const galleryIds = ['g21', 'g04', 'g02', 'g11', 'g18', 'g09', 'g15', 'g01', 'g14', 'g07'];
</script>

<template>
  <section id="cara" class="l-wrap scroll-mt-24 py-20 md:py-28">
    <h2 class="l-h2 max-w-[14ch]">{{ L.how.title }}</h2>

    <div class="mt-12 grid grid-cols-1 gap-x-16 md:mt-20 lg:grid-cols-12">
      <!-- the list that holds still -->
      <ol class="hidden lg:col-span-5 lg:block" role="list">
        <li class="sticky top-[24vh]">
          <div v-for="(s, i) in L.how.steps" :key="s.title" class="step relative py-5 pl-8" :class="active === i && 'is-on'">
            <span class="step-rail absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-[#ebe8e5]" aria-hidden="true"><span class="step-fill block w-full rounded-full bg-[#1a1a1a]" /></span>
            <h3 class="l-h3 step-title text-[clamp(24px,2.3vw,34px)]">{{ s.title }}</h3>
            <div class="step-body grid">
              <p class="l-body overflow-hidden pt-2 text-[16px]">{{ s.body }}</p>
            </div>
          </div>
        </li>
      </ol>

      <!-- the scenes -->
      <div class="lg:col-span-7">
        <div
          v-for="(s, i) in L.how.steps" :key="s.title" ref="scenes"
          class="scene relative mb-16 last:mb-0 lg:mb-0 lg:flex lg:min-h-[96vh] lg:items-center lg:justify-center" :class="played[i] && 'is-played'"
        >
          <div class="lg:hidden">
            <h3 class="l-h3">{{ s.title }}</h3>
            <p class="l-body mt-2">{{ s.body }}</p>
          </div>

          <div class="stage relative mt-6 flex h-[min(78vh,640px)] w-full items-center justify-center overflow-hidden rounded-[28px] lg:mt-0 lg:h-[min(82vh,720px)]" :class="['bg-[#ebe8e5]', 'bg-[#e6f3e1]', 'bg-[#1b1f1c]'][i]">
            <!-- 1 · the QR on the table, through the phone's camera -->
            <template v-if="i === 0">
              <QrStand
                class="table-card absolute left-[7%] top-[12%] w-[36%] max-w-[240px] overflow-hidden rounded-[10px] shadow-[0_30px_60px_-30px_rgba(60,48,36,.5)] max-sm:!hidden"
                :url="url" link="indahnya.my/aina-hakim" template="garden" :names="{ a: 'Aina', b: 'Hakim' }" title="Walimatulurus" date="15.08.2026" hashtag="#AinaHakim" :locale="L.nav.lang === 'EN' ? 'ms' : 'en'"
              />
              <div class="l-phone relative z-10 aspect-[9/19] h-[88%] sm:ml-[30%]">
                <div class="l-phone-screen bg-[#0b0b0b]">
                  <img :src="photo('g10')" alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-[6px]" />
                  <QrStand
                    class="absolute left-1/2 top-[42%] w-[64%] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] overflow-hidden rounded-[6px]"
                    :url="url" link="indahnya.my/aina-hakim" template="garden" :names="{ a: 'Aina', b: 'Hakim' }" title="Walimatulurus" date="15.08.2026" :locale="L.nav.lang === 'EN' ? 'ms' : 'en'"
                  />
                  <div class="finder absolute left-1/2 top-[42%] aspect-[1/1.414] w-[74%]" aria-hidden="true"><i /><i /><i /><i /></div>
                  <div class="scan-pill absolute inset-x-[8%] top-[68%] flex items-center gap-2.5 rounded-[14px] bg-[#ffd60a] px-3 py-2.5 text-[#1a1a1a] shadow-lg">
                    <span class="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[#7dd56f]"><svg viewBox="0 0 32 32" class="size-4"><g fill="#1a1a1a"><circle cx="16" cy="9.5" r="4.2" /><circle cx="16" cy="22.5" r="4.2" /><circle cx="9.5" cy="16" r="4.2" /><circle cx="22.5" cy="16" r="4.2" /></g></svg></span>
                    <span class="min-w-0 flex-1"><span class="block text-[10px] font-semibold leading-3">Safari</span><span class="block truncate text-[12px] font-medium leading-4">{{ L.how.scan }}</span></span>
                    <span class="text-[12px] font-semibold">{{ L.how.open }}</span>
                  </div>
                  <div class="absolute inset-x-0 bottom-[5%] flex justify-center"><span class="size-[54px] rounded-full border-[3px] border-white/90 bg-white/20" /></div>
                </div>
                <span class="l-phone-island" />
              </div>
            </template>

            <!-- 2 · thirty at a time, straight from the camera roll -->
            <template v-else-if="i === 1">
              <div class="l-phone relative aspect-[9/19] h-[88%]">
                <div class="l-phone-screen px-[6%] pt-[17%]">
                  <p class="text-[15px] font-semibold leading-5 text-[#1a1a1a]">Aina &amp; Hakim</p>
                  <p class="text-[11px] leading-4 text-[#75716d]">{{ L.how.gallery }}</p>
                  <div class="mt-3 rounded-[14px] bg-white p-3 shadow-[0_1px_0_rgba(26,26,26,.05)]">
                    <div class="flex items-center justify-between text-[11px] font-medium text-[#1a1a1a]">
                      <span>{{ sent < TOTAL ? L.how.uploading : L.how.done }}</span>
                      <span class="tabular-nums text-[#55524f]">{{ sent }} {{ L.how.of }} {{ TOTAL }}</span>
                    </div>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe8e5]"><div class="h-full rounded-full bg-[#3d8f39] transition-[width] duration-300" :style="{ width: `${(sent / TOTAL) * 100}%` }" /></div>
                  </div>
                  <div class="mt-3 grid grid-cols-3 gap-1.5">
                    <div v-for="(id, k) in picks" :key="id" class="relative aspect-square overflow-hidden rounded-[8px] bg-[#ebe8e5]">
                      <img :src="photo(id)" alt="" class="size-full object-cover" loading="lazy" />
                      <span class="absolute inset-0 grid place-items-center transition-opacity duration-500" :class="sent > k ? 'opacity-0' : 'bg-black/35'">
                        <svg viewBox="0 0 36 36" class="size-7 -rotate-90" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" :stroke-dashoffset="sent > k ? 0 : sent === k ? 0.4 : 1" class="transition-[stroke-dashoffset] duration-300" /></svg>
                      </span>
                      <span v-if="sent > k" class="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-[#3d8f39] text-white"><Check class="size-2.5" :stroke-width="3" /></span>
                    </div>
                  </div>
                  <div class="absolute inset-x-[6%] bottom-[5%] flex h-11 items-center justify-center gap-2 rounded-full bg-[#1a1a1a] text-[13px] font-semibold text-white"><ImagePlus class="size-4" :stroke-width="2" />{{ L.how.upload }}</div>
                </div>
                <span class="l-phone-island" />
              </div>
            </template>

            <!-- 3 · in the gallery and on the screen -->
            <template v-else>
              <div class="tv absolute right-[5%] top-[10%] hidden aspect-video w-[54%] overflow-hidden rounded-[10px] bg-black shadow-[0_0_0_6px_#2a2e2b,0_40px_80px_-30px_rgba(0,0,0,.8)] sm:block">
                <img :src="photo('g21', 'l')" alt="" class="size-full object-cover" loading="lazy" />
                <div class="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-[3%] pt-[10%]">
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white"><Camera class="size-3" :stroke-width="2" />{{ GUEST_NAMES[4] }}</span>
                  <img v-if="qr" :src="qr" alt="" class="size-[14%] rounded-[3px] bg-white p-[1.5%]" />
                </div>
              </div>
              <div class="l-phone relative z-10 aspect-[9/19] h-[88%] sm:mr-[34%] sm:mt-[8%]">
                <div class="l-phone-screen px-[5%] pt-[17%]">
                  <p class="text-[15px] font-semibold leading-5 text-[#1a1a1a]">{{ L.how.gallery }}</p>
                  <div class="mt-2 inline-flex rounded-full bg-[#ebe8e5] p-0.5 text-[10px] font-medium"><span class="rounded-full bg-white px-2.5 py-1 text-[#1a1a1a]">{{ L.how.all }}</span><span class="px-2.5 py-1 text-[#55524f]">{{ L.how.mine }}</span></div>
                  <div class="mt-2.5 columns-2 gap-1.5">
                    <div v-for="(id, k) in galleryIds" :key="id" class="g-tile relative mb-1.5 overflow-hidden rounded-[8px] bg-[#ebe8e5]" :class="k === 0 && 'is-new'" :style="{ '--k': k }">
                      <img :src="photo(id)" alt="" class="block w-full" loading="lazy" />
                    </div>
                  </div>
                  <div class="toast absolute inset-x-[6%] bottom-[5%] flex h-11 items-center gap-2 rounded-full bg-[#1a1a1a] px-4 text-[12px] font-semibold text-white"><span class="grid size-5 place-items-center rounded-full bg-[#7dd56f] text-[#1a1a1a]"><Check class="size-3" :stroke-width="3" /></span>{{ L.how.done }}<Images class="ml-auto size-4 opacity-60" :stroke-width="2" /></div>
                </div>
                <span class="l-phone-island" />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-title { color: #a8a39e; transition: color .5s var(--l-ease); }
.step.is-on .step-title { color: #1a1a1a; }
.step-body { grid-template-rows: 0fr; transition: grid-template-rows .6s var(--l-ease); }
.step.is-on .step-body { grid-template-rows: 1fr; }
.step-fill { height: 0; transition: height .7s var(--l-ease); }
.step.is-on .step-fill { height: 100%; }

.finder { transform: translate(-50%, -50%) rotate(-4deg); }
.finder i { position: absolute; width: 22%; height: 22%; border: 3px solid #ffd60a; }
.finder i:nth-child(1) { left: 0; top: 0; border-right: 0; border-bottom: 0; border-top-left-radius: 10px; }
.finder i:nth-child(2) { right: 0; top: 0; border-left: 0; border-bottom: 0; border-top-right-radius: 10px; }
.finder i:nth-child(3) { left: 0; bottom: 0; border-right: 0; border-top: 0; border-bottom-left-radius: 10px; }
.finder i:nth-child(4) { right: 0; bottom: 0; border-left: 0; border-top: 0; border-bottom-right-radius: 10px; }

@media (prefers-reduced-motion: no-preference) {
  .finder { transition: transform .8s var(--l-ease), opacity .4s; transform: translate(-50%, -50%) rotate(-4deg) scale(1.3); opacity: 0; }
  .is-played .finder { transform: translate(-50%, -50%) rotate(-4deg) scale(1); opacity: 1; transition-delay: .2s; }
  .scan-pill { transition: transform .6s var(--l-ease), opacity .3s; transform: translateY(16px) scale(.96); opacity: 0; }
  .is-played .scan-pill { transform: none; opacity: 1; transition-delay: 1s; }
  .table-card { transition: transform 1s var(--l-ease); transform: rotate(-9deg) translateY(30px); }
  .is-played .table-card { transform: rotate(-6deg); }

  .g-tile { transition: opacity .5s, transform .6s var(--l-ease); }
  .scene:not(.is-played) .g-tile.is-new { opacity: 0; transform: scale(.85); }
  .is-played .g-tile.is-new { transition-delay: .7s; box-shadow: 0 0 0 2px #7dd56f; }
  .toast { transition: transform .6s var(--l-ease), opacity .3s; }
  .scene:not(.is-played) .toast { transform: translateY(20px); opacity: 0; }
  .is-played .toast { transition-delay: 1.3s; }
  .tv { transition: transform 1.1s var(--l-ease), opacity .6s; }
  .scene:not(.is-played) .tv { transform: translateY(24px) scale(.96); opacity: 0; }
}
</style>
