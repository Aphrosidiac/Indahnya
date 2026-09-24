<script setup lang="ts">
import RsvpForm from '~/components/guest/RsvpForm.vue';

definePageMeta({ layout: 'bare' });
const { ev, t, lang, displayName, setMeta } = await useGuestEvent();
if (!ev.value.settings.modules.rsvp) throw createError({ statusCode: 404, statusMessage: 'RSVP ditutup', fatal: import.meta.client });
setMeta({ title: `RSVP · ${displayName.value}` });
</script>

<template>
  <GuestShell :ev="ev" :title="displayName" :t="t">
    <div class="reveal mx-auto max-w-[520px] pt-4">
      <h1 class="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-ink-900">{{ lang === 'en' ? 'Will you be there?' : 'RSVP' }}</h1>
      <p class="mt-1 text-[14px] leading-5 text-ink-500">{{ lang === 'en' ? `Let ${displayName} know if you can make it.` : `Maklumkan ${displayName} sama ada korang dapat hadir.` }}</p>
      <div class="card mt-4 p-5"><RsvpForm :slug="ev.slug" :locale="lang" :with-ucapan="ev.settings.modules.ucapan" /></div>
    </div>
  </GuestShell>
</template>
