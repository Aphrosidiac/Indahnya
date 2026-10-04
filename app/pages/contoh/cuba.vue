<script setup lang="ts">
import { ImagePlus, Camera, Check, Loader2, AlertCircle, ArrowRight, Monitor } from 'lucide-vue-next';
import { Logo } from '~/ui';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import { useUploader } from '~/composables/useUploader';

/**
 * What a visitor's phone opens after scanning the QR on the landing's TV.
 * It joins the phone to that browser's sandbox visitor (the token in `k`),
 * then it is a guest's upload page in miniature: an optional name for the
 * screen, pick or shoot, watch it go. The photo lands on the landing's TV.
 */
definePageMeta({ layout: 'bare' });
useSeoMeta({ robots: 'noindex, nofollow', title: 'Cuba Indahnya' });

const route = useRoute();
const en = computed(() => route.query.lang === 'en');
const T = computed(() => en.value
  ? { hi: 'Try Indahnya', lead: 'Send a photo to the screen you just scanned. Only you will see it, and it is deleted within the hour.', name: 'Your name, for the screen', namePh: 'e.g. Aunty Ros', pick: 'Choose a photo', shoot: 'Take one now', sending: 'Sending', ready: 'On the screen', failed: 'Did not go through', done: 'Look at the screen!', more: 'Send another', expired: 'This QR has expired', expiredBody: 'Refresh the page on your computer and scan the new QR.', own: 'Make it your own event', ownBody: 'This is exactly what your guests will do. Free to start.', cta: 'Create your event free', desk: 'On a computer? The landing page has the screen.' }
  : { hi: 'Cuba Indahnya', lead: 'Hantar satu gambar ke skrin yang korang scan tadi. Hanya korang yang nampak, dan kami padam dalam sejam.', name: 'Nama korang, untuk skrin', namePh: 'contoh Makcik Ros', pick: 'Pilih gambar', shoot: 'Snap terus', sending: 'Tengah hantar', ready: 'Dah naik skrin', failed: 'Tak berjaya', done: 'Tengok skrin tu!', more: 'Hantar lagi', expired: 'QR ni dah tamat', expiredBody: 'Refresh page kat komputer tu dan scan QR yang baru.', own: 'Buat majlis sendiri', ownBody: 'Macam ni la tetamu korang buat nanti. Percuma untuk mula.', cta: 'Buat majlis percuma', desk: 'Guna komputer? Skrin ada kat laman utama.' });

const k = computed(() => (typeof route.query.k === 'string' ? route.query.k : ''));
const state = ref<'joining' | 'ready' | 'expired'>('joining');
const slug = ref('_cuba');
const name = ref('');
const up = useUploader(() => slug.value);
const roll = ref<HTMLInputElement>();
const cam = ref<HTMLInputElement>();

onMounted(async () => {
  if (!k.value) { state.value = 'expired'; return; }
  try {
    const r = await $fetch<{ slug: string; name: string | null }>('/api/cuba', { method: 'POST', body: { k: k.value } });
    slug.value = r.slug; name.value = r.name ?? ''; state.value = 'ready';
  } catch { state.value = 'expired'; }
});

let saved = '';
async function saveName() {
  const v = name.value.trim();
  if (v === saved) return;
  saved = v;
  await $fetch(`/api/g/${slug.value}/name`, { method: 'POST', body: { name: v } }).catch(() => {});
}
async function onFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files?.length) return;
  await saveName();
  up.add(Array.from(files).slice(0, 6));
  (e.target as HTMLInputElement).value = '';
}
const anyDone = computed(() => up.done.value > 0);
</script>

<template>
  <div class="min-h-[100dvh] bg-[#f6f4f3] text-[#1a1a1a]">
    <div class="mx-auto flex min-h-[100dvh] max-w-[460px] flex-col px-5 pb-8 pt-6">
      <NuxtLink to="/" class="self-start"><Logo :size="28" /></NuxtLink>

      <div v-if="state === 'expired'" class="my-auto py-10">
        <span class="grid size-12 place-items-center rounded-full bg-[#fde8e6] text-[#b42318]"><AlertCircle class="size-6" :stroke-width="2" /></span>
        <h1 class="mt-5 text-[34px] font-[640] leading-[1] tracking-[-0.04em] [font-family:'Bricolage_Grotesque_Variable',Inter,sans-serif]">{{ T.expired }}</h1>
        <p class="mt-3 text-[16px] leading-[1.55] text-[#55524f]">{{ T.expiredBody }}</p>
        <NuxtLink to="/" class="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#1a1a1a] px-6 text-[15px] font-semibold text-white"><Monitor class="size-4" :stroke-width="2" />indahnya.my</NuxtLink>
      </div>

      <template v-else>
        <h1 class="mt-10 text-[44px] font-[640] leading-[.95] tracking-[-0.045em] [font-family:'Bricolage_Grotesque_Variable',Inter,sans-serif]">{{ T.hi }}</h1>
        <p class="mt-3 text-[16px] leading-[1.55] text-[#55524f]">{{ T.lead }}</p>

        <label class="mt-8 block">
          <span class="mb-2 block text-[14px] font-semibold">{{ T.name }}</span>
          <input v-model="name" type="text" maxlength="60" autocomplete="name" :placeholder="T.namePh" class="h-12 w-full rounded-[14px] border border-[#d9d5d1] bg-white px-4 text-[16px] outline-none transition focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,.1)]" @blur="saveName" @keydown.enter="($event.target as HTMLInputElement).blur()">
        </label>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button type="button" class="flex h-[120px] flex-col items-center justify-center gap-2 rounded-[20px] bg-[#7dd56f] text-[15px] font-semibold text-[#1a1a1a] transition active:scale-[.98] disabled:opacity-50" :disabled="state !== 'ready'" @click="roll?.click()">
            <ImagePlus class="size-7" :stroke-width="1.75" />{{ T.pick }}
          </button>
          <button type="button" class="flex h-[120px] flex-col items-center justify-center gap-2 rounded-[20px] bg-[#1a1a1a] text-[15px] font-semibold text-white transition active:scale-[.98] disabled:opacity-50" :disabled="state !== 'ready'" @click="cam?.click()">
            <Camera class="size-7" :stroke-width="1.75" />{{ T.shoot }}
          </button>
        </div>
        <input ref="roll" type="file" accept="image/*" multiple class="sr-only" tabindex="-1" aria-hidden="true" @change="onFiles">
        <input ref="cam" type="file" accept="image/*" capture="environment" class="sr-only" tabindex="-1" aria-hidden="true" @change="onFiles">

        <ul v-if="up.items.value.length" class="mt-6 space-y-2" role="list">
          <li v-for="it in up.items.value" :key="it.key" class="flex items-center gap-3 rounded-[16px] bg-white p-2.5 pr-4">
            <img v-if="it.preview || it.thumb" :src="it.thumb || it.preview!" alt="" class="size-12 shrink-0 rounded-[10px] object-cover">
            <span v-else class="size-12 shrink-0 rounded-[10px] bg-[#ebe8e5]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[14px] font-medium">{{ it.state === 'ready' ? T.ready : it.state === 'failed' ? (it.error || T.failed) : T.sending }}</span>
              <span v-if="it.state !== 'ready' && it.state !== 'failed'" class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#ebe8e5]"><span class="block h-full rounded-full bg-[#3d8f39] transition-[width]" :style="{ width: `${it.state === 'processing' ? 100 : it.pct}%` }" /></span>
            </span>
            <Check v-if="it.state === 'ready'" class="size-5 text-[#3d8f39]" :stroke-width="2.5" />
            <AlertCircle v-else-if="it.state === 'failed'" class="size-5 text-[#b42318]" :stroke-width="2" />
            <Loader2 v-else class="size-5 animate-spin text-[#75716d]" :stroke-width="2" />
          </li>
        </ul>
        <p v-if="anyDone" class="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-[#27622a]">{{ T.done }}</p>

        <div class="mt-auto pt-12">
          <div class="rounded-[24px] bg-white p-5">
            <p class="text-[18px] font-semibold tracking-[-0.02em]">{{ T.own }}</p>
            <p class="mt-1 text-[15px] leading-[1.5] text-[#55524f]">{{ T.ownBody }}</p>
            <NuxtLink to="/app?new=1" class="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-[#7dd56f] px-5 text-[15px] font-semibold text-[#1a1a1a]">{{ T.cta }}<ArrowRight class="size-4" :stroke-width="2" /></NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
