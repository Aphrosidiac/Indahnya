<script setup lang="ts">
import { Images, MapPin, Navigation, CalendarDays, ArrowRight } from 'lucide-vue-next';
import { Btn } from '~/ui';

/**
 * The hub. Phase A: the essentials of a kad — names, date, venue with Waze
 * and Google Maps, and the door into the gallery. Phase C replaces this with
 * the full e-kad (templates, aturcara, salam kaut, music) on the same route.
 */
definePageMeta({ layout: 'bare' });
const { ev, t, displayName, ready, setMeta } = await useGuestEvent();
setMeta({ title: `${displayName.value} · Indahnya`, description: ev.value.venue.name ? `${fmtDate(ev.value.date)} · ${ev.value.venue.name}` : fmtDate(ev.value.date) });
const toGambar = computed(() => `/${ev.value.slug}/gambar`);
</script>

<template>
  <GuestShell :ev="ev" :title="displayName" :t="t">
    <div class="reveal mx-auto max-w-[520px] pt-6">
      <div class="card overflow-hidden">
        <div class="bg-callout-green px-6 pb-6 pt-8 text-center">
          <p class="text-[12px] font-medium leading-4 text-success-700">{{ typeName(ev.type) }}</p>
          <h1 class="mt-2 text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink-900">{{ ev.names.a }}<span v-if="ev.names.b" class="block text-[16px] font-medium text-ink-600">&amp;</span><span v-if="ev.names.b" class="block">{{ ev.names.b }}</span></h1>
        </div>
        <div class="divide-y divide-line-100">
          <div v-if="ev.date" class="flex items-center gap-3 px-5 py-4">
            <span class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-ink-700 text-white"><CalendarDays class="size-[17px]" :stroke-width="1.75" aria-hidden="true" /></span>
            <span class="text-[14px] leading-5 text-ink-900">{{ fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
          <div v-if="ev.venue.name || ev.venue.address" class="px-5 py-4">
            <div class="flex items-start gap-3">
              <span class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-ink-700 text-white"><MapPin class="size-[17px]" :stroke-width="1.75" aria-hidden="true" /></span>
              <span class="min-w-0"><span class="block text-[14px] font-medium leading-5 text-ink-900">{{ ev.venue.name }}</span><span v-if="ev.venue.address" class="block text-[13px] leading-[18px] text-ink-500">{{ ev.venue.address }}</span></span>
            </div>
            <div v-if="ev.venue.waze || ev.venue.gmaps" class="mt-3 flex gap-2 pl-11">
              <a v-if="ev.venue.waze" :href="ev.venue.waze" target="_blank" rel="noopener"><Btn variant="secondary" size="sm"><Navigation class="size-4" :stroke-width="1.75" aria-hidden="true" />Waze</Btn></a>
              <a v-if="ev.venue.gmaps" :href="ev.venue.gmaps" target="_blank" rel="noopener"><Btn variant="secondary" size="sm"><MapPin class="size-4" :stroke-width="1.75" aria-hidden="true" />Google Maps</Btn></a>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink v-if="ev.settings.modules.gambar" :to="toGambar" class="card mt-4 flex items-center gap-3 p-4 transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:shadow-md">
        <span class="grid size-11 shrink-0 place-items-center rounded-[12px] bg-primary-400 text-ink-900"><Images class="size-5" :stroke-width="1.75" aria-hidden="true" /></span>
        <span class="min-w-0 flex-1">
          <span class="block text-[15px] font-semibold leading-5 text-ink-900">{{ t('gallery.upload') }}</span>
          <span class="block text-[13px] leading-[18px] text-ink-500">{{ ready ? `${ready} ${t('tabs.gambar').toLowerCase()}` : t('gallery.upload.sub') }}</span>
        </span>
        <ArrowRight class="size-5 shrink-0 text-ink-400" :stroke-width="1.75" aria-hidden="true" />
      </NuxtLink>
    </div>
  </GuestShell>
</template>
