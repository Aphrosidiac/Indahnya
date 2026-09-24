<script setup lang="ts">
/**
 * A printable sheet. Opens in its own tab; the host prints it (or saves a
 * PDF). Three layouts share one design: the couple's names, one line of
 * instruction in the event's language, the QR, the short link.
 */
definePageMeta({ layout: 'bare', middleware: 'auth' });
const route = useRoute();
const id = route.params.id as string;
const tpl = (route.query.tpl as string) || 'a5';
const to = (route.query.to as string) === 'gambar' ? 'gambar' : 'hub';

const { data: ev } = await useFetch<{ title: string; names: { a: string; b?: string }; slug: string; type: string; date: string | null; settings: { locale: 'ms' | 'en' } }>(`/api/events/${id}`);
const svg = computed(() => `/api/events/${id}/qr?to=${to}`);
const link = computed(() => ev.value ? `${shortSite()}/${ev.value.slug}${to === 'gambar' ? '/gambar' : ''}` : '');
const ms = computed(() => (ev.value?.settings.locale ?? 'ms') === 'ms');
const headline = computed(() => ms.value ? 'Snap & share gambar majlis kami' : 'Snap & share our photos');
const line = computed(() => ms.value ? 'Scan QR ni, upload gambar & video korang. Tak payah download apa-apa.' : 'Scan this QR to upload your photos & videos. Nothing to install.');
const hashtag = computed(() => ev.value ? `#${(ev.value.names.a + (ev.value.names.b ?? '')).normalize('NFKD').replace(/[^a-z0-9]/gi, '')}` : '');
const doPrint = () => window.print();
onMounted(() => { document.title = `Indahnya QR — ${ev.value?.title ?? ''}`; });
</script>

<template>
  <div class="sheet" :class="tpl">
    <div v-for="n in (tpl === 'tent' ? 2 : 1)" :key="n" class="panel">
      <div class="names">{{ ev?.names.a }}<span v-if="ev?.names.b"> &amp; {{ ev.names.b }}</span></div>
      <div v-if="ev?.date" class="date">{{ fmtDate(ev.date, undefined, ev.settings.locale) }}</div>
      <div class="headline">{{ headline }}</div>
      <img :src="svg" alt="QR" class="qr" />
      <div class="link">{{ link }}</div>
      <div class="line">{{ line }}</div>
      <div class="foot"><span>{{ hashtag }}</span><span>indahnya.my</span></div>
    </div>
  </div>
  <button type="button" class="print" @click="doPrint">Print</button>
</template>

<style scoped>
.sheet { font-family: Inter, -apple-system, sans-serif; color: #1a1a1a; background: #fff; margin: 0 auto; box-sizing: border-box; display: flex; }
.a5 { width: 148mm; height: 210mm; }
.a4 { width: 210mm; height: 297mm; }
.tent { width: 210mm; height: 297mm; flex-direction: column; }
.panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 12mm; box-sizing: border-box; }
.tent .panel { border-bottom: 1px dashed #bdbdbd; }
.tent .panel:last-child { border-bottom: 0; transform: rotate(180deg); }
.names { font-size: 22pt; font-weight: 600; letter-spacing: -0.02em; }
.a4 .names { font-size: 30pt; }
.date { margin-top: 2mm; font-size: 11pt; color: #767676; }
.headline { margin-top: 10mm; font-size: 14pt; font-weight: 500; }
.a4 .headline { font-size: 18pt; }
.qr { width: 70mm; height: 70mm; margin-top: 6mm; }
.a4 .qr { width: 100mm; height: 100mm; }
.tent .qr { width: 55mm; height: 55mm; }
.link { margin-top: 5mm; font-size: 13pt; font-weight: 600; }
.line { margin-top: 3mm; max-width: 95mm; font-size: 10pt; line-height: 1.45; color: #5c5c5c; }
.foot { margin-top: 10mm; display: flex; gap: 6mm; font-size: 9pt; color: #9a9a9a; }
.print { position: fixed; right: 16px; top: 16px; height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: #424242; color: #fff; font: 500 14px Inter, sans-serif; cursor: pointer; }
@media print {
  .print { display: none; }
  .sheet { margin: 0; }
  :global(body) { margin: 0; background: #fff; }
}
@page { margin: 0; }
</style>
