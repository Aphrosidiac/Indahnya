<script setup lang="ts">
import SeatSearch from '~/components/guest/SeatSearch.vue';

definePageMeta({ layout: 'bare' });
const { ev, t, lang, displayName, setMeta } = await useGuestEvent();
if (!ev.value.settings.modules.tempat) throw createError({ statusCode: 404, statusMessage: 'Tempat duduk ditutup', fatal: import.meta.client });
setMeta({ title: `${t('tabs.tempat')} · ${displayName.value}` });
</script>

<template>
  <GuestShell :ev="ev" :title="displayName" :t="t">
    <div class="reveal mx-auto max-w-[520px] pt-4">
      <h1 class="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-ink-900">{{ t('tabs.tempat') }}</h1>
      <p class="mt-1 text-[14px] leading-5 text-ink-500">{{ lang === 'en' ? 'Find your table.' : 'Cari nombor meja korang.' }}</p>
      <div class="card mt-4 p-5"><SeatSearch :slug="ev.slug" :locale="lang" /></div>
    </div>
  </GuestShell>
</template>
