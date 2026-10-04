<script setup lang="ts">
import { Mic, Square, Play, RotateCcw, Search, Armchair, MessageSquareHeart } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { prefersReduced } from '~/composables/useLandingMotion';

/**
 * Before the day: RSVP, seating, wishes. Three cells, each doing its job
 * rather than describing it:
 *  - the RSVP replies arrive one by one and the totals count them (the
 *    sample event's own replies, the same people the seat search finds);
 *  - "cari nombor meja" asks the sample event's real endpoint, and its
 *    placeholder types the names you can try (Cosmos' search box);
 *  - the wishes are the sample's real ones, and the mic records the visitor
 *    in their own browser and plays it back. Nothing is uploaded.
 */
const props = defineProps<{ L: LandingCopy }>();
const root = ref<HTMLElement>();
const reduced = ref(false);

/* ── RSVP, arriving ── */
const REPLIES: [string, number, 0 | 1 | 2][] = [
  ['Makcik Ros', 3, 1], ['Uncle Lim Wei Ming', 2, 2], ['Pak Long Hamid', 2, 0], ['Kak Yati', 4, 1], ['Dr. Priya Raman', 2, 2],
  ['Cikgu Rahman', 2, 0], ['Nadia & Irfan', 2, 2], ['Team Office Petronas', 6, 2], ['Mak Uda Zaiton', 2, 1], ['Abang Faiz', 2, 0],
];
const shown = ref(0);
const replies = computed(() => REPLIES.slice(0, shown.value).reverse().slice(0, 4));
const pax = computed(() => REPLIES.slice(0, shown.value).reduce((a, r) => a + r[1], 0));
const sides = computed(() => [0, 1, 2].map(s => REPLIES.slice(0, shown.value).filter(r => r[2] === s).reduce((a, r) => a + r[1], 0)));
let rsvpTimer: ReturnType<typeof setInterval> | undefined;

/* ── seat search: the sample event, for real ── */
const q = ref('');
const result = ref<{ name: string; table: string }[] | null>(null);
const searching = ref(false);
const found = computed(() => result.value?.[0]?.table ?? null);
/*
 * The dewan, drawn as a guest would walk it: the pelamin at the top, the
 * couple's table in front of it, round tables of eight down both sides of
 * the bridal walk, the entrance at the bottom. A found table lights up and a
 * path walks from the entrance to it, which is what the feature is for.
 */
const DOOR = { x: 170, y: 322 };
const ROUND = [[80, 126], [260, 126], [80, 200], [260, 200], [80, 274], [260, 274]] as const;
const CHAIRS = Array.from({ length: 8 }, (_, k) => [Math.cos((k + 0.5) * Math.PI / 4) * 26, Math.sin((k + 0.5) * Math.PI / 4) * 26] as const);
const floor = ROUND.map(([x, y], i) => ({ name: `Meja ${i + 1}`, x, y }));
const route = computed(() => {
  const f = found.value;
  if (!f) return '';
  if (f === 'Meja Pengantin') return `M${DOOR.x} ${DOOR.y} V92`;
  const t = floor.find(t => t.name === f);
  if (!t) return '';
  // up the walk to the table's row, then across to its nearest chair
  return `M${DOOR.x} ${DOOR.y} V${t.y} H${t.x < DOOR.x ? t.x + 35 : t.x - 35}`;
});
let st: ReturnType<typeof setTimeout> | undefined;
watch(q, (v) => {
  clearTimeout(st);
  if (v.trim().length < 3) { result.value = null; return; }
  st = setTimeout(async () => {
    searching.value = true;
    try { result.value = (await $fetch<{ items: { name: string; table: string }[] }>('/api/g/aina-hakim/tempat', { query: { q: v.trim() } })).items; }
    catch { result.value = []; }
    finally { searching.value = false; }
  }, 220);
});
const tableLabel = (t: string) => (props.L.nav.lang === 'BM' ? t.replace('Meja Pengantin', 'Bride & groom').replace('Meja', 'Table') : t);
/* the typing placeholder */
const TRY = ['Ros', 'Lim', 'Priya', 'Faiz'];
const ph = ref('');
let phTimer: ReturnType<typeof setTimeout> | undefined;
function typePh(i = 0, c = 0, back = false) {
  const w = TRY[i % TRY.length]!;
  ph.value = w.slice(0, c);
  if (!back && c < w.length) phTimer = setTimeout(() => typePh(i, c + 1), 120);
  else if (!back) { if (!q.value) void ghost(w); phTimer = setTimeout(() => typePh(i, c, true), 2200); }
  else if (c > 0) phTimer = setTimeout(() => typePh(i, c - 1, true), 60);
  else phTimer = setTimeout(() => typePh(i + 1, 0), 300);
}
function tryName(n: string) { q.value = n; }
/** While the visitor has not typed, each name the placeholder types is looked up for real. */
const isGhost = ref(false);
async function ghost(w: string) {
  try {
    const r = await $fetch<{ items: { name: string; table: string }[] }>('/api/g/aina-hakim/tempat', { query: { q: w } });
    if (!q.value) { result.value = r.items; isGhost.value = true; }
  } catch { /* the demo carries on */ }
}
watch(q, (v) => { if (v) isGhost.value = false; else if (isGhost.value) result.value = null; });

/* ── wishes: the sample's own, and a voice the visitor records here ── */
const wishes = ref<{ id: string; name: string; body: string }[]>([]);
const rec = reactive({ state: 'idle' as 'idle' | 'rec' | 'ready' | 'play' | 'denied', secs: 0, url: '' });
const bars = ref<number[]>(Array.from({ length: 36 }, () => 0.12));
let media: MediaRecorder | undefined;
let stream: MediaStream | undefined;
let audioCtx: AudioContext | undefined;
let raf = 0;
let recTimer: ReturnType<typeof setInterval> | undefined;
let player: HTMLAudioElement | undefined;
async function record() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch { rec.state = 'denied'; return; }
  const chunks: Blob[] = [];
  media = new MediaRecorder(stream);
  media.ondataavailable = e => chunks.push(e.data);
  media.onstop = () => {
    if (rec.url) URL.revokeObjectURL(rec.url);
    rec.url = URL.createObjectURL(new Blob(chunks, { type: media?.mimeType || 'audio/webm' }));
    rec.state = 'ready';
    stream?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(raf); void audioCtx?.close(); audioCtx = undefined;
  };
  audioCtx = new AudioContext();
  const an = audioCtx.createAnalyser(); an.fftSize = 128;
  audioCtx.createMediaStreamSource(stream).connect(an);
  const data = new Uint8Array(an.frequencyBinCount);
  const loop = () => {
    an.getByteFrequencyData(data);
    const level = data.slice(2, 40).reduce((a, b) => a + b, 0) / (38 * 255);
    bars.value = [...bars.value.slice(1), Math.max(0.1, Math.min(1, level * 2.4))];
    raf = requestAnimationFrame(loop);
  };
  loop();
  media.start();
  rec.state = 'rec'; rec.secs = 0;
  recTimer = setInterval(() => { rec.secs++; if (rec.secs >= 15) stop(); }, 1000);
}
function stop() { clearInterval(recTimer); if (media?.state === 'recording') media.stop(); }
function play() {
  if (!rec.url) return;
  player?.pause();
  player = new Audio(rec.url);
  rec.state = 'play';
  player.onended = () => { rec.state = 'ready'; };
  void player.play();
}

let io: IntersectionObserver | undefined;
onMounted(async () => {
  reduced.value = prefersReduced();
  $fetch<{ items: { id: string; name: string; kind: string; body: string | null }[] }>('/api/g/aina-hakim/ucapan')
    .then(r => { wishes.value = r.items.filter(i => i.kind === 'text' && i.body).map(i => ({ id: i.id, name: i.name, body: i.body! })); })
    .catch(() => {});
  if (reduced.value) { shown.value = REPLIES.length; ph.value = TRY[0]!; return; }
  io = new IntersectionObserver(([e]) => {
    if (!e?.isIntersecting) return;
    io?.disconnect();
    rsvpTimer = setInterval(() => { if (shown.value < REPLIES.length) shown.value++; else clearInterval(rsvpTimer); }, 650);
    typePh();
  }, { threshold: 0.3 });
  if (root.value) io.observe(root.value);
});
onBeforeUnmount(() => {
  io?.disconnect(); clearInterval(rsvpTimer); clearTimeout(phTimer); clearTimeout(st); clearInterval(recTimer);
  cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); void audioCtx?.close(); player?.pause();
  if (rec.url) URL.revokeObjectURL(rec.url);
});
const sideColour = ['#27622a', '#7dd56f', '#cdeec5'];
</script>

<template>
  <section ref="root" class="l-wrap py-20 md:py-28">
    <h2 class="l-h2 max-w-[16ch]">{{ L.guests.title }}</h2>

    <div class="mt-12 grid grid-cols-1 gap-4 md:mt-16 lg:grid-cols-12">
      <!-- RSVP -->
      <div class="cell flex flex-col overflow-hidden rounded-[28px] bg-[#e6f3e1] p-6 md:p-8 lg:col-span-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="l-h3">{{ L.guests.rsvp.title }}</h3>
            <p class="l-body mt-2 max-w-[34ch]">{{ L.guests.rsvp.body }}</p>
          </div>
          <MessageSquareHeart class="size-6 shrink-0 text-[#27622a]" :stroke-width="1.75" aria-hidden="true" />
        </div>
        <div class="mt-8 flex items-end gap-6">
          <p><span class="block text-[13px] font-semibold text-[#27622a]">{{ L.guests.rsvp.coming }}</span><span class="l-display block text-[72px] tabular-nums">{{ shown }}</span></p>
          <p class="pb-2"><span class="l-display block text-[34px] tabular-nums text-[#27622a]">{{ pax }}</span><span class="block text-[13px] font-semibold text-[#27622a]">{{ L.guests.rsvp.pax }}</span></p>
        </div>
        <div class="mt-4 flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden="true">
          <span v-for="(n, i) in sides" :key="i" class="h-full rounded-full transition-[flex-grow] duration-700" :style="{ flexGrow: n || 0.0001, background: sideColour[i] }" />
        </div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#55524f]">
          <span v-for="(s, i) in L.guests.rsvp.sides" :key="s" class="inline-flex items-center gap-1.5"><span class="size-2.5 rounded-full" :style="{ background: sideColour[i] }" />{{ s }} <span class="tabular-nums font-semibold text-[#1a1a1a]">{{ sides[i] }}</span></span>
        </div>
        <TransitionGroup tag="ul" name="reply" class="mt-6 space-y-2" role="list">
          <li v-for="r in replies" :key="r[0]" class="flex items-center justify-between gap-3 rounded-[14px] bg-white/80 px-4 py-3 text-[14px]">
            <span class="truncate font-semibold">{{ r[0] }}</span><span class="shrink-0 tabular-nums text-[#55524f]">{{ r[1] }} {{ L.guests.rsvp.pax }}</span>
          </li>
        </TransitionGroup>
        <p class="mt-auto pt-6 text-[13px] text-[#55524f]">{{ L.guests.rsvp.sample }}</p>
      </div>

      <!-- seat search -->
      <div class="cell overflow-hidden rounded-[28px] bg-[#fdfcfb] p-6 shadow-[0_1px_0_rgba(26,26,26,.04),0_24px_60px_-40px_rgba(60,48,36,.3)] md:p-8 lg:col-span-7">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="l-h3">{{ L.guests.seat.title }}</h3>
            <p class="l-body mt-2">
              {{ L.guests.seat.body }}
              <button v-for="n in TRY" :key="n" type="button" class="ml-1 rounded-full bg-[#ebe8e5] px-2.5 py-0.5 text-[14px] font-semibold text-[#1a1a1a] transition hover:bg-[#dedad6]" @click="tryName(n)">{{ n }}</button>
            </p>
          </div>
          <Armchair class="size-6 shrink-0 text-[#27622a]" :stroke-width="1.75" aria-hidden="true" />
        </div>
        <label class="relative mt-6 block">
          <span class="sr-only">{{ L.guests.seat.title }}</span>
          <Search class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#75716d]" :stroke-width="2" aria-hidden="true" />
          <input v-model="q" type="search" maxlength="40" autocomplete="off" :placeholder="ph ? ph : L.guests.seat.placeholder" class="h-14 w-full rounded-full border border-[#d9d5d1] bg-white pl-12 pr-5 text-[17px] outline-none transition placeholder:text-[#75716d] focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,.1)]">
        </label>

        <div class="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div aria-live="polite" class="min-h-[88px] transition-opacity" :class="isGhost && 'opacity-60'">
            <template v-if="result && result.length">
              <p v-for="r in result.slice(0, 1)" :key="r.name" class="seat-hit">
                <span class="block text-[15px] text-[#55524f]">{{ r.name }}</span>
                <span class="l-display block text-[44px] text-[#1a1a1a]">{{ r.table === 'Meja Pengantin' ? L.guests.seat.head : tableLabel(r.table) }}</span>
              </p>
              <p class="seat-hit mt-3 inline-flex items-center gap-2 text-[14px] text-[#27622a]"><span class="size-2 rounded-full bg-[#7dd56f]" />{{ L.guests.seat.walk }}</p>
            </template>
            <p v-else-if="result" class="text-[15px] text-[#55524f]">{{ L.guests.seat.none }}</p>
            <p v-else class="text-[15px] text-[#75716d]">{{ q.trim().length ? L.guests.seat.short : '' }}</p>
          </div>
          <!-- the dewan floor, the found table lit and the walk to it drawn -->
          <svg viewBox="0 0 340 346" class="dewan w-full max-w-[330px] justify-self-center sm:w-[300px] sm:justify-self-end lg:w-[330px]" role="img" :aria-label="found ? tableLabel(found) : L.guests.seat.title">
            <path class="wall" d="M150 324 H22 a16 16 0 0 1 -16 -16 V22 a16 16 0 0 1 16 -16 H318 a16 16 0 0 1 16 16 V308 a16 16 0 0 1 -16 16 H190" />
            <rect class="walkway" x="158" y="52" width="24" height="272" rx="2" />
            <!-- pelamin -->
            <path class="pelamin" d="M112 46 V26 Q112 14 124 14 H216 Q228 14 228 26 V46 Z" />
            <text x="170" y="34" class="lbl lbl-on">{{ L.guests.seat.stage }}</text>
            <!-- the couple's table -->
            <g class="tbl" :class="found === 'Meja Pengantin' && 'is-found'">
              <circle class="chair" cx="160" cy="57" r="4.5" /><circle class="chair" cx="180" cy="57" r="4.5" />
              <rect class="top" x="138" y="63" width="64" height="16" rx="5" />
              <path class="heart" d="M170 75 l-3.6 -3.4 a2.2 2.2 0 1 1 3.6 -2.6 a2.2 2.2 0 1 1 3.6 2.6 Z" />
            </g>
            <!-- round tables of eight -->
            <g v-for="t in floor" :key="t.name" class="tbl" :class="found === t.name && 'is-found'">
              <circle v-for="(c, k) in CHAIRS" :key="k" class="chair" :cx="t.x + c[0]" :cy="t.y + c[1]" r="4" />
              <circle class="top" :cx="t.x" :cy="t.y" r="17.5" />
              <text :x="t.x" :y="t.y + 4.5" class="num">{{ t.name.replace('Meja ', '') }}</text>
            </g>
            <!-- the walk from the door -->
            <path v-if="route" :key="route" class="route" :d="route" />
            <circle v-if="route" :key="`you-${route}`" class="you" :cx="DOOR.x" :cy="DOOR.y" r="6" />
            <text x="170" y="341" class="lbl">{{ L.guests.seat.door }}</text>
          </svg>
        </div>
      </div>

      <!-- wishes -->
      <div class="cell overflow-hidden rounded-[28px] bg-[#1a1a1a] text-[#f3f1ee] lg:col-span-12">
        <div class="grid grid-cols-1 lg:grid-cols-12">
          <div class="p-6 md:p-8 lg:col-span-5">
            <h3 class="l-h3">{{ L.guests.wish.title }}</h3>
            <p class="mt-2 text-[15px] leading-[1.55] text-[#b9b6b1]">{{ L.guests.wish.body }}</p>
            <div class="mt-6 flex items-center gap-4 rounded-[20px] bg-white/[.06] p-3 pr-4">
              <button v-if="rec.state === 'rec'" type="button" class="grid size-12 shrink-0 place-items-center rounded-full bg-[#d92d20] text-white" :aria-label="L.guests.wish.stop" @click="stop"><Square class="size-4 fill-current" :stroke-width="2" /></button>
              <button v-else-if="rec.state === 'ready' || rec.state === 'play'" type="button" class="grid size-12 shrink-0 place-items-center rounded-full bg-[#7dd56f] text-[#1a1a1a]" :aria-label="L.guests.wish.play" @click="play"><Play class="ml-0.5 size-5 fill-current" :stroke-width="2" /></button>
              <button v-else type="button" class="grid size-12 shrink-0 place-items-center rounded-full bg-[#7dd56f] text-[#1a1a1a]" :aria-label="L.guests.wish.record" @click="record"><Mic class="size-5" :stroke-width="2" /></button>
              <div class="flex h-10 min-w-0 flex-1 items-center gap-[3px]" aria-hidden="true">
                <span v-for="(b, i) in bars" :key="i" class="w-[3px] flex-1 rounded-full transition-[height] duration-100" :class="rec.state === 'rec' ? 'bg-[#7dd56f]' : 'bg-white/30'" :style="{ height: `${Math.round(b * 100)}%` }" />
              </div>
              <span class="w-10 shrink-0 text-right text-[13px] tabular-nums text-[#b9b6b1]">0:{{ String(rec.secs).padStart(2, '0') }}</span>
              <button v-if="rec.state === 'ready'" type="button" class="grid size-9 shrink-0 place-items-center rounded-full bg-white/10" :aria-label="L.guests.wish.again" @click="record"><RotateCcw class="size-4" :stroke-width="2" /></button>
            </div>
            <p class="mt-3 text-[13px] text-[#b9b6b1]">{{ rec.state === 'denied' ? L.guests.wish.denied : rec.state === 'idle' ? L.guests.wish.record + '. ' + L.guests.wish.note : L.guests.wish.note }}</p>
          </div>
          <!-- the one marquee on the page: the wishes, drifting -->
          <div class="wish-rail relative flex items-center overflow-hidden py-6 lg:col-span-7 lg:py-8">
            <div v-if="wishes.length" class="wish-track flex w-max gap-3 pl-3">
              <figure v-for="(w, i) in [...wishes, ...wishes]" :key="`${w.id}-${i}`" class="w-[300px] shrink-0 rounded-[20px] bg-[#fdfcfb] p-5 text-[#1a1a1a]" :aria-hidden="i >= wishes.length">
                <blockquote class="line-clamp-3 text-[16px] leading-[1.5]">{{ w.body }}</blockquote>
                <figcaption class="mt-3 text-[13px] font-semibold text-[#27622a]">{{ w.name }}</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reply-enter-active { transition: opacity .4s, transform .5s var(--l-ease); }
.reply-enter-from { opacity: 0; transform: translateY(-10px); }
.reply-leave-active { display: none; }
.reply-move { transition: transform .5s var(--l-ease); }
.dewan { overflow: visible; }
.dewan .wall { fill: #f6f4f1; stroke: #d9d5d1; stroke-width: 1.5; }
.dewan .walkway { fill: #ebe8e5; opacity: .7; }
.dewan .pelamin { fill: #e6f3e1; stroke: #bfdcb5; stroke-width: 1; }
.dewan .lbl { font: 600 9px Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; fill: #75716d; text-anchor: middle; }
.dewan .lbl-on { fill: #27622a; }
.dewan .num { font: 600 11px Inter, sans-serif; fill: #55524f; text-anchor: middle; transition: fill .4s; }
.dewan .chair { fill: #d9d5d1; transition: fill .4s; }
.dewan .top { fill: #fdfcfb; stroke: #d9d5d1; stroke-width: 1.2; transition: fill .4s, stroke .4s; }
.dewan .heart { fill: #b9b6b1; transition: fill .4s; }
.dewan .tbl.is-found .top { fill: #7dd56f; stroke: #3d8f39; }
.dewan .tbl.is-found .chair { fill: #3d8f39; }
.dewan .tbl.is-found .num, .dewan .tbl.is-found .heart { fill: #1a1a1a; }
.dewan .route { fill: none; stroke: #27622a; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 2 6; }
.dewan .you { fill: #27622a; stroke: #fdfcfb; stroke-width: 2.5; }
@media (prefers-reduced-motion: no-preference) {
  .dewan .route { animation: walk-in .5s var(--l-ease) backwards, march 1s linear infinite; }
  .dewan .you { animation: walk-in .4s var(--l-ease) backwards; }
  .dewan .tbl.is-found .top { animation: lit .6s var(--l-ease) backwards; }
  @keyframes walk-in { from { opacity: 0; } }
  @keyframes march { to { stroke-dashoffset: -8; } }
  @keyframes lit { from { fill: #fdfcfb; } }
}
.seat-hit { animation: hit .5s var(--l-ease) backwards; }
@keyframes hit { from { opacity: 0; transform: translateY(8px); } }
.wish-rail { mask-image: linear-gradient(90deg, transparent, #000 16%, #000 90%, transparent); }
@media (prefers-reduced-motion: no-preference) {
  .wish-track { animation: drift 48s linear infinite; }
  .wish-rail:hover .wish-track { animation-play-state: paused; }
}
@keyframes drift { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .wish-rail { overflow-x: auto; } }
</style>
