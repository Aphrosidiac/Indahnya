<script setup lang="ts">
/**
 * A vine in the left margin: rooted in the footer, climbing the whole page
 * to the hero, branching, leafing, and opening a few small four-petal blooms
 * (the Mekar mark's flower). Barely there, behind everything, only where the
 * page has a real empty gutter (wide screens).
 *
 * Drawn from a fixed seed and measured from the root up, so it is the same
 * vine on every visit and a taller page only lengthens it at the top. Cut
 * into bands; each band grows upward the first time it scrolls into view.
 */
const box = ref<HTMLElement>();
const gutter = ref<HTMLElement>();
const size = ref({ w: 0, h: 0, vw: 0 });
/** The roots' strip along the foot of the page (the footer leaves this much room under its wordmark). */
const ROOTS = 150, ROOT_Y = 26;
const rootsGrown = ref(false);
const grown = ref<boolean[]>([]);
const reduced = ref(false);
const BAND = 1000;

interface Band { top: number; stem: { d: string; w: number }[]; twigs: { d: string; w: number }[]; leaves: string; blooms: string }

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n: number) => Math.round(n * 10) / 10;
/** Catmull-Rom through the points, as cubic Béziers. */
function smooth(p: [number, number][]) {
  if (p.length < 2) return '';
  let d = `M${f(p[0]![0])},${f(p[0]![1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i]!, b = p[i]!, c = p[i + 1]!, e = p[i + 2] ?? c;
    d += `C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)},${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`;
  }
  return d;
}
function leaf(x: number, y: number, a: number, l: number, w: number) {
  const dx = Math.sin(a), dy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
  const mx = x + dx * l / 2, my = y + dy * l / 2, tx = x + dx * l, ty = y + dy * l;
  return `M${f(x)},${f(y)}Q${f(mx + nx * w)},${f(my + ny * w)} ${f(tx)},${f(ty)}Q${f(mx - nx * w)},${f(my - ny * w)} ${f(x)},${f(y)}Z`;
}
const dot = (x: number, y: number, r: number) => `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
function bloom(x: number, y: number, r: number, turn: number) {
  let d = '';
  for (let k = 0; k < 4; k++) { const a = turn + k * Math.PI / 2; d += dot(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05, r); }
  return d;
}

/** Where the stem is, `u` px above its foot: a slow sway across the gutter. */
function stemX(W: number, u: number, p1: number, p2: number, p3: number) {
  return Math.min(W * 0.86, Math.max(W * 0.14, W * (0.5 + 0.3 * (0.6 * Math.sin(u / 340 + p1) + 0.3 * Math.sin(u / 143 + p2) + 0.1 * Math.sin(u / 59 + p3)))));
}

const bands = computed<Band[]>(() => {
  const { w: W, h: H } = size.value;
  if (W < 56 || H < 1000) return [];
  const R = rng(20260815);
  const n = Math.ceil(H / BAND);
  const out: Band[] = Array.from({ length: n }, (_, i) => ({ top: i * BAND, stem: [], twigs: [], leaves: '', blooms: '' }));
  const at = (y: number) => out[Math.min(n - 1, Math.max(0, Math.floor(y / BAND)))]!;
  const base = H - ROOTS + ROOT_Y, top = 150, span = base - top;
  const [p1, p2, p3] = [R() * 6.28, R() * 6.28, R() * 6.28];
  const xAt = (u: number) => stemX(W, u, p1, p2, p3);
  const widthAt = (u: number) => 4.6 - 2.8 * (u / span);

  /** A branch: curls upward as it goes, leaves alternating, a bloom, leaf or tendril at its tip. */
  function grow(x: number, y: number, ang: number, len: number, w: number, side: number, depth: number, up: boolean) {
    const pts: [number, number][] = [[x, y]];
    const steps = Math.max(3, Math.round(len / 11));
    const bend = -side * (0.025 + R() * 0.035); // a branch arcs back up over itself
    const forks = new Set([Math.round(steps * (0.3 + R() * 0.2)), Math.round(steps * (0.6 + R() * 0.2))]);
    let leafSide = R() < 0.5 ? 1 : -1;
    for (let s = 1; s <= steps; s++) {
      ang += up ? bend + (R() - 0.5) * 0.16 : (R() - 0.5) * 0.5 - ang * 0.04; // roots wander
      if (x > W - 26 && Math.sin(ang) > 0) ang -= 0.45; // never into the content
      x += Math.sin(ang) * 11; y -= Math.cos(ang) * 11 * (up ? 1 : -1);
      pts.push([x, y]);
      if (x < -6) break;
      if (up && s > 1 && R() < 0.62) { at(y).leaves += leaf(x, y, ang + leafSide * (0.65 + R() * 0.4), (14 + R() * 12) * (depth ? 0.75 : 1), 5 + R() * 3.5); leafSide = -leafSide; }
      if (depth < (up ? 1 : 2) && forks.has(s) && R() < (up ? 0.8 : 0.7)) {
        const fs = R() < 0.5 ? 1 : -1;
        grow(x, y, ang + (up ? side : fs) * (0.4 + R() * 0.45), (up ? 30 : 34) + R() * (up ? 50 : 70), w * 0.65, up ? side : fs, depth + 1, up);
      }
    }
    const band = at(pts[0]![1]);
    band.twigs.push({ d: smooth(pts), w: f(w) });
    const [tx, ty] = pts[pts.length - 1]!;
    if (!up) return;
    const r = R(), nearTop = y < top + 1600;
    if (r < (nearTop ? 0.45 : 0.16)) at(ty).blooms += bloom(tx, ty, 3 + R() * 2, R() * 3) + dot(tx, ty, 1.6);
    else if (r < 0.62) { // a tendril curling in on itself
      const c: [number, number][] = [[tx, ty]]; let a = ang, cx = tx, cy = ty;
      for (let k = 0; k < 14; k++) { a += side * 0.5; const st = 6.5 * (1 - k / 16); cx += Math.sin(a) * st; cy -= Math.cos(a) * st; c.push([cx, cy]); }
      at(ty).twigs.push({ d: smooth(c), w: f(Math.max(0.9, w * 0.7)) });
    } else at(ty).leaves += leaf(tx, ty, ang, 14 + R() * 8, 5 + R() * 2.4);
  }

  // the stem, root to tip, one path per band so each band can grow on its own
  const stem: [number, number, number][] = [];
  for (let u = 0; u <= span; u += 22) stem.push([xAt(u), base - u, u]);
  let run: [number, number][] = [], runBand = at(stem[0]![1]), runU = 0;
  for (const [x, y, u] of stem) {
    run.push([x, y]);
    if (at(y) !== runBand) { runBand.stem.push({ d: smooth(run), w: f(widthAt(runU)) }); runBand = at(y); run = [[x, y]]; runU = u; }
  }
  runBand.stem.push({ d: smooth(run), w: f(widthAt(runU)) });

  // a thinner stem twining round the main one, crossing it now and then
  const twine: [number, number][] = [];
  for (let u = 160; u <= span - 420; u += 14) twine.push([Math.min(W - 6, Math.max(4, xAt(u) + W * 0.09 * Math.sin(u / 95 + p2) + 5 * Math.sin(u / 23))), base - u]);
  for (let i = 0; i < twine.length; i += 50) {
    const piece = twine.slice(i, i + 51);
    at(piece[0]![1]).twigs.push({ d: smooth(piece), w: 1.5 });
    piece.forEach(([x, y], k) => { if (k % 7 === 3 && R() < 0.5) at(y).leaves += leaf(x, y, (R() < 0.5 ? -1 : 1) * (0.7 + R() * 0.5), 11 + R() * 8, 4 + R() * 1.4); });
  }

  // branches and the stem's own leaves, walking up
  let next = 90;
  for (const [x, y, u] of stem) {
    if (u > 40 && R() < 0.3) at(y).leaves += leaf(x, y, (R() < 0.5 ? -1 : 1) * (0.75 + R() * 0.5), 12 + R() * 10, 4.5 + R() * 3);
    if (u < next || u > span - 60) continue;
    next = u + 80 + R() * 120;
    const room = x < W / 2 ? 1 : -1;
    const side = R() < 0.72 ? room : -room;
    grow(x, y, side * (0.6 + R() * 0.55), 50 + R() * Math.min(210, W * 0.95), widthAt(u) * 0.5, side, 0, true);
  }
  // the crown at the top of the stem
  const [tx, ty] = stem[stem.length - 1]!;
  grow(tx, ty, -0.2, 60, 1.6, -1, 0, true);
  grow(tx, ty, 0.5, 46, 1.4, 1, 0, true);
  at(ty).blooms += bloom(tx + 3, ty - 6, 5, 0.4) + dot(tx + 3, ty - 6, 2.4);
  return out;
});

/**
 * The roots: from the foot of the stem, out under the whole footer. Each
 * root is a filled ribbon that tapers to a hair, bends slowly (its heading
 * changes by a smoothed random turn, never a kink), sinks a little with
 * distance (gravity) and leaves the page at the bottom edge, as if into the
 * soil. Rootlets fork outward and downward at 30-60 degrees, with fine hairs
 * on them. Local coordinates: x across the page, y down from the strip's top.
 */
const roots = computed(() => {
  const { w: W, vw: VW } = size.value;
  if (W < 56 || !VW) return null;
  const R = rng(19820517);
  const S = rng(20260815); // the stem's own seed: its first three draws are its sway
  const xb = stemX(W, 0, S() * 6.28, S() * 6.28, S() * 6.28);
  let d = '';

  /** A tapering ribbon along the points, w0 at the start to a hair at the end. */
  function ribbon(p: [number, number][], w0: number, w1: number) {
    if (p.length < 3) return;
    const L: [number, number][] = [], Rt: [number, number][] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)]!, c = p[Math.min(p.length - 1, i + 1)]!;
      const dx = c[0] - a[0], dy = c[1] - a[1], n = Math.hypot(dx, dy) || 1;
      const t = i / (p.length - 1), hw = (w0 + (w1 - w0) * Math.pow(t, 0.7)) / 2;
      L.push([p[i]![0] - (dy / n) * hw, p[i]![1] + (dx / n) * hw]);
      Rt.push([p[i]![0] + (dy / n) * hw, p[i]![1] - (dx / n) * hw]);
    }
    d += smooth([...L, ...Rt.reverse()]) + 'Z';
  }

  /** One root: heading `th` (0 = right, π/2 = straight down), sinking towards `sink`. */
  function root(x: number, y: number, th: number, len: number, w: number, sink: number, depth: number, lvl = 0) {
    const pts: [number, number][] = [[x, y]];
    const step = depth ? 5 : 8;
    const n = Math.max(4, Math.round(len / step));
    const right = Math.cos(th) >= 0;
    // heading measured as "down from horizontal", mirrored for roots growing left
    let a = right ? th : Math.PI - th, turn = 0;
    const forks: number[] = [];
    for (let k = Math.round(n * 0.12); k < n * 0.92; k += Math.round((depth ? 7 : 6) + R() * (depth ? 8 : 10))) forks.push(k);
    for (let k = 1; k <= n; k++) {
      turn = turn * 0.9 + (R() - 0.5) * (depth ? 0.07 : 0.03); // smoothed: slow bends, no kinks
      // a lateral holds its own depth (a slow wave around `lvl`), and only dips as it tapers out
      const t = k / n, ph = lvl * 0.37;
      const want = lvl + 18 * Math.sin(x / 330 + ph) + 7 * Math.sin(x / 123 + ph * 2) + Math.max(0, t - 0.82) * 140;
      const aim = !lvl ? sink : Math.atan2(want - y, 150);
      a += turn + (aim - a) * (lvl ? 0.022 : 0.03);
      if (lvl && k > 10 && y < 52) a += (52 - y) * 0.005; // the soil line pushes back softly, so a rise rounds over instead of flattening
      a = Math.max(lvl ? -0.22 : -0.05, Math.min(1.45, a)); // a gentle rise at most, never up to the letters
      x += Math.cos(a) * step * (right ? 1 : -1); y += Math.sin(a) * step;
      pts.push([x, y]);
      if (y > ROOTS + 12 || x < -20 || x > VW + 20) break; // into the soil, or off the page
      if (forks.includes(k) && depth < 2) {
        const cw = w * (1 - k / n);
        if (cw < 0.35) continue;
        if (depth === 0 && lvl && R() < 0.3 && y < ROOTS - 30) {
          // a side lateral: off sideways at its own shallow depth, wandering like its parent
          root(x, y, right ? a + 0.35 : Math.PI - a - 0.35, 120 + R() * 260, cw * 0.55, 0, 1, Math.min(ROOTS - 18, y + 12 + R() * 22));
          continue;
        }
        // a rootlet: down from its parent at any angle from forward to slightly back, finer further out
        const ta = Math.min(2.1, Math.max(0.25, a + 0.45 + R() * 1.1));
        root(x, y, right ? ta : Math.PI - ta, (depth ? 10 + R() * 22 : 30 + R() * 100) * (1 - 0.45 * k / n), cw * 0.62, Math.min(1.3, ta + 0.15), depth + 1);
      }
    }
    ribbon(pts, w, depth ? 0.35 : 0.8);
  }

  const cy = ROOT_Y;
  // the crown: the stem flares into the soil
  d += `M${f(xb - 2.6)},${f(cy - 14)}C${f(xb - 3)},${f(cy - 4)} ${f(xb - 9)},${f(cy + 3)} ${f(xb - 12)},${f(cy + 6)}L${f(xb + 12)},${f(cy + 6)}C${f(xb + 9)},${f(cy + 3)} ${f(xb + 3)},${f(cy - 4)} ${f(xb + 2.6)},${f(cy - 14)}Z`;
  // laterals across the page: long, shallow, sinking slowly; the longest reach the far side
  // each lateral at its own depth: the shallowest spread furthest, as they do
  const lat = [[1.3, 44, 5.6, 0.12], [1.12, 92, 4.6, 0.5], [0.86, 70, 4.8, 0.34], [0.62, 56, 4.2, 0.22], [0.46, 108, 3.6, 0.66], [0.3, 126, 3, 0.88]] as const;
  lat.forEach(([l, lvl, w, th]) => root(xb + 4, cy + 3, th, (VW - xb) * l, w, 0, 0, lvl));
  // back towards the window's edge
  [[1.4, 50, 4], [1.1, 78, 3.2], [0.8, 104, 2.4]].forEach(([l, lvl, w], i) => root(xb - 4, cy + 3 + i, Math.PI - 0.35 - i * 0.18, xb * l!, w!, 0, 0, lvl!));
  // the taproot and two steep ones, straight into the ground
  root(xb, cy + 4, Math.PI / 2 + 0.05, 160, 4.6, 1.4, 0);
  root(xb + 3, cy + 4, 1.05, 160, 3, 1.3, 0);
  root(xb - 3, cy + 4, Math.PI - 1.1, 160, 2.8, 1.3, 0);
  return { d, xb };
});

let ro: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;
let t: ReturnType<typeof setTimeout> | undefined;
function measure() {
  const el = box.value; if (!el || !gutter.value) return;
  // the box is the page's own size (inset-0, clipped), so nothing here can lengthen the page
  const w = Math.round(gutter.value.clientWidth), h = Math.round(el.clientHeight), vw = Math.round(el.clientWidth);
  if (w !== size.value.w || vw !== size.value.vw || h !== size.value.h) size.value = { w, h, vw };
}
watch(bands, async (b) => {
  grown.value = b.map((_, i) => grown.value[i] ?? reduced.value);
  await nextTick();
  io?.disconnect();
  if (reduced.value || !box.value) return;
  io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { grown.value[Number((e.target as HTMLElement).dataset.i)] = true; io?.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  box.value.querySelectorAll<HTMLElement>('[data-i]').forEach(el => { if (!grown.value[Number(el.dataset.i)]) io!.observe(el); });
  const r = box.value.querySelector<HTMLElement>('.vine-roots');
  if (r && !rootsGrown.value) {
    const rio = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { rootsGrown.value = true; rio.disconnect(); } }, { rootMargin: '0px 0px -4% 0px' });
    rio.observe(r);
  }
});
onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches;
  rootsGrown.value = reduced.value;
  ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(measure, 150); });
  if (box.value) ro.observe(box.value);
  measure();
});
onBeforeUnmount(() => { ro?.disconnect(); io?.disconnect(); clearTimeout(t); });
</script>

<template>
  <div ref="box" class="vine pointer-events-none absolute inset-0 max-[1391px]:hidden" aria-hidden="true">
    <!-- the gutter: from the window's edge to where .l-wrap's content starts -->
    <div ref="gutter" class="vine-gutter absolute bottom-0 left-0 top-0">
      <svg
        v-for="(b, i) in bands" :key="`${size.w}:${i}`" :data-i="i" class="vine-band" :class="grown[i] && 'is-grown'"
        :style="{ top: `${b.top}px`, height: `${Math.min(BAND, size.h - b.top)}px` }" :width="size.w" :height="Math.min(BAND, size.h - b.top)" :viewBox="`0 ${b.top} ${size.w} ${Math.min(BAND, size.h - b.top)}`"
      >
        <path v-for="(s, k) in b.stem" :key="`s${k}`" class="vine-stem" :d="s.d" :stroke-width="s.w" pathLength="1" />
        <g class="vine-rest">
          <path v-for="(s, k) in b.twigs" :key="`t${k}`" :d="s.d" :stroke-width="s.w" fill="none" stroke="currentColor" stroke-linecap="round" />
          <path v-if="b.leaves" :d="b.leaves" fill="currentColor" fill-opacity=".75" />
          <path v-if="b.blooms" :d="b.blooms" fill="currentColor" />
        </g>
      </svg>
    </div>
    <!-- the roots, across the whole foot of the page -->
    <svg
      v-if="roots" class="vine-roots absolute bottom-0 left-0" :class="rootsGrown && 'is-grown'" :width="size.vw" :height="ROOTS" :viewBox="`0 0 ${size.vw} ${ROOTS}`"
      :style="{ '--crown': `${Math.round(roots.xb)}px ${ROOT_Y}px` }"
    >
      <path :d="roots.d" fill="currentColor" />
    </svg>
  </div>
</template>

<style scoped>
/* the gutter: from the window's edge to where .l-wrap's content starts */
.vine { z-index: -1; overflow: clip; color: var(--vine, #2f6b2c); opacity: var(--vine-o, .3); transition: color .7s var(--l-ease), opacity .7s var(--l-ease); }
.vine-gutter { width: max(0px, calc((100% - 1360px) / 2 + 40px)); }
.vine-band { position: absolute; left: 0; overflow: visible; }
.vine-roots { clip-path: circle(0 at var(--crown)); transition: clip-path 3.2s cubic-bezier(.3, .1, .3, 1) .2s; }
.vine-roots.is-grown { clip-path: circle(150% at var(--crown)); }
.vine-stem { fill: none; stroke: currentColor; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 2.6s var(--l-ease); }
.vine-rest { opacity: 0; transition: opacity 1.8s ease .9s; }
.is-grown .vine-stem { stroke-dashoffset: 0; }
.is-grown .vine-rest { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .vine-stem, .vine-rest, .vine-roots { transition: none; } }
</style>
