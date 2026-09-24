<script setup lang="ts">
import UcapanBox from '~/components/guest/UcapanBox.vue';

definePageMeta({ layout: 'bare' });
const { ev, me, t, lang, displayName, setMeta } = await useGuestEvent();
if (!ev.value.settings.modules.ucapan) throw createError({ statusCode: 404, statusMessage: 'Ucapan ditutup', fatal: import.meta.client });
setMeta({ title: `${t('tabs.ucapan')} · ${displayName.value}` });
</script>

<template>
  <GuestShell :ev="ev" :title="displayName" :t="t">
    <div class="reveal mx-auto max-w-[560px] pt-4">
      <h1 class="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-ink-900">{{ t('tabs.ucapan') }}</h1>
      <p class="mt-1 text-[14px] leading-5 text-ink-500">{{ lang === 'en' ? 'Leave a wish — write it, or say it.' : 'Tinggalkan ucapan — tulis, atau rakam suara.' }}</p>
      <div class="mt-4"><UcapanBox :slug="ev.slug" :locale="lang" :show-form="!ev.demo" :guest-name="me?.name" /></div>
    </div>
  </GuestShell>
</template>
