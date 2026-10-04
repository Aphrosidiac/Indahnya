<script setup lang="ts">
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import { KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';
import { qrArtDataUrl } from '~~/shared/utils/qr-art';
import { Logo } from '~/ui';

/**
 * The table stand: the printed QR guests meet first. Kept simple: the
 * couple's names and date in their kad's own face and colours, one line,
 * the QR, the link. The QR is the branded one (shared/utils/qr-art.ts) in
 * the template's ink, always on a light panel, because a scanner needs
 * contrast more than a theme. `title` and `hashtag` are accepted and unused.
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
const head = computed(() => (props.locale === 'en' ? 'Scan & share your photos of our day' : 'Scan & kongsi gambar majlis kami'));
</script>

<template>
  <div class="stand" :class="[format, `tpl-${template}`]" :style="vars">
    <div class="body">
    <div class="who">
      <p class="names" :class="t.namesCaps && 'caps'">{{ names.a }}<template v-if="names.b">{{ ' ' }}<span class="amp">&amp;</span>{{ ' ' + names.b }}</template></p>
      <p v-if="date" class="date">{{ date }}</p>
    </div>
    <div class="scan">
      <img :src="qr" alt="QR" class="qr">
      <p class="head">{{ head }}</p>
      <p class="link">{{ link }}</p>
    </div>
    </div>
    <Logo :size="12" :wordmark="false" mono inherit class="mark" />
  </div>
</template>

<style scoped>
.stand {
  container-type: inline-size; position: relative; overflow: hidden; box-sizing: border-box; display: flex;
  background: var(--k-bg); color: var(--k-ink); font-family: var(--k-body); text-align: center;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.stand.portrait { aspect-ratio: 1 / 1.414; }
.stand.landscape { aspect-ratio: 1.414 / 1; }
/* sizes are in cqw of the stand: they resolve for the stand's descendants, so everything sits in .body */
.body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6cqw; padding: 9cqw; }
.landscape .body { flex-direction: row; gap: 7cqw; padding: 6cqw 8cqw; }
.landscape .who, .landscape .scan { flex: 1; }
.names { margin: 0; font-family: var(--k-names); font-size: 9.5cqw; line-height: 1.05; color: var(--k-ink); }
.tpl-garden .names { font-size: 11cqw; }
.names.caps { text-transform: uppercase; font-size: 6.4cqw; letter-spacing: .06em; }
.landscape .names { font-size: 6.4cqw; }
.landscape.tpl-garden .names { font-size: 7.4cqw; }
.landscape .names.caps { font-size: 4.4cqw; }
.amp { color: var(--k-accent); }
.date { margin: 2cqw 0 0; font-family: var(--k-heading); font-size: 2.8cqw; letter-spacing: .14em; color: var(--k-muted); }
.landscape .date { font-size: 2cqw; }
.scan { display: flex; flex-direction: column; align-items: center; }
.qr { display: block; width: 52cqw; height: auto; border-radius: 3cqw; background: #fff; padding: 2.4cqw; box-sizing: border-box; }
.tpl-emas .qr { background: var(--k-ink); }
.landscape .qr { width: 32cqw; border-radius: 2cqw; padding: 1.6cqw; }
.head { margin: 4cqw 0 0; font-family: var(--k-heading); font-size: 3.8cqw; line-height: 1.2; color: var(--k-ink); }
.landscape .head { font-size: 2.4cqw; margin-top: 2.6cqw; }
.link { margin: 1.2cqw 0 0; font-family: Inter, sans-serif; font-size: 2.6cqw; font-weight: 600; color: var(--k-muted); }
.landscape .link { font-size: 1.7cqw; }
.mark { position: absolute; bottom: 4cqw; left: 50%; transform: translateX(-50%); width: 2.6cqw !important; height: 2.6cqw !important; color: var(--k-muted); opacity: .7; }
.landscape .mark { bottom: 3cqw; width: 1.8cqw !important; height: 1.8cqw !important; }
</style>
