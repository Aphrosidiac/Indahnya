<script setup lang="ts">
import { Download, Copy, Check, Printer, QrCode, Link2, Images } from 'lucide-vue-next';
import { PageHead, Btn, Card, Tabs, Sk, Alert, useUi } from '~/ui';

definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id } = useCurrentEvent();
const ui = useUi();

type Target = 'hub' | 'gambar';
const target = ref<Target>('hub');
const link = computed(() => ev.value ? `${siteUrl()}/${ev.value.slug}${target.value === 'gambar' ? '/gambar' : ''}` : '');
const svgUrl = computed(() => `/api/events/${id.value}/qr?to=${target.value}`);
const pngUrl = computed(() => `/api/events/${id.value}/qr?to=${target.value}&format=png&size=2048`);

const copied = ref(false);
async function copy() { if (await copyText(link.value)) { copied.value = true; ui.ok('Link dah copy'); setTimeout(() => { copied.value = false; }, 1500); } }

const TEMPLATES = [
  { key: 'a5', label: 'Poster A5', sub: 'Untuk bingkai kat meja tetamu' },
  { key: 'a4', label: 'Poster A4', sub: 'Untuk stand kat pintu masuk' },
  { key: 'tent', label: 'Kad meja', sub: 'A4 lipat dua, 2 kad sekeping' },
] as const;
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="QR & link" sub="Apa yang tetamu scan">
      <Btn v-if="ev" :href="pngUrl" download variant="primary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />PNG</Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <div v-if="!ev" class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3"><div class="card p-5"><Sk h="220px" /></div><div class="card p-5 xl:col-span-2"><Sk w="40%" h="15px" /></div></div>
    <div v-else class="reveal grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
      <Card title="QR" :icon="QrCode">
        <Tabs v-model="target" :items="[{ key: 'hub', label: 'Kad + gambar' }, { key: 'gambar', label: 'Gambar sahaja' }]" class="mb-4" />
        <div class="rounded-md border border-line-100 bg-surface-0 p-5">
          <img :key="svgUrl" :src="svgUrl" alt="QR code" class="reveal-flat mx-auto aspect-square w-full max-w-[260px]" />
        </div>
        <div class="mt-4 flex gap-2">
          <input :value="link" readonly class="field flex-1 text-[13px]" aria-label="Link" @focus="($event.target as HTMLInputElement).select()" />
          <Btn variant="secondary" aria-label="Copy link" @click="copy"><component :is="copied ? Check : Copy" class="size-4" :stroke-width="1.75" /></Btn>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Btn :href="pngUrl" download variant="secondary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />PNG (2048px)</Btn>
          <Btn :href="svgUrl" download variant="secondary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />SVG</Btn>
        </div>
        <p class="mt-3 text-[12px] leading-4 text-ink-500">{{ target === 'hub' ? 'Tetamu buka kad jemputan, dengan tab gambar, ucapan dan RSVP.' : 'Tetamu terus masuk galeri — sesuai kalau kad jemputan dah ada dari tempat lain.' }}</p>
      </Card>

      <div class="space-y-4 xl:col-span-2">
        <Card title="Template untuk print" :icon="Printer" sub="Buka, tekan Print, pilih Save as PDF atau terus ke printer" flush>
          <div class="grid grid-cols-1 divide-y divide-line-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <a v-for="t in TEMPLATES" :key="t.key" :href="`/app/${ev.id}/qr-print?tpl=${t.key}&to=${target}`" target="_blank" rel="noopener"
              class="group flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-surface-50">
              <div class="mx-auto flex aspect-[3/4] w-full max-w-[140px] flex-col items-center justify-center gap-2 rounded-[8px] border border-line-200 bg-surface-0 p-3 shadow-xs transition-transform duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-px">
                <span class="h-1.5 w-2/3 rounded-full bg-ink-900" /><span class="h-1 w-1/2 rounded-full bg-line-200" />
                <img :src="svgUrl" alt="" class="mt-1 w-1/2" />
                <span class="h-1 w-1/2 rounded-full bg-line-200" />
              </div>
              <span><span class="block text-[13px] font-medium leading-5 text-ink-900">{{ t.label }}</span><span class="block text-[12px] leading-4 text-ink-500">{{ t.sub }}</span></span>
            </a>
          </div>
        </Card>

        <Card title="Mana nak letak" :icon="Images" flush>
          <ul class="divide-y divide-line-100 text-[13px] leading-[18px] text-ink-600">
            <li class="px-5 py-3"><span class="font-medium text-ink-900">Setiap meja tetamu</span> — kad meja atau A5 dalam bingkai. Ini yang paling jadi.</li>
            <li class="px-5 py-3"><span class="font-medium text-ink-900">Meja hadiah / pintu masuk</span> — A4 atas stand, supaya tetamu scan masa datang.</li>
            <li class="px-5 py-3"><span class="font-medium text-ink-900">Dalam kad jemputan</span> — QR "Gambar sahaja" kalau kad dari tempat lain, atau share link terus kat group WhatsApp.</li>
            <li class="px-5 py-3"><span class="font-medium text-ink-900">Atas TV</span> — bila slideshow jalan, tetamu nampak gambar naik dan nak ikut.</li>
          </ul>
        </Card>

        <Alert tone="muted"><span class="inline-flex items-center gap-1.5"><Link2 class="size-4" :stroke-width="1.75" aria-hidden="true" />Link pendek sendiri (contoh <span class="font-medium text-ink-900">{{ shortSite() }}/aina-hakim</span>) ada dalam pakej berbayar — tukar kat Tetapan.</span></Alert>
      </div>
    </div>
  </div>
</template>
