<script setup lang="ts">
import { MapPin, Timer, ListOrdered, QrCode, Music2, MessageCircle, MousePointer2 } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';
import { KAD_TEMPLATES, KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';
import { prefersReduced } from '~/composables/useLandingMotion';

/**
 * The kad, live. The phone is /contoh/kad: the guest component itself, on
 * the sample event, in a frame. Picking a template or typing names re-dresses
 * it by postMessage, so what the visitor plays with is the real card.
 *
 * Until they touch it, a cursor plays with it for them (Partiful's demo
 * hand): it walks the template chips one by one. Any real pointer or key in
 * the section stops it for good. The stage behind the phone takes the
 * template's own ground, with a lace edge (Arc's scallop) along its top.
 */
const props = defineProps<{ L: LandingCopy }>();
const template = ref<KadTemplate>('garden');
const names = reactive({ a: '', b: '' });
const frame = ref<HTMLIFrameElement>();
const chips = ref<HTMLElement[]>([]);
const controls = ref<HTMLElement>();
const root = ref<HTMLElement>();
const ready = ref(false);
const theme = computed(() => KAD_THEMES[template.value]);
const PERK_ICONS = [MapPin, Timer, ListOrdered, QrCode, Music2, MessageCircle];

function send() {
  if (!ready.value) return;
  frame.value?.contentWindow?.postMessage({ type: 'kad-demo', template: template.value, names: { a: names.a.trim(), b: names.b.trim() }, cover: true }, location.origin);
}
let typing: ReturnType<typeof setTimeout> | undefined;
watch(template, send);
watch(names, () => { clearTimeout(typing); typing = setTimeout(send, 140); });
function onMessage(e: MessageEvent) {
  if (e.origin === location.origin && e.data?.type === 'kad-demo-ready' && e.source === frame.value?.contentWindow) { ready.value = true; send(); }
}

/* ── the demo cursor ── */
const cursor = reactive({ x: 0, y: 0, on: false, press: false });
let demo: ReturnType<typeof setTimeout> | undefined;
let stopped = false;
let step = 1;
function stopDemo() { stopped = true; cursor.on = false; clearTimeout(demo); }
function demoStep() {
  if (stopped) return;
  const chip = chips.value[step % KAD_TEMPLATES.length];
  const box = controls.value?.getBoundingClientRect();
  if (!chip || !box) return;
  const r = chip.getBoundingClientRect();
  cursor.on = true;
  cursor.x = r.left - box.left + r.width * 0.62; cursor.y = r.top - box.top + r.height * 0.6;
  demo = setTimeout(() => {
    if (stopped) return;
    cursor.press = true;
    template.value = KAD_TEMPLATES[step % KAD_TEMPLATES.length]!;
    step++;
    setTimeout(() => { cursor.press = false; }, 160);
    demo = setTimeout(demoStep, 2600);
  }, 900);
}
let io: IntersectionObserver | undefined;
onMounted(() => {
  addEventListener('message', onMessage);
  if (prefersReduced() || !matchMedia('(pointer: fine)').matches) return;
  io = new IntersectionObserver(([e]) => {
    if (e?.isIntersecting && !stopped) { clearTimeout(demo); demo = setTimeout(demoStep, 1200); }
    else clearTimeout(demo);
  }, { threshold: 0.45 });
  if (root.value) io.observe(root.value);
});
onBeforeUnmount(() => { removeEventListener('message', onMessage); io?.disconnect(); clearTimeout(demo); clearTimeout(typing); });

const swatch = (t: KadTemplate) => ({ background: `linear-gradient(135deg, ${KAD_THEMES[t].bg} 0 50%, ${KAD_THEMES[t].accent} 50% 100%)` });
</script>

<template>
  <section id="kad" ref="root" class="l-wrap scroll-mt-24 py-20 md:py-28" @pointerdown.capture="stopDemo" @keydown.capture="stopDemo">
    <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div ref="controls" class="relative lg:col-span-5">
        <h2 class="l-h2 !text-[clamp(36px,4.2vw,64px)]">{{ L.kad.title }}</h2>
        <p class="l-lead mt-6">{{ L.kad.body }}</p>

        <p class="mt-10 text-[14px] font-semibold text-[#1a1a1a]">{{ L.kad.pick }}</p>
        <div class="mt-3 flex flex-wrap gap-2" role="radiogroup" :aria-label="L.kad.pick">
          <button
            v-for="t in KAD_TEMPLATES" :key="t" ref="chips" type="button" role="radio" :aria-checked="template === t"
            class="tpl inline-flex h-11 items-center gap-2.5 rounded-full pl-1.5 pr-4 text-[15px] font-semibold" :class="template === t ? 'is-on' : ''"
            @click="template = t"
          >
            <span class="size-8 rounded-full shadow-[inset_0_0_0_1px_rgba(26,26,26,.12)]" :style="swatch(t)" />{{ KAD_THEMES[t].label }}
          </button>
        </div>

        <p class="mt-8 text-[14px] font-semibold text-[#1a1a1a]">{{ L.kad.names }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <label class="block"><span class="sr-only">{{ L.kad.a }}</span><input v-model="names.a" maxlength="20" placeholder="Aina" class="field-l" autocomplete="off"></label>
          <label class="block"><span class="sr-only">{{ L.kad.b }}</span><input v-model="names.b" maxlength="20" placeholder="Hakim" class="field-l" autocomplete="off"></label>
        </div>

        <ul class="mt-10 grid grid-cols-2 gap-x-6 gap-y-3.5" role="list">
          <li v-for="(p, i) in L.kad.perks" :key="p" class="flex items-center gap-2.5 text-[15px] text-[#55524f]">
            <component :is="PERK_ICONS[i]" class="size-[18px] shrink-0 text-[#27622a]" :stroke-width="1.75" aria-hidden="true" />{{ p }}
          </li>
        </ul>

        <!-- the demo hand -->
        <div class="demo-cursor pointer-events-none absolute left-0 top-0 z-10" :class="{ 'is-on': cursor.on, 'is-press': cursor.press }" :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }" aria-hidden="true">
          <MousePointer2 class="size-7 fill-[#1a1a1a] text-white drop-shadow-[0_4px_8px_rgba(0,0,0,.25)]" :stroke-width="1.5" />
        </div>
      </div>

      <!-- the stage, in the template's own ground -->
      <div class="lg:col-span-7">
        <div class="stage relative flex justify-center overflow-hidden rounded-[28px] px-4 py-12 md:py-14" :style="{ background: theme.band }">
          <svg class="lace pointer-events-none absolute inset-x-0 top-0 h-3 w-full" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="lace" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 0 H24 V2 Q18 12 12 2 Q6 12 0 2 Z" :fill="theme.bg" /></pattern></defs><rect width="100%" height="12" fill="url(#lace)" /></svg>
          <div class="l-phone relative aspect-[9/19.5] h-[min(680px,74vh)] max-w-full">
            <div class="l-phone-screen" :style="{ background: theme.bg }">
              <!-- a picture of the card, not a second page to get lost in: no scroll, no taps, no focus; the chips and names still re-dress it -->
              <iframe ref="frame" src="/contoh/kad?cover=1" title="Kad jemputan contoh" loading="lazy" inert scrolling="no" class="pointer-events-none block size-full border-0" />
              <!-- iOS chrome over the card: the status bar and the home bar, in the template's ink -->
              <div class="status pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between" :style="{ color: theme.ink }" aria-hidden="true">
                <span class="time">9:41</span>
                <span class="flex items-center gap-[5px]">
                  <svg viewBox="0 0 18 12" class="h-[11px]"><g fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></g></svg>
                  <svg viewBox="0 0 16 12" class="h-[11px]"><path fill="currentColor" d="M8 2.6c2.2 0 4.2.9 5.7 2.3l1.1-1.2A9.8 9.8 0 0 0 8 1 9.8 9.8 0 0 0 1.2 3.7l1.1 1.2A8.2 8.2 0 0 1 8 2.6Zm0 3.3c1.3 0 2.5.5 3.4 1.3l1.1-1.2A6.6 6.6 0 0 0 8 4.3 6.6 6.6 0 0 0 3.5 6l1.1 1.2c.9-.8 2.1-1.3 3.4-1.3Zm0 3.2c.5 0 .9.2 1.2.5L8 11 6.8 9.6c.3-.3.7-.5 1.2-.5Z" /></svg>
                  <span class="battery"><i /></span>
                </span>
              </div>
              <span class="home pointer-events-none absolute bottom-[7px] left-1/2 h-[5px] w-[36%] -translate-x-1/2 rounded-full" :style="{ background: theme.ink }" aria-hidden="true" />
            </div>
            <span class="l-phone-island" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stage { transition: background-color .6s var(--l-ease); }
/* the status bar sits level with the island: time in the left ear, icons in the right */
.status { height: 0; margin-top: 7.9%; padding: 0 9% 0 12%; font: 600 15px/1 Inter, system-ui, sans-serif; letter-spacing: -.01em; transition: color .6s; } /* a zero-height row centred on the island's midline (margin % is of the width) */
.status .battery { position: relative; width: 24px; height: 12px; border-radius: 4px; border: 1px solid currentColor; opacity: .9; padding: 1.5px; }
.status .battery::after { content: ''; position: absolute; right: -3px; top: 3.5px; width: 1.5px; height: 4px; border-radius: 0 1px 1px 0; background: currentColor; opacity: .5; }
.status .battery i { display: block; width: 78%; height: 100%; border-radius: 2px; background: currentColor; }
@media (max-width: 640px) { .status { font-size: 13px; padding: 0 7% 0 11%; } .status .battery { width: 21px; height: 11px; } }
.home { opacity: .55; transition: background-color .6s; }
.lace rect { transition: fill .6s; }
.tpl { background: rgb(26 26 26 / .05); color: #1a1a1a; transition: background-color .2s, box-shadow .2s, transform .2s var(--l-ease); }
.tpl:hover { background: rgb(26 26 26 / .09); }
.tpl:active { transform: scale(.97); }
.tpl.is-on { background: #fdfcfb; box-shadow: 0 0 0 2px #1a1a1a, 0 10px 24px -14px rgb(60 48 36 / .45); }
.field-l {
  width: 100%; height: 52px; border-radius: 14px; border: 1px solid #d9d5d1; background: #fdfcfb; padding: 0 16px;
  font-size: 17px; color: #1a1a1a; outline: none; transition: border-color .15s, box-shadow .15s;
}
.field-l::placeholder { color: #75716d; }
.field-l:focus { border-color: #1a1a1a; box-shadow: 0 0 0 3px rgb(26 26 26 / .1); }
.demo-cursor { opacity: 0; transition: transform .9s cubic-bezier(.65, 0, .35, 1), opacity .4s; }
.demo-cursor.is-on { opacity: 1; }
.demo-cursor > * { transition: transform .15s; }
.demo-cursor.is-press > * { transform: scale(.82); }
</style>
