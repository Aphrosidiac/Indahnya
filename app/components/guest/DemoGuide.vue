<script setup lang="ts">
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-vue-next';
import { Logo } from '~/ui';
import type { GuestEvent } from '~/composables/useGuestEvent';

/**
 * The sample majlis' guide: a bar across the top of every sample page (the
 * kad included) that says where the visitor is, what that page is for, and
 * where to go next. A visitor from the landing walks the kad, the gallery,
 * the wishes, the RSVP and the seats in order, and ends on "make your own".
 *
 * Fixed, so the kad's full-screen cover keeps it; `html.has-demo` sets
 * --demo-h, which the kad and GuestShell use to sit below it.
 */
const props = defineProps<{ ev: GuestEvent }>();
const route = useRoute();
const en = computed(() => props.ev.settings.locale === 'en');
const C = computed(() => (en.value
  ? {
      sample: 'Sample', home: 'Back to Indahnya', make: 'Make your own', makeShort: 'Make yours', next: 'Next', prev: 'Back',
      steps: {
        kad: ['Invitation card', 'The link you send. Guests open it before the day.'],
        gambar: ['Photo gallery', 'Guests scan the table QR and their photos land here.'],
        ucapan: ['Wishes', 'Written and voice wishes from your guests.'],
        rsvp: ['RSVP', 'Guests confirm. You see the count straight away.'],
        tempat: ['Seating', 'Guests type their name and get their table.'],
      },
    }
  : {
      sample: 'Contoh', home: 'Balik ke Indahnya', make: 'Buat majlis sendiri', makeShort: 'Buat sendiri', next: 'Seterusnya', prev: 'Sebelum',
      steps: {
        kad: ['Kad jemputan', 'Link yang korang hantar. Tetamu buka sebelum majlis.'],
        gambar: ['Galeri gambar', 'Tetamu scan QR kat meja, gambar terus masuk sini.'],
        ucapan: ['Ucapan', 'Ucapan bertulis dan rakaman suara dari tetamu.'],
        rsvp: ['RSVP', 'Tetamu sahkan hadir. Korang nampak jumlah terus.'],
        tempat: ['Tempat duduk', 'Tetamu taip nama, terus dapat nombor meja.'],
      },
    }));
const base = computed(() => `/${props.ev.slug}`);
const steps = computed(() => (['kad', 'gambar', 'ucapan', 'rsvp', 'tempat'] as const)
  .filter(k => props.ev.settings.modules[k] && isBuilt(k))
  .map(k => ({ key: k, to: k === 'kad' ? base.value : `${base.value}/${k}`, title: C.value.steps[k][0], what: C.value.steps[k][1] })));
const i = computed(() => Math.max(0, steps.value.findIndex(s => s.to === route.path.replace(/\/$/, ''))));
const here = computed(() => steps.value[i.value]!);
const prev = computed(() => steps.value[i.value - 1]);
const next = computed(() => steps.value[i.value + 1]);
useHead({ htmlAttrs: { class: 'has-demo' } });
</script>

<template>
  <div class="demo-guide fixed inset-x-0 top-0 z-[75] border-b border-black/10 bg-[#1a1a1a] text-[#f3f1ee]" role="region" :aria-label="C.sample">
    <div class="mx-auto flex h-full max-w-[1100px] items-center gap-3 px-4">
      <NuxtLink to="/" class="shrink-0 rounded-[8px] p-1 text-[#f3f1ee] hover:bg-white/10" :aria-label="C.home"><Logo :size="20" :wordmark="false" inherit /></NuxtLink>
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 text-[14px] font-semibold leading-5">
          <span class="rounded-full bg-[#7dd56f] px-2 py-px text-[11px] font-semibold uppercase tracking-[.06em] text-[#1a1a1a]">{{ C.sample }}</span>
          <span class="tabular-nums text-white/55 max-sm:hidden">{{ i + 1 }}/{{ steps.length }}</span>
          <span class="truncate">{{ here.title }}</span>
        </p>
        <p class="text-[12.5px] leading-[17px] text-white/70 max-sm:line-clamp-2 sm:truncate">{{ here.what }}</p>
      </div>
      <NuxtLink v-if="prev" :to="prev.to" class="grid size-9 shrink-0 max-sm:!hidden place-items-center rounded-full bg-white/10 hover:bg-white/15" :aria-label="`${C.prev}: ${prev.title}`"><ChevronLeft class="size-4" :stroke-width="2" /></NuxtLink>
      <NuxtLink v-if="next" :to="next.to" class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/10 pl-2.5 pr-3 text-[13px] font-semibold hover:bg-white/15 max-sm:size-9 max-sm:justify-center max-sm:p-0" :aria-label="`${C.next}: ${next.title}`">
        <span class="max-sm:hidden">{{ C.next }}: {{ next.title }}</span><ChevronRight class="size-4" :stroke-width="2" aria-hidden="true" />
      </NuxtLink>
      <NuxtLink to="/app?new=1" class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#7dd56f] px-3.5 text-[13px] font-semibold text-[#1a1a1a] hover:bg-[#8fe082]" :class="next && 'max-sm:hidden'">
        <span class="max-sm:hidden">{{ C.make }}</span><span class="sm:hidden">{{ C.makeShort }}</span><ArrowRight class="size-4" :stroke-width="2" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style>
html.has-demo { --demo-h: 60px; }
@media (max-width: 639px) { html.has-demo { --demo-h: 70px; } } /* the explainer may take two lines */
.demo-guide { height: var(--demo-h); }
</style>
