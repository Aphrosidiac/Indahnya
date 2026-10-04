<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { PHOTOS, GUEST_NAMES, photo } from '~/composables/useLanding';
import { useLandingMotion, prefersReduced } from '~/composables/useLandingMotion';

/**
 * The hero is the product's one idea, told as a single scroll: a real,
 * scannable QR on a table card, and the guests' photos it turns into. As the
 * page scrolls, each black module of the QR flies to a place inside one of
 * the gallery's tiles, takes on the colour of that spot of the photo (so the
 * wall first appears as a mosaic of the QR's own pixels), and then the real
 * photo resolves on top. Drawn on one canvas: ~400 rects and ~24 images a
 * frame, redrawn only when the scroll moves.
 *
 * Resting state (and the whole story under reduced motion) is the card.
 */
const props = defineProps<{ L: LandingCopy; qrUrl: string }>();
const emit = defineEmits<{ go: [target: string] }>();
/** "Satu QR." → the last word gets a hand-drawn ring (Hinge's circled word). */
const h1b = computed(() => {
  const m = /^(.*\s)(\S+?)([.!]?)$/.exec(props.L.hero.h1b);
  return m ? { lead: m[1], word: m[2], tail: m[3] } : { lead: '', word: props.L.hero.h1b, tail: '' };
});

const wrap = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const cv = ref<HTMLCanvasElement>();
const copy = ref<HTMLElement>();
const floatRoot = ref<HTMLElement>();
const caption = ref<HTMLElement>();
const reduced = ref(false);

/* ── the floating polaroids around the card: the photos that are coming ── */
const FLOAT = [
  { id: 'g04', dx: -1.12, dy: 0.42, w: 0.46, r: -8, d: 1.2 },
  { id: 'g08', dx: 0.98, dy: -0.66, w: 0.6, r: 6, d: 0.7 },
  { id: 'g21', dx: 1.14, dy: 0.42, w: 0.48, r: 9, d: 1.5 },
  { id: 'g11', dx: 0.3, dy: 1.02, w: 0.56, r: -4, d: 0.9 },
  { id: 'g02', dx: -0.86, dy: -0.9, w: 0.44, r: -6, d: 1.3 },
  { id: 'g20', dx: -0.62, dy: 1.04, w: 0.5, r: 5, d: 0.6 },
];
const floaters = FLOAT.map((f, i) => ({ ...f, name: GUEST_NAMES[(i * 5) % GUEST_NAMES.length]!, tall: PHOTOS[f.id]![1] > PHOTOS[f.id]![0] }));
const floatBox = ref({ cx: 0, cy: 0, cw: 0 });
/** Polaroids that would land on the words are left out at this size. */
const floatHidden = ref<boolean[]>(FLOAT.map(() => false));
function placeFloaters() {
  const r = cardRest();
  floatBox.value = { cx: r.cx, cy: r.cy, cw: r.cw };
  const top = stage.value?.getBoundingClientRect().top ?? 0;
  const words = [...(copy.value?.querySelectorAll('[data-words]') ?? [])].map(el => el.getBoundingClientRect());
  floatHidden.value = FLOAT.map((f) => {
    const w = f.w * r.cw, h = w * 1.25;
    const x = r.cx + f.dx * r.cw - w / 2, y = r.cy + f.dy * r.cw - h / 2;
    if (y < 84 || y > H - 40 || x + w * 0.6 > W) return true; // under the nav, or mostly off screen
    const pad = 20;
    return words.some(b => x < b.right + pad && x + w > b.left - pad && y < b.bottom - top + pad && y + h > b.top - top - pad);
  });
}

/* ── geometry ── */
interface Tile { x: number; y: number; w: number; h: number; id: string; img?: HTMLImageElement; px?: Uint8ClampedArray; cols: number; rows: number; delay: number }
interface Mod { u: number; v: number; tile: number; cell: number; delay: number }
let W = 0, H = 0, dpr = 1;
let qrSize = 0;
let qrData: Uint8Array | null = null;
let tiles: Tile[] = [];
let mods: Mod[] = [];
let p = 0;
let dirty = true;
let raf = 0;
const imgs = new Map<string, HTMLImageElement>();

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeO = (t: number) => 1 - (1 - t) ** 3;
/* a seeded random, so the layout is the same on every visit and every resize */
const rnd = (n: number) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

/** Where the card sits at rest, and how big. */
function cardRest() {
  const desk = W >= 900;
  const cw = desk ? clamp(W * 0.21, 250, 330) : Math.min(W * 0.58, 230);
  return { cw, ch: cw * 1.42, cx: desk ? W * 0.765 : W * 0.5, cy: desk ? H * 0.615 : H * 0.84, rot: desk ? -5 : -4 };
}
/** The card's state at progress a (0 rest → 1 centred, straight, its QR filling the screen). */
function cardAt(a: number) {
  const r = cardRest();
  const qs = r.cw * 0.7;
  const target = Math.min(W * (W >= 900 ? 0.42 : 0.86), H * 0.62);
  const k = lerp(1, target / qs, a);
  return { cx: lerp(r.cx, W / 2, a), cy: lerp(r.cy, H / 2, a), rot: lerp(r.rot, 0, a) * Math.PI / 180, k, cw: r.cw, ch: r.ch };
}

function buildWall() {
  const cols = W >= 1280 ? 6 : W >= 900 ? 5 : W >= 600 ? 4 : 3;
  const gap = W >= 900 ? 10 : 6;
  const tw = (W - gap * (cols + 1)) / cols;
  const order = ['g08', 'g04', 'g18', 'g11', 'g21', 'g15', 'g09', 'g02', 'g01', 'g20', 'g17', 'g03', 'g14', 'g22', 'g10', 'g07'];
  const out: Tile[] = [];
  let n = 0;
  const near = (c: number, y0: number, y1: number) => out.filter(t => Math.abs(Math.round((t.x - gap) / (tw + gap)) - c) <= 1 && t.y < y1 + tw && t.y + t.h > y0 - tw).map(t => t.id);
  for (let c = 0; c < cols; c++) {
    let y = gap - rnd(c + 3) * tw * 0.6;
    while (y < H) {
      // the next photo in rotation that is not already beside or above this spot
      const taken = near(c, y, y + tw * 1.4);
      let id = order[n % order.length]!;
      for (let k = 0; k < order.length && taken.includes(id); k++) id = order[(n + k) % order.length]!;
      n++;
      const [pw, ph] = PHOTOS[id]!;
      const th = clamp(tw * (ph / pw), tw * 0.7, tw * 1.45);
      const x = gap + c * (tw + gap);
      out.push({ x, y, w: tw, h: th, id, cols: 0, rows: 0, delay: 0 });
      y += th + gap;
    }
  }
  // only tiles that show take part; each gets a share of the modules by visible area
  tiles = out.filter(t => t.y + t.h > 0 && t.y < H);
}

function assign() {
  if (!qrData) return;
  const size = qrSize;
  const dark: { u: number; v: number }[] = [];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) if (qrData[i * size + j]) dark.push({ u: (j + 0.5) / size, v: (i + 0.5) / size });
  const area = tiles.map(t => Math.max(0, Math.min(t.y + t.h, H) - Math.max(t.y, 0)) * t.w);
  const total = area.reduce((a, b) => a + b, 0);
  const quota = area.map(a => Math.max(1, Math.round(dark.length * a / total)));
  const left = [...quota];
  const centres = tiles.map(t => ({ x: (t.x + t.w / 2) / W, y: (t.y + t.h / 2) / H }));
  const order = dark.map((d, i) => ({ d, i, r: rnd(i + 11) })).sort((a, b) => a.r - b.r);
  const byTile: { u: number; v: number }[][] = tiles.map(() => []);
  for (const { d } of order) {
    let best = -1, bd = Infinity;
    for (let t = 0; t < tiles.length; t++) {
      if (left[t]! <= 0) continue;
      const dx = centres[t]!.x - d.u, dy = centres[t]!.y - d.v;
      const dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = t; }
    }
    if (best < 0) best = Math.floor(rnd(d.u * 99 + d.v) * tiles.length);
    left[best]!--; byTile[best]!.push(d);
  }
  mods = [];
  tiles.forEach((t, ti) => {
    const list = byTile[ti]!.sort((a, b) => a.v - b.v || a.u - b.u);
    const n = Math.max(1, list.length);
    t.cols = Math.max(1, Math.round(Math.sqrt(n * t.w / t.h)));
    t.rows = Math.max(1, Math.ceil(n / t.cols));
    const dist = Math.hypot(centres[ti]!.x - 0.5, centres[ti]!.y - 0.5);
    t.delay = dist * 0.14;
    list.forEach((d, k) => mods.push({ u: d.u, v: d.v, tile: ti, cell: k, delay: 0.17 + dist * 0.16 + rnd(k + ti * 31) * 0.1 }));
    t.px = undefined;
  });
  tiles.forEach(sample);
}

/** The photo, shrunk to the tile's module grid: the colours the modules take on. */
function sample(t: Tile) {
  const im = imgs.get(t.id);
  if (!im?.complete || !im.naturalWidth || !t.cols) return;
  const c = document.createElement('canvas');
  c.width = t.cols; c.height = t.rows;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  cover(x, im, 0, 0, t.cols, t.rows);
  t.px = x.getImageData(0, 0, t.cols, t.rows).data;
  t.img = im;
}

function cover(x: CanvasRenderingContext2D, im: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const ir = im.naturalWidth / im.naturalHeight, r = dw / dh;
  let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
  if (ir > r) { sw = sh * r; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / r; sy = (im.naturalHeight - sh) / 2; }
  x.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
}

function draw() {
  const c = cv.value; if (!c) return;
  const x = c.getContext('2d')!;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, H);
  if (!qrData) return;

  const a = easeIO(clamp(p / 0.2));
  const card = cardAt(a);
  const qs = card.cw * 0.7;
  const qx0 = -qs / 2, qy0 = card.ch * 0.56 - card.ch / 2 - qs / 2; // QR's top-left in card-local units
  const cell = qs / qrSize;
  const cos = Math.cos(card.rot), sin = Math.sin(card.rot);
  const toScreen = (lx: number, ly: number) => ({ x: card.cx + (lx * cos - ly * sin) * card.k, y: card.cy + (lx * sin + ly * cos) * card.k });

  // the paper card
  const paper = 1 - clamp((p - 0.12) / 0.16);
  if (paper > 0) {
    x.save();
    x.globalAlpha = paper;
    x.translate(card.cx, card.cy); x.rotate(card.rot); x.scale(card.k, card.k);
    x.shadowColor = `rgba(60,48,36,${0.22 * (1 - a)})`; x.shadowBlur = 40 / card.k; x.shadowOffsetY = 18 / card.k;
    x.fillStyle = '#fdfcfb';
    x.beginPath(); x.roundRect(-card.cw / 2, -card.ch / 2, card.cw, card.ch, card.cw * 0.055); x.fill();
    x.shadowColor = 'transparent';
    const textA = 1 - clamp(p / 0.1);
    if (textA > 0) {
      x.globalAlpha = paper * textA;
      x.textAlign = 'center';
      x.fillStyle = '#1a1a1a';
      x.font = `640 ${card.cw * 0.098}px "Bricolage Grotesque Variable", Inter, sans-serif`;
      x.fillText('Aina & Hakim', 0, -card.ch / 2 + card.ch * 0.135);
      x.fillStyle = '#55524f';
      x.font = `500 ${card.cw * 0.046}px Inter, sans-serif`;
      x.fillText(props.L.hero.card, 0, -card.ch / 2 + card.ch * 0.19);
      x.fillStyle = '#1a1a1a';
      x.font = `600 ${card.cw * 0.05}px Inter, sans-serif`;
      x.fillText('indahnya.my/aina-hakim', 0, card.ch / 2 - card.ch * 0.075);
    }
    x.restore();
  }

  // the modules: from the QR to their place in a tile
  const ink = [26, 26, 26];
  for (const m of mods) {
    const t = tiles[m.tile]!;
    const tm = easeIO(clamp((p - m.delay) / 0.34));
    const s = toScreen(qx0 + m.u * qs, qy0 + m.v * qs);
    const col = m.cell % t.cols, row = Math.floor(m.cell / t.cols);
    const cw = t.w / t.cols, ch = t.h / t.rows;
    const ex = t.x + (col + 0.5) * cw, ey = t.y + (row + 0.5) * ch;
    const size0 = cell * card.k;
    const mw = lerp(size0, cw + 0.6, tm), mh = lerp(size0, ch + 0.6, tm);
    const cx = lerp(s.x, ex, tm), cy = lerp(s.y, ey, tm);
    let r = ink[0]!, g = ink[1]!, b = ink[2]!;
    const tint = clamp(tm * 1.5 - 0.3);
    if (t.px && tint > 0) {
      const k = (row * t.cols + col) * 4;
      r = lerp(r, t.px[k]!, tint); g = lerp(g, t.px[k + 1]!, tint); b = lerp(b, t.px[k + 2]!, tint);
    }
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.translate(cx, cy);
    x.rotate(card.rot * (1 - tm));
    x.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    x.fillRect(-mw / 2, -mh / 2, mw, mh);
  }
  x.setTransform(dpr, 0, 0, dpr, 0, 0);

  // the photos resolve over their mosaic
  for (const t of tiles) {
    const ia = easeO(clamp((p - 0.66 - t.delay * 0.5) / 0.18));
    if (ia <= 0 || !t.img) continue;
    x.save();
    x.globalAlpha = ia;
    x.beginPath(); x.roundRect(t.x, t.y, t.w, t.h, lerp(2, 14, ia)); x.clip();
    cover(x, t.img, t.x, t.y, t.w, t.h);
    x.restore();
  }
}

function frame() { raf = 0; if (dirty) { dirty = false; draw(); } }
function invalidate() { dirty = true; if (!raf) raf = requestAnimationFrame(frame); }

function resize() {
  const el = stage.value; const c = cv.value; if (!el || !c) return;
  W = el.clientWidth; H = el.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  buildWall(); assign();
  placeFloaters();
  invalidate();
}

/* the DOM layers follow the same progress */
function applyDom() {
  if (copy.value) {
    const o = 1 - clamp(p / 0.12);
    copy.value.style.opacity = String(o);
    copy.value.style.transform = `translateY(${-p * 160}px)`;
    copy.value.style.visibility = o <= 0 ? 'hidden' : '';
  }
  if (floatRoot.value) {
    const o = 1 - clamp(p / 0.1);
    floatRoot.value.style.opacity = String(o);
    floatRoot.value.style.transform = `scale(${1 + p * 1.6})`;
    floatRoot.value.style.visibility = o <= 0 ? 'hidden' : '';
  }
  if (caption.value) {
    const o = clamp((p - 0.84) / 0.1);
    caption.value.style.opacity = String(o);
    caption.value.style.transform = `translateY(${(1 - o) * 24}px)`;
    caption.value.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }
}

const { boot } = useLandingMotion();
let ro: ResizeObserver | undefined;
let trigger: { kill: () => void } | undefined;
let onMove: ((e: PointerEvent) => void) | undefined;

onMounted(async () => {
  reduced.value = prefersReduced();
  const QR = await import('qrcode');
  const q = QR.create(props.qrUrl, { errorCorrectionLevel: 'M' });
  qrSize = q.modules.size; qrData = q.modules.data as unknown as Uint8Array;

  // the wall's images: small WebPs, sampled into module colours as they arrive
  for (const id of Object.keys(PHOTOS)) {
    const im = new Image();
    im.decoding = 'async';
    im.src = photo(id);
    im.onload = () => { tiles.filter(t => t.id === id).forEach(sample); invalidate(); };
    imgs.set(id, im);
  }
  resize();
  ro = new ResizeObserver(resize);
  ro.observe(stage.value!);
  document.fonts?.ready.then(() => { placeFloaters(); invalidate(); });
  Promise.all([document.fonts?.load('640 24px "Bricolage Grotesque Variable"'), document.fonts?.load('600 16px Inter')]).then(invalidate).catch(() => {});

  if (reduced.value) return;
  const { gsap, ST } = await boot();
  trigger = ST.create({
    trigger: wrap.value!, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => { p = s.progress; applyDom(); invalidate(); },
  });

  // the polaroids lean toward the pointer, each at its own depth
  if (matchMedia('(pointer: fine)').matches && floatRoot.value) {
    const items = [...floatRoot.value.querySelectorAll<HTMLElement>('[data-depth]')];
    const movers = items.map(el => ({ x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }), d: Number(el.dataset.depth) }));
    onMove = (e) => {
      const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
      for (const m of movers) { m.x(mx * 26 * m.d); m.y(my * 20 * m.d); }
    };
    addEventListener('pointermove', onMove, { passive: true });
  }
});
onBeforeUnmount(() => {
  ro?.disconnect(); trigger?.kill(); cancelAnimationFrame(raf);
  if (onMove) removeEventListener('pointermove', onMove);
});
</script>

<template>
  <section ref="wrap" class="relative" :class="reduced ? 'h-[100dvh]' : 'h-[270vh]'" aria-labelledby="hero-title">
    <div ref="stage" class="sticky top-0 h-[100dvh] min-h-[560px] overflow-hidden">
      <canvas ref="cv" class="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />

      <!-- the photos that are coming: polaroids around the card, captioned with who sent them -->
      <div v-if="floatBox.cw" ref="floatRoot" class="pointer-events-none absolute inset-0 origin-center" aria-hidden="true">
        <div
          v-for="(f, i) in floaters" :key="f.id" class="hero-float absolute" :class="floatHidden[i] && 'hidden'" :data-depth="f.d"
          :style="{ left: `${floatBox.cx + f.dx * floatBox.cw}px`, top: `${floatBox.cy + f.dy * floatBox.cw}px`, width: `${f.w * floatBox.cw}px`, '--r': `${f.r}deg`, '--i': i }"
        >
          <div class="hero-polaroid">
            <img :src="photo(f.id)" alt="" class="block w-full rounded-[6px] object-cover" :class="f.tall ? 'aspect-[4/5]' : 'aspect-[4/3]'" :fetchpriority="i < 2 ? 'high' : undefined" decoding="async" />
            <span class="mt-1.5 block truncate px-0.5 text-[11px] font-medium leading-4 text-[#55524f]">{{ f.name }}</span>
          </div>
        </div>
      </div>

      <!-- the words -->
      <div ref="copy" class="l-wrap relative flex h-full flex-col pb-10 pt-[104px] md:pt-[128px] lg:pt-[19vh]">
        <p data-words class="hero-in self-start text-[14px] font-semibold text-[#27622a] md:text-[15px]" style="--d: 0">{{ L.hero.eyebrow }}</p>
        <h1 id="hero-title" class="l-display mt-4 text-[clamp(44px,7.4vw,116px)] text-[#1a1a1a] md:mt-5">
          <span class="hero-line block"><span data-words class="hero-in inline-block" style="--d: 1">{{ L.hero.h1a }}</span></span>
          <span class="hero-line is-open block"><span data-words class="hero-in inline-block" style="--d: 2">{{ h1b.lead }}<span class="relative inline-block">{{ h1b.word }}<svg class="qr-ring pointer-events-none absolute left-[-9%] top-[-14%] h-[128%] w-[118%] overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M150 14 C 108 2, 34 6, 14 34 C -4 62, 40 92, 104 90 C 168 88, 196 62, 186 36 C 178 16, 140 8, 96 10" fill="none" stroke="#7dd56f" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="1" /></svg></span>{{ h1b.tail }}</span></span>
        </h1>
        <div class="max-w-[560px] min-[900px]:max-w-[44%] lg:max-w-[40%]">
          <p data-words class="l-lead hero-in mt-6 md:mt-8" style="--d: 3">{{ L.hero.sub }}</p>
          <div data-words class="hero-in mt-7 inline-flex flex-wrap items-center gap-3 md:mt-9" style="--d: 4">
            <NuxtLink to="/app?new=1" class="l-btn l-btn-go">{{ L.cta }}<ArrowRight class="size-[18px]" :stroke-width="2" aria-hidden="true" /></NuxtLink>
            <NuxtLink to="/aina-hakim" class="l-btn l-btn-line">{{ L.sample }}</NuxtLink>
          </div>
        </div>
      </div>

      <!-- the wall, named -->
      <div ref="caption" class="l-wrap pointer-events-none absolute inset-x-0 bottom-5 opacity-0 md:bottom-8">
        <div class="l-surface inline-flex max-w-full items-center gap-4 p-3 pr-4 md:gap-5 md:p-4 md:pr-5">
          <span class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#fde8e6] px-3 text-[12px] font-bold tracking-[0.04em] text-[#b42318]"><span class="live-dot size-1.5 rounded-full bg-[#d92d20]" aria-hidden="true" />LIVE</span>
          <span class="min-w-0">
            <span class="block truncate text-[16px] font-semibold leading-5 text-[#1a1a1a] md:text-[18px]">{{ L.hero.wall }}</span>
            <span class="block truncate text-[13px] leading-5 text-[#55524f]">{{ L.hero.wallSub }}</span>
          </span>
          <NuxtLink to="/aina-hakim/gambar" class="l-btn l-btn-ink l-btn-sm shrink-0">{{ L.sample }}</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-float { transform: translate(-50%, -50%); will-change: transform; }
.hero-polaroid {
  padding: 6px 6px 4px; border-radius: 10px; background: #fdfcfb;
  box-shadow: 0 1px 0 rgb(26 26 26 / .04), 0 18px 40px -18px rgb(60 48 36 / .45);
  transform: rotate(var(--r));
}
.hero-line { overflow: clip; padding-bottom: .06em; margin-bottom: -.06em; }
@media (prefers-reduced-motion: no-preference) {
  .hero-in { animation: hero-in 1.1s var(--l-ease) backwards; animation-delay: calc(var(--d) * 90ms + 120ms); }
  .hero-line:not(.is-open) .hero-in { animation-name: hero-rise; }
  .hero-polaroid { animation: hero-drop 1.2s var(--l-ease) backwards, hero-bob 6s ease-in-out infinite alternate; animation-delay: calc(var(--i) * 110ms + 380ms), calc(var(--i) * -900ms); }
  .live-dot { animation: live 1.6s ease-in-out infinite; }
}
.qr-ring path { stroke-dasharray: 1; stroke-dashoffset: 0; }
/* the ringed line cannot clip (the ring leaves the line box), so it fades up instead of rising */
.hero-line.is-open { overflow: visible; }
@media (prefers-reduced-motion: no-preference) {
  .qr-ring path { animation: ring 1s cubic-bezier(.65, 0, .35, 1) 1.1s backwards; }
}
@keyframes ring { from { stroke-dashoffset: 1; } }
@keyframes hero-in { from { opacity: 0; transform: translateY(18px); } }
@keyframes hero-rise { from { transform: translateY(105%); } }
@keyframes hero-drop { from { opacity: 0; transform: rotate(calc(var(--r) * 2.2)) translateY(40px) scale(.9); } }
@keyframes hero-bob { to { translate: 0 -7px; } }
@keyframes live { 50% { opacity: .35; } }
</style>
