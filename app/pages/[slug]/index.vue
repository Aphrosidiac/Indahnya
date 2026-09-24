<script setup lang="ts">
import { Images, MapPin, Navigation, CalendarDays, ArrowRight } from 'lucide-vue-next';
import { Btn } from '~/ui';
import type { KadView as KadViewData } from '~~/shared/utils/kad-view';
import KadView from '~/components/kad/KadView.vue';

/**
 * The majlis link. With the kad module on (the default) it IS the e-kad;
 * with it off — a couple whose invitation lives on another platform — it is
 * the plain hub: the day, the place, the door into the gallery.
 */
definePageMeta({ layout: 'bare' });
const { ev, t, lang, displayName, ready, setMeta } = await useGuestEvent();
const { data: k } = await useFetch<{ kad: KadViewData; ogUrl: string | null; enabled: boolean }>(() => `/api/g/${ev.value.slug}/kad`, { key: `kad:${ev.value.slug}` });
const when = ev.value.date ? fmtDate(ev.value.date, undefined, lang.value) : '';
const kadOn = computed(() => !!k.value?.enabled && !!k.value.kad);
setMeta({
  title: kadOn.value ? `${k.value!.kad.title} · ${displayName.value}` : `${displayName.value} · Indahnya`,
  description: [typeName(ev.value.type, lang.value), when, ev.value.venue.name].filter(Boolean).join(' · '),
  image: k.value?.ogUrl,
});
const toGambar = computed(() => `/${ev.value.slug}/gambar`);
</script>

<template>
  <KadView v-if="kadOn" :view="k!.kad" :ready="ready" />

  <GuestShell v-else :ev="ev" :title="displayName" :t="t">
    <div class="reveal mx-auto max-w-[520px] pt-6">
      <div class="card overflow-hidden">
        <div class="bg-callout-green px-6 pb-6 pt-8 text-center">
          <p class="text-[12px] font-medium leading-4 text-success-700">{{ typeName(ev.type, lang) }}</p>
          <h1 class="mt-2 text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink-900">{{ ev.names.a }}<span v-if="ev.names.b" class="block text-[16px] font-medium text-ink-600">&amp;</span><span v-if="ev.names.b" class="block">{{ ev.names.b }}</span></h1>
        </div>
        <div class="divide-y divide-line-100">
          <div v-if="ev.date" class="flex items-center gap-3 px-5 py-4">
            <span class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-ink-700 text-white"><CalendarDays class="size-[17px]" :stroke-width="1.75" aria-hidden="true" /></span>
            <span class="text-[14px] leading-5 text-ink-900">{{ fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, lang) }}</span>
          </div>
          <div v-if="ev.venue.name || ev.venue.address" class="px-5 py-4">
            <div class="flex items-start gap-3">
              <span class="grid size-8 shrink-0 place-items-center rounded-[9px] bg-ink-700 text-white"><MapPin class="size-[17px]" :stroke-width="1.75" aria-hidden="true" /></span>
              <span class="min-w-0"><span class="block text-[14px] font-medium leading-5 text-ink-900">{{ ev.venue.name }}</span><span v-if="ev.venue.address" class="block whitespace-pre-line text-[13px] leading-[18px] text-ink-500">{{ ev.venue.address }}</span></span>
            </div>
            <div v-if="ev.venue.waze || ev.venue.gmaps" class="mt-3 flex gap-2 pl-11">
              <Btn v-if="ev.venue.waze" :href="ev.venue.waze" target="_blank" variant="secondary" size="sm"><Navigation class="size-4" :stroke-width="1.75" aria-hidden="true" />Waze</Btn>
              <Btn v-if="ev.venue.gmaps" :href="ev.venue.gmaps" target="_blank" variant="secondary" size="sm"><MapPin class="size-4" :stroke-width="1.75" aria-hidden="true" />Google Maps</Btn>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink v-if="ev.settings.modules.gambar" :to="toGambar" class="card mt-4 flex items-center gap-3 p-4 transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:shadow-md">
        <span class="grid size-11 shrink-0 place-items-center rounded-[12px] bg-primary-400 text-ink-900"><Images class="size-5" :stroke-width="1.75" aria-hidden="true" /></span>
        <span class="min-w-0 flex-1">
          <span class="block text-[15px] font-semibold leading-5 text-ink-900">{{ ev.uploadsOpen ? t('gallery.upload') : t('gallery.title') }}</span>
          <span class="block text-[13px] leading-[18px] text-ink-500">{{ ready ? t('hub.photos', { n: ready }) : t('gallery.upload.sub') }}</span>
        </span>
        <ArrowRight class="size-5 shrink-0 text-ink-400" :stroke-width="1.75" aria-hidden="true" />
      </NuxtLink>
    </div>
  </GuestShell>
</template>
