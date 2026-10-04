<script setup lang="ts">
import { Camera, ImagePlus, Check, Loader2, Monitor } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { GUEST_NAMES, PHOTOS, photo } from '~/composables/useLanding';
import { useLandingMotion, prefersReduced } from '~/composables/useLandingMotion';
import { useUploader } from '~/composables/useUploader';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';

/**
 * The dewan. The lights go down (the page dims while this section holds the
 * screen), the TV grows out from between the two halves of the line
 * (Lusion's PLAY ▶ REEL, Apple's pinned stage), and the slideshow plays the
 * sample event with each guest's name, the way /tv does.
 *
 * The QR in the TV's corner is real: it opens /contoh/cuba on the visitor's
 * phone, joined to this browser (the sandbox, see server/utils/sandbox.ts).
 * Whatever they send goes through the real pipeline and cuts into the
 * slideshow here, named, with a burst. On a phone the same thing is a
 * button: pick a photo, watch it land.
 */
const props = defineProps<{ L: LandingCopy }>();
const emit = defineEmits<{ dim: [on: boolean] }>();

const wrap = ref<HTMLElement>();
const tvEl = ref<HTMLElement>();
const leftWord = ref<HTMLElement>();
const rightWord = ref<HTMLElement>();
const tryBar = ref<HTMLElement>();
const reduced = ref(false);
const phone = ref(false);

/* ── the slideshow ── */
interface Slide { key: string; src: string; name: string; fresh?: boolean }
const SAMPLE: Slide[] = ['g21', 'g08', 'g04', 'g11', 'g14', 'g02', 'g18', 'g09', 'g15', 'g01', 'g22', 'g20'].map((id, i) => ({ key: id, src: photo(id, 'l'), name: GUEST_NAMES[(i * 7) % GUEST_NAMES.length]! }));
const slides = ref<Slide[]>([SAMPLE[0]!]);
let next = 1;
const current = computed(() => slides.value[slides.value.length - 1]!);
const queue: Slide[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
const running = ref(false);
function show(s: Slide) {
  slides.value = [...slides.value.slice(-1), s];
  if (s.fresh) burst();
  clearTimeout(timer);
  timer = setTimeout(advance, s.fresh ? 8000 : 4200);
}
function advance() {
  if (!running.value) return;
  show(queue.shift() ?? SAMPLE[next++ % SAMPLE.length]!);
}

/* ── the try: a sandbox visitor, a QR for the phone, a feed of what landed ── */
const pairQr = ref('');
const session = ref<{ k: string; slug: string; expiresAt: string; name: string | null } | null>(null);
const failed = ref(false);
const seen = new Set<string>();
const landed = ref(0);
let poll: ReturnType<typeof setInterval> | undefined;
async function start() {
  if (session.value || failed.value) return;
  try {
    const s = await $fetch<{ k: string; slug: string; expiresAt: string; name: string | null }>('/api/cuba', { method: 'POST', body: {} });
    session.value = s;
    pairQr.value = qrArtDataUrl(`${location.origin}/contoh/cuba?k=${encodeURIComponent(s.k)}${props.L.nav.lang === 'BM' ? '&lang=en' : ''}`, { margin: 1.4 });
    // whatever this visitor already sent (a reload) is not news
    const r = await $fetch<{ items: { id: string }[] }>(`/api/g/${s.slug}/media`);
    r.items.forEach(i => seen.add(i.id));
    landed.value = r.items.length;
  } catch { failed.value = true; }
}
async function check() {
  if (!session.value || document.hidden) return;
  try {
    const r = await $fetch<{ items: { id: string; url: string; thumb: string | null; guestName: string | null }[] }>(`/api/g/${session.value.slug}/media`);
    const fresh = r.items.filter(i => !seen.has(i.id)).reverse();
    for (const i of fresh) {
      seen.add(i.id);
      queue.unshift({ key: i.id, src: i.url, name: i.guestName || props.L.live.you, fresh: true });
    }
    landed.value = r.items.length;
    if (fresh.length) advance();
  } catch { /* the next tick tries again */ }
}

/* the phone's own upload, same pipeline */
const up = useUploader(() => session.value?.slug ?? '_cuba');
const picker = ref<HTMLInputElement>();
const sending = computed(() => up.active.value);
const upError = computed(() => up.items.value.find(i => i.state === 'failed')?.error ?? null);
async function pick() { await start(); picker.value?.click(); }
function onPick(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files?.length) { up.clear(); up.add(Array.from(files).slice(0, 6)); }
  (e.target as HTMLInputElement).value = '';
}
watch(() => up.done.value, (n, o) => { if (n > o) void check(); });

/* ── the petals: the brand's bloom, thrown from the QR corner ── */
const burstRoot = ref<HTMLElement>();
function burst() {
  const root = burstRoot.value; if (!root || reduced.value) return;
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('span');
    el.className = 'petal';
    el.style.setProperty('--c', ['#7dd56f', '#fdfcfb', '#cdeec5', '#ffd60a'][i % 4]!);
    root.appendChild(el);
    const ang = Math.PI * (0.9 + Math.random() * 0.75), dist = 140 + Math.random() * 260;
    el.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist * 0.8}px) rotate(${(Math.random() - 0.5) * 540}deg) scale(1)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${Math.cos(ang) * dist * 1.1}px, ${Math.sin(ang) * dist * 0.8 + 90}px) rotate(${(Math.random() - 0.5) * 720}deg) scale(.9)`, opacity: 0 },
    ], { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => el.remove();
  }
}

/* ── wiring ── */
let triggers: { kill: () => void }[] = [];
let io: IntersectionObserver | undefined;
onMounted(async () => {
  reduced.value = prefersReduced();
  phone.value = matchMedia('(pointer: coarse)').matches && innerWidth < 900;
  // decoded ahead, so a slide change never decodes a 900px JPEG mid-scroll
  SAMPLE.forEach(s => { const im = new Image(); im.src = s.src; im.decode?.().catch(() => {}); });

  // the slideshow (and the polling) run only while the TV is on screen
  io = new IntersectionObserver(([e]) => {
    running.value = !!e?.isIntersecting;
    if (running.value) {
      void start();
      timer = setTimeout(advance, 2000);
      poll ??= setInterval(check, 2500);
    } else { clearTimeout(timer); clearInterval(poll); poll = undefined; }
  }, { rootMargin: '200px 0px' });
  if (tvEl.value) io.observe(tvEl.value);

  const { gsap, ST } = await useLandingMotion().boot();
  triggers.push(ST.create({ trigger: wrap.value!, start: 'top 22%', end: 'bottom 70%', onToggle: s => emit('dim', s.isActive) }));
  if (reduced.value) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: wrap.value!, start: 'top top', end: 'bottom bottom', scrub: true } });
    tl.fromTo(tvEl.value!, { scale: 0.3 }, { scale: 1, ease: 'power2.inOut', duration: 0.62 }, 0)
      .fromTo(leftWord.value!, { xPercent: 0, opacity: 1 }, { xPercent: -110, opacity: 0, ease: 'power1.in', duration: 0.3 }, 0)
      .fromTo(rightWord.value!, { xPercent: 0, opacity: 1 }, { xPercent: 110, opacity: 0, ease: 'power1.in', duration: 0.3 }, 0)
      .fromTo(tryBar.value!, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.18 }, 0.6)
      .to({}, { duration: 0.2 });
    triggers.push(tl.scrollTrigger!);
  });
  triggers.push({ kill: () => mm.revert() });
});
onBeforeUnmount(() => {
  triggers.forEach(t => t.kill()); io?.disconnect();
  clearTimeout(timer); clearInterval(poll);
});

const total = Object.keys(PHOTOS).length;
</script>

<template>
  <section id="live" ref="wrap" class="l-dw relative" :class="reduced ? '' : 'min-[900px]:h-[230vh]'">
    <div class="dewan-stage l-wrap flex flex-col justify-center py-20" :class="!reduced && 'min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-[100dvh] min-[900px]:py-0'">
      <!-- the line, split by the screen -->
      <h2 class="l-h2 relative z-10 text-center" :class="!reduced && 'min-[900px]:pointer-events-none min-[900px]:absolute min-[900px]:inset-x-0 min-[900px]:top-1/2 min-[900px]:flex min-[900px]:-translate-y-1/2 min-[900px]:justify-between min-[900px]:px-[3vw] min-[900px]:text-[clamp(48px,5.4vw,92px)]'">
        <span ref="leftWord" class="inline-block">{{ L.live.title.split('. ')[0] }}.</span>
        <span ref="rightWord" class="inline-block">{{ L.live.title.split('. ')[1] }}</span>
      </h2>
      <p class="l-lead l-dw2 mx-auto mt-4 text-center" :class="!reduced && 'min-[900px]:hidden'">{{ L.live.body }}</p>

      <!-- the screen -->
      <div class="relative mx-auto mt-10 w-full" :class="!reduced && 'min-[900px]:mt-0'" :style="{ maxWidth: 'min(1180px, calc((100dvh - 230px) * 16 / 9))' }">
        <div ref="tvEl" class="tv relative aspect-video w-full origin-center overflow-hidden rounded-[14px] bg-black">
          <TransitionGroup name="slide">
            <img v-for="s in slides" :key="s.key" :src="s.src" alt="" decoding="async" class="slide absolute inset-0 size-full object-cover" :class="s.fresh && 'object-contain bg-black'" />
          </TransitionGroup>
          <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-[2.4%] pt-[9%]">
            <div class="min-w-0">
              <Transition name="fade" mode="out-in">
                <p :key="current.key" class="flex items-center gap-2 text-[clamp(12px,1.4vw,18px)] font-semibold text-white">
                  <span v-if="current.fresh" class="rounded-full bg-[#7dd56f] px-2.5 py-0.5 text-[0.78em] font-bold text-[#1a1a1a]">{{ L.live.fresh }}</span>
                  <Camera class="size-[1.1em] opacity-80" :stroke-width="2" aria-hidden="true" />{{ L.live.by }} {{ current.name }}
                </p>
              </Transition>
              <p class="mt-1 text-[clamp(10px,1vw,14px)] text-white/70">Aina &amp; Hakim · <span class="tabular-nums">{{ total + landed }}</span> {{ L.live.photos }}</p>
            </div>
            <div v-if="!phone" class="flex shrink-0 items-end gap-3">
              <p class="hidden text-right text-[clamp(10px,1vw,14px)] font-semibold leading-tight text-white sm:block">{{ L.live.tvScan }}</p>
              <div class="relative w-[clamp(64px,9.5%,112px)] rounded-[8px] bg-white p-1.5">
                <img v-if="pairQr" :src="pairQr" :alt="L.live.tvScan" class="block w-full" />
                <div v-else class="aspect-square w-full animate-pulse rounded-[4px] bg-[#ebe8e5]" />
                <div ref="burstRoot" class="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true" />
              </div>
            </div>
            <div v-else ref="burstRoot" class="pointer-events-none absolute bottom-1/2 right-1/2" aria-hidden="true" />
          </div>
        </div>
      </div>

      <!-- the try -->
      <div ref="tryBar" class="mx-auto mt-6 flex w-full max-w-[1180px] flex-col items-start gap-4 md:flex-row md:items-center md:justify-between md:gap-10">
        <div class="max-w-[640px]">
          <p class="text-[18px] font-semibold">{{ L.live.tryTitle }}</p>
          <p class="l-dw2 mt-1 text-[15px] leading-[1.55]">{{ phone ? L.live.tryBodyPhone : L.live.tryBody }}</p>
          <p v-if="upError" class="mt-2 text-[14px] font-medium text-[#fda29b]" role="alert">{{ upError }}</p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-3">
          <button v-if="phone" type="button" class="l-btn l-btn-go" :disabled="sending" @click="pick">
            <Loader2 v-if="sending" class="size-[18px] animate-spin" :stroke-width="2" aria-hidden="true" />
            <Check v-else-if="up.done.value" class="size-[18px]" :stroke-width="2.5" aria-hidden="true" />
            <ImagePlus v-else class="size-[18px]" :stroke-width="2" aria-hidden="true" />
            {{ sending ? L.live.trySending : up.done.value ? L.live.tryMore : L.live.tryButton }}
          </button>
          <button v-else type="button" class="l-btn l-btn-ghost-night l-btn-sm" :disabled="sending" @click="pick">
            <Loader2 v-if="sending" class="size-4 animate-spin" :stroke-width="2" aria-hidden="true" /><Monitor v-else class="size-4" :stroke-width="2" aria-hidden="true" />
            {{ sending ? L.live.trySending : L.live.tryDesk }}
          </button>
          <input ref="picker" type="file" accept="image/*" multiple class="sr-only" tabindex="-1" aria-hidden="true" @change="onPick">
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tv { box-shadow: 0 0 0 1px rgb(255 255 255 / .08), 0 0 0 10px #161917, 0 0 0 11px rgb(255 255 255 / .06), 0 50px 90px -40px rgb(0 0 0 / .9); will-change: transform; }
.slide { animation: kb 9s ease-out both; }
@keyframes kb { from { transform: scale(1.06); } to { transform: scale(1); } }
.slide-enter-active { transition: opacity 1.1s ease; }
.slide-leave-active { transition: opacity 1.1s ease .2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity .4s, transform .5s var(--l-ease); }
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; }
:deep(.petal) {
  position: absolute; left: 0; top: 0; width: 14px; height: 14px; margin: -7px 0 0 -7px; pointer-events: none;
  background: radial-gradient(circle at 50% 18%, var(--c) 34%, transparent 35%), radial-gradient(circle at 50% 82%, var(--c) 34%, transparent 35%),
    radial-gradient(circle at 18% 50%, var(--c) 34%, transparent 35%), radial-gradient(circle at 82% 50%, var(--c) 34%, transparent 35%);
}
@media (prefers-reduced-motion: reduce) { .slide { animation: none; } }
</style>
