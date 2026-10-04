<script setup lang="ts">
import QrStand from '~/components/print/QrStand.vue';
import { isKadTemplate, type KadTemplate } from '~~/shared/utils/kad-templates';

/**
 * A printable sheet. Opens in its own tab; the host prints it (or saves a
 * PDF). One stand design (components/print/QrStand.vue) dressed in the
 * couple's kad template: A5 and A4 posters, and the folded table card (two
 * landscape halves of an A4, the top one upside down so both face out).
 * `?t=` tries another template without changing the kad.
 */
definePageMeta({ layout: 'bare', middleware: 'auth' });
const route = useRoute();
const id = route.params.id as string;
const tpl = (route.query.tpl as string) || 'a5';
const to = (route.query.to as string) === 'gambar' ? 'gambar' : 'hub';

const { data: ev } = await useFetch<{ title: string; names: { a: string; b?: string }; slug: string; type: string; date: string | null; settings: { locale: 'ms' | 'en' } }>(`/api/events/${id}`);
const { data: kad } = await useFetch<{ template: string; fields: { title?: string }; defaults: { title: string } }>(`/api/events/${id}/kad`);
const template = computed<KadTemplate>(() => (isKadTemplate(route.query.t) ? route.query.t : isKadTemplate(kad.value?.template) ? kad.value!.template as KadTemplate : 'garden'));
const path = computed(() => ev.value ? `/${ev.value.slug}${to === 'gambar' ? '/gambar' : ''}` : '');
const url = computed(() => `${siteUrl()}${path.value}`);
const link = computed(() => `${shortSite()}${path.value}`);
const locale = computed(() => ev.value?.settings.locale ?? 'ms');
const title = computed(() => kad.value?.fields.title ?? kad.value?.defaults.title ?? '');
const date = computed(() => (ev.value?.date ? fmtDate(ev.value.date, { day: 'numeric', month: 'long', year: 'numeric' }, locale.value) : ''));
const hashtag = computed(() => ev.value ? `#${(ev.value.names.a + (ev.value.names.b ?? '')).normalize('NFKD').replace(/[^a-z0-9]/gi, '')}` : '');
const doPrint = () => window.print();
onMounted(() => { document.title = `Indahnya QR · ${ev.value?.title ?? ''}`; });
</script>

<template>
  <div v-if="ev" class="sheet" :class="tpl">
    <QrStand
      v-for="n in (tpl === 'tent' ? 2 : 1)" :key="n" class="stand"
      :url="url" :link="link" :template="template" :format="tpl === 'tent' ? 'landscape' : 'portrait'"
      :names="ev.names" :title="title" :date="date" :hashtag="hashtag" :locale="locale"
    />
  </div>
  <button type="button" class="print" @click="doPrint">Print</button>
</template>

<style scoped>
.sheet { margin: 24px auto; box-sizing: border-box; display: flex; flex-direction: column; background: #fff; box-shadow: 0 10px 40px -20px rgb(0 0 0 / .4); }
.a5 { width: 148mm; height: 210mm; }
.a4 { width: 210mm; height: 297mm; }
.tent { width: 210mm; height: 297mm; }
.stand { width: 100%; }
.a5 .stand, .a4 .stand { height: 100%; }
.tent .stand { height: 50%; }
.tent .stand:first-child { transform: rotate(180deg); border-bottom: 1px dashed #bdbdbd; }
.print { position: fixed; right: 16px; top: 16px; height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: #424242; color: #fff; font: 500 14px Inter, sans-serif; cursor: pointer; }
@media print {
  .print { display: none; }
  .sheet { margin: 0; box-shadow: none; }
  :global(body) { margin: 0; background: #fff; }
}
@page { margin: 0; }
</style>
