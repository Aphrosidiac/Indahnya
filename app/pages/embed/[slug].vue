<script setup lang="ts">
import { Camera, ArrowUpRight } from 'lucide-vue-next';
import { Logo } from '~/ui';

/**
 * The gallery as a widget, for a couple whose e-kad lives on another
 * platform (Jemputan.me, SayaKahwin…): paste one <iframe> and their card
 * shows the latest guest photos with an upload button. Every link opens the
 * real gallery in the top window — a phone's file picker inside someone
 * else's iframe is a fight nobody wins.
 *
 * Framing is allowed for /embed/** only (nuxt.config routeRules).
 */
definePageMeta({ layout: 'bare' });
const { slug, ev, t, displayName, ready, setMeta } = await useGuestEvent();
setMeta({ title: `${t('gallery.title')} · ${displayName.value}` });
const { data } = await useFetch<{ items: { id: string; thumb: string | null; poster: string | null; url: string; kind: string }[] }>(() => `/api/g/${slug.value}/media`, { query: { limit: 6 }, key: `embed:${slug.value}` });
const site = useRuntimeConfig().public.siteUrl;
const gallery = computed(() => `${site}/${ev.value.slug}/gambar`);
</script>

<template>
  <div class="min-h-screen bg-surface-0 p-3 text-ink-900">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-[15px] font-semibold leading-5">{{ t('gallery.title') }}</p>
        <p class="truncate text-[12px] leading-4 text-ink-500">{{ displayName }}<template v-if="ready"> · {{ t('hub.photos', { n: ready }) }}</template></p>
      </div>
      <a :href="gallery" target="_top" class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-400 px-3.5 text-[13px] font-medium text-ink-900 transition-colors hover:bg-primary-500">
        <Camera class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ ev.uploadsOpen ? t('gallery.upload') : t('gallery.title') }}
      </a>
    </div>
    <div v-if="data?.items.length" class="mt-3 grid grid-cols-3 gap-1">
      <a v-for="m in data.items" :key="m.id" :href="gallery" target="_top" class="aspect-square overflow-hidden rounded-[8px] bg-sand" :aria-label="t('gallery.photo')">
        <img :src="m.thumb ?? m.poster ?? m.url" alt="" class="size-full object-cover" loading="lazy" />
      </a>
    </div>
    <a v-else :href="gallery" target="_top" class="mt-3 grid h-28 place-items-center rounded-[10px] border border-dashed border-line-200 text-center text-[13px] text-ink-500">
      <span>{{ t('gallery.empty.sub') }}</span>
    </a>
    <a :href="gallery" target="_top" class="mt-3 flex items-center justify-between text-[12px] text-ink-500 hover:text-ink-900">
      <span class="inline-flex items-center gap-1.5"><Logo :size="14" :wordmark="false" />Indahnya</span>
      <span class="inline-flex items-center gap-1">{{ t('gallery.all') }}<ArrowUpRight class="size-3.5" :stroke-width="2" aria-hidden="true" /></span>
    </a>
  </div>
</template>
