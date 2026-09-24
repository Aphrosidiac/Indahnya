<script setup lang="ts">
import type { NuxtError } from '#app';
import { Btn, Logo } from '~/ui';

/**
 * Every error lands here, in the product's own language — a guest who
 * mistypes a link on a phone at a wedding should see a way back, not a stack.
 */
const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);
useSeoMeta({ title: () => (notFound.value ? 'Tak jumpa · Indahnya' : 'Ada masalah · Indahnya'), robots: 'noindex' });
const home = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-surface-50 px-4 py-12">
    <div class="w-full max-w-[420px] text-center">
      <div class="mb-7 flex justify-center"><Logo :size="30" /></div>
      <div class="card p-7">
        <p class="num text-[13px] font-medium text-ink-400">{{ error.statusCode }}</p>
        <h1 class="mt-1 text-[20px] font-semibold leading-7 text-ink-900">{{ notFound ? 'Link ni tak jumpa' : 'Ada masalah sekejap' }}</h1>
        <p class="mt-2 text-[14px] leading-5 text-ink-600">
          <template v-if="notFound">Check semula ejaan link, atau minta link baru dari tuan majlis. Galeri yang dah tamat tempoh simpanan juga tak boleh dibuka lagi.</template>
          <template v-else>Cuba refresh. Kalau masih jadi, WhatsApp kami — kami tengok terus.</template>
        </p>
        <p class="mt-1 text-[13px] leading-5 text-ink-500">{{ notFound ? 'This link was not found.' : 'Something went wrong — please try again.' }}</p>
        <div class="mt-6 flex justify-center gap-2">
          <Btn variant="primary" @click="home">Ke laman utama</Btn>
          <Btn v-if="!notFound" variant="secondary" href="https://wa.me/60139078719" target="_blank">WhatsApp</Btn>
        </div>
      </div>
    </div>
  </div>
</template>
