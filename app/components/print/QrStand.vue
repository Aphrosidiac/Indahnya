<script setup lang="ts">
import { ScanLine, Camera, Images } from 'lucide-vue-next';
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import { KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';
import KadOrnament from '~/components/kad/KadOrnament.vue';
import { Logo } from '~/ui';

/**
 * The table stand: the printed QR guests meet first. It wears the couple's
 * kad (the template's ground, inks, fonts and ornament), so the stand, the
 * kad and the gallery read as one set. The QR is the branded one
 * (shared/utils/qr-art.ts) in the template's own ink, always on a light
 * panel, because a scanner needs contrast more than a theme.
 *
 * Every size is in container units, so one component is the A5 poster, the
 * A4 poster, each half of the folded table card, and the landing's mock-ups.
 */
const props = withDefaults(defineProps<{
  url: string; link: string; template?: KadTemplate; format?: 'portrait' | 'landscape';
  names: { a: string; b?: string }; title?: string; date?: string; hashtag?: string; locale?: 'ms' | 'en';
}>(), { template: 'garden', format: 'portrait', title: '', date: '', hashtag: '', locale: 'ms' });

const t = computed(() => KAD_THEMES[props.template]);
const dark = computed(() => props.template === 'emas');
const qr = computed(() => qrArtDataUrl(props.url, dark.value
  ? { ink: t.value.bg, paper: t.value.ink, accent: t.value.accent, margin: 2 }
  : { ink: t.value.ink, paper: '#ffffff', accent: t.value.accent === t.value.ink ? '#7dd56f' : t.value.accent, margin: 2 }));
const vars = computed(() => ({
  '--k-bg': t.value.bg, '--k-band': t.value.band, '--k-ink': t.value.ink, '--k-muted': t.value.muted, '--k-accent': t.value.accent,
  '--k-names': t.value.names, '--k-heading': t.value.heading, '--k-body': t.value.body,
}));
const L = computed(() => props.locale === 'en'
  ? { head: 'Share your photos of our day', steps: ['Scan', 'Snap or pick', 'Upload'], note: 'No app, no sign-up' }
  : { head: 'Kongsi gambar majlis kami', steps: ['Scan', 'Snap / pilih', 'Upload'], note: 'Tak payah app, tak payah login' });
const ICONS = [ScanLine, Camera, Images];
</script>

<template>
  <div class="stand" :class="[format, `tpl-${template}`]" :style="vars">
    <div class="frame" aria-hidden="true" />
    <div class="body">
      <div class="who">
        <p v-if="title" class="title">{{ title }}</p>
        <KadOrnament :kind="t.ornament" class="orn" />
        <p class="names" :class="t.namesCaps && 'caps'">
          <span>{{ names.a }}</span>
          <template v-if="names.b"><span class="amp">&amp;</span><span>{{ names.b }}</span></template>
        </p>
        <p v-if="date" class="date">{{ date }}</p>
        <p class="head">{{ L.head }}</p>
        <ol class="steps">
          <li v-for="(s, i) in L.steps" :key="s"><span class="dot"><component :is="ICONS[i]" :stroke-width="1.75" /></span>{{ s }}</li>
        </ol>
      </div>
      <div class="scan">
        <div class="qr-wrap"><i /><i /><i /><i /><img :src="qr" alt="QR" class="qr"></div>
        <p class="link">{{ link }}</p>
        <p class="note">{{ L.note }}</p>
      </div>
    </div>
    <div class="foot">
      <span>{{ hashtag }}</span>
      <span class="brand"><Logo :size="10" :wordmark="false" mono inherit class="brand-mark" />indahnya.my</span>
    </div>
  </div>
</template>

<style scoped>
.stand {
  container-type: inline-size; position: relative; overflow: hidden; box-sizing: border-box;
  display: flex; flex-direction: column; background: var(--k-bg); color: var(--k-ink); font-family: var(--k-body);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.stand.portrait { aspect-ratio: 1 / 1.414; }
.stand.landscape { aspect-ratio: 1.414 / 1; }
/* a double rule inset from the edge, the way printed kad are framed */
.frame { position: absolute; inset: 3.2cqw; border: 0.25cqw solid color-mix(in srgb, var(--k-accent) 55%, transparent); border-radius: 1.2cqw; pointer-events: none; }
.frame::after { content: ""; position: absolute; inset: 0.9cqw; border: 0.12cqw solid color-mix(in srgb, var(--k-accent) 30%, transparent); border-radius: 0.6cqw; }
.body { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8cqw 9cqw 0; }
.landscape .body { flex-direction: row; align-items: center; gap: 5cqw; padding: 6cqw 7cqw 0; }
.landscape .who, .landscape .scan { flex: 1; }
.title { margin: 0; font-family: var(--k-heading); font-size: 2.5cqw; letter-spacing: .32em; text-transform: uppercase; color: var(--k-accent); }
.orn { margin-top: 1.6cqw; width: 34cqw; height: auto; }
.landscape .orn { width: 24cqw; }
.names { margin: 2cqw 0 0; font-family: var(--k-names); font-size: 10cqw; line-height: 1; color: var(--k-ink); display: flex; flex-direction: column; align-items: center; }
.tpl-garden .names { font-size: 11.5cqw; line-height: .92; }
.names.caps { text-transform: uppercase; font-size: 7cqw; letter-spacing: .06em; }
.landscape .names { font-size: 7.5cqw; }
.landscape.tpl-garden .names { font-size: 8.5cqw; }
.landscape .names.caps { font-size: 5.2cqw; }
.amp { font-size: .55em; margin: .1em 0; color: var(--k-accent); }
.date { margin: 2.4cqw 0 0; font-family: var(--k-heading); font-size: 2.8cqw; letter-spacing: .14em; color: var(--k-muted); }
.landscape .date { font-size: 2cqw; margin-top: 1.6cqw; }
.head { margin: 3.6cqw 0 0; font-family: var(--k-heading); font-size: 4.4cqw; line-height: 1.15; color: var(--k-ink); }
.tpl-moden .head, .tpl-minimal .head { font-weight: 600; letter-spacing: -.02em; }
.landscape .head { font-size: 3.1cqw; margin-top: 3cqw; }
.steps { list-style: none; margin: 2.4cqw 0 0; padding: 0; display: flex; justify-content: center; gap: 4cqw; font-family: Inter, sans-serif; font-size: 2.3cqw; font-weight: 500; color: var(--k-muted); }
.landscape .steps { font-size: 1.6cqw; gap: 2.6cqw; margin-top: 2.2cqw; }
.steps li { display: flex; flex-direction: column; align-items: center; gap: 1cqw; }
.dot { display: grid; place-items: center; width: 5.6cqw; height: 5.6cqw; border-radius: 50%; background: color-mix(in srgb, var(--k-accent) 14%, transparent); color: var(--k-accent); }
.landscape .dot { width: 4.6cqw; height: 4.6cqw; }
.dot :deep(svg) { width: 55%; height: 55%; }
.scan { display: flex; flex-direction: column; align-items: center; margin-top: 4.4cqw; }
.landscape .scan { margin-top: 0; }
/* the QR panel, held by four corner brackets in the accent */
.qr-wrap { position: relative; width: 44cqw; padding: 2cqw; border-radius: 3cqw; background: #fff; box-shadow: 0 0.6cqw 2.4cqw -1cqw rgb(0 0 0 / .18); }
.tpl-emas .qr-wrap { background: var(--k-ink); }
.landscape .qr-wrap { width: 30cqw; padding: 1.6cqw; border-radius: 2cqw; }
.qr { display: block; width: 100%; height: auto; }
.qr-wrap i { position: absolute; width: 5cqw; height: 5cqw; border: 0.45cqw solid var(--k-accent); }
.qr-wrap i:nth-of-type(1) { left: -2cqw; top: -2cqw; border-right: 0; border-bottom: 0; border-top-left-radius: 2.4cqw; }
.qr-wrap i:nth-of-type(2) { right: -2cqw; top: -2cqw; border-left: 0; border-bottom: 0; border-top-right-radius: 2.4cqw; }
.qr-wrap i:nth-of-type(3) { left: -2cqw; bottom: -2cqw; border-right: 0; border-top: 0; border-bottom-left-radius: 2.4cqw; }
.qr-wrap i:nth-of-type(4) { right: -2cqw; bottom: -2cqw; border-left: 0; border-top: 0; border-bottom-right-radius: 2.4cqw; }
.landscape .qr-wrap i { width: 3.4cqw; height: 3.4cqw; border-width: .32cqw; }
.link { margin: 3.4cqw 0 0; font-family: Inter, sans-serif; font-size: 3.2cqw; font-weight: 600; letter-spacing: -.01em; color: var(--k-ink); }
.landscape .link { font-size: 2.1cqw; margin-top: 2.4cqw; }
.note { margin: .8cqw 0 0; font-family: Inter, sans-serif; font-size: 2.2cqw; color: var(--k-muted); }
.landscape .note { font-size: 1.5cqw; }
.foot { display: flex; justify-content: space-between; align-items: center; padding: 2cqw 9cqw 7cqw; font-family: Inter, sans-serif; font-size: 2cqw; color: var(--k-muted); }
.landscape .foot { padding: 0 7cqw 5.4cqw; font-size: 1.4cqw; }
.brand { display: inline-flex; align-items: center; gap: .8cqw; }
.brand-mark { width: 2.4cqw !important; height: 2.4cqw !important; }
.landscape .brand-mark { width: 1.7cqw !important; height: 1.7cqw !important; }
</style>
