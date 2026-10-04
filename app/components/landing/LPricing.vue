<script setup lang="ts">
import { Check, ArrowRight } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';

/**
 * One payment per event. Three columns, the middle one in ink; each card's
 * top is a lace edge (the scallop of a printed kad). Every plan starts the
 * same way, free, so there is one button under the three, not three.
 */
defineProps<{ L: LandingCopy }>();
</script>

<template>
  <section id="harga" class="l-wrap scroll-mt-24 py-20 md:py-28">
    <div class="max-w-[720px]">
      <h2 class="l-h2">{{ L.pricing.title }}</h2>
      <p class="l-lead mt-6">{{ L.pricing.body }}</p>
    </div>

    <div class="mt-12 grid grid-cols-1 items-stretch gap-4 md:mt-16 lg:grid-cols-3">
      <div v-for="p in L.pricing.plans" :key="p.name" class="plan relative flex flex-col rounded-b-[28px] px-6 pb-8 pt-10 md:px-8" :class="p.hot ? 'is-hot bg-[#1a1a1a] text-[#f3f1ee] lg:-my-4 lg:pt-14' : 'bg-[#fdfcfb] text-[#1a1a1a]'">
        <svg class="absolute inset-x-0 -top-[11px] h-3 w-full" preserveAspectRatio="none" aria-hidden="true"><defs><pattern :id="`sc-${p.price}`" width="22" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 Q5.5 0 11 12 Q16.5 0 22 12 Z" :fill="p.hot ? '#1a1a1a' : '#fdfcfb'" /></pattern></defs><rect width="100%" height="12" :fill="`url(#sc-${p.price})`" /></svg>
        <div class="flex items-center justify-between gap-3">
          <p class="text-[17px] font-semibold">{{ p.name }}</p>
          <span class="l-chip" :class="p.hot ? 'bg-[#7dd56f] text-[#1a1a1a]' : 'bg-[#ebe8e5] text-[#1a1a1a]'">{{ p.tag }}</span>
        </div>
        <p class="mt-8 flex items-baseline gap-1">
          <span class="text-[22px] font-semibold" :class="p.hot ? 'text-[#b9b6b1]' : 'text-[#55524f]'">RM</span>
          <span class="l-display text-[88px] tabular-nums">{{ p.price }}</span>
        </p>
        <p class="text-[14px]" :class="p.hot ? 'text-[#b9b6b1]' : 'text-[#55524f]'">{{ p.price === '0' ? L.pricing.free : L.pricing.once }}</p>
        <ul class="mt-8 space-y-3 border-t pt-6 text-[15px] leading-[1.45]" :class="p.hot ? 'border-white/10 text-[#e4e1dc]' : 'border-[#1a1a1a]/10 text-[#55524f]'" role="list">
          <li v-for="r in p.rows" :key="r" class="flex items-start gap-2.5"><Check class="mt-0.5 size-[18px] shrink-0" :class="p.hot ? 'text-[#7dd56f]' : 'text-[#27622a]'" :stroke-width="2.25" aria-hidden="true" />{{ r }}</li>
        </ul>
      </div>
    </div>

    <div class="mt-14 flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
      <p class="max-w-[52ch] text-[15px] leading-[1.55] text-[#55524f]">{{ L.pricing.note }}</p>
      <NuxtLink to="/app?new=1" class="l-btn l-btn-go shrink-0">{{ L.cta }}<ArrowRight class="size-[18px]" :stroke-width="2" aria-hidden="true" /></NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.plan { box-shadow: 0 30px 60px -44px rgb(60 48 36 / .4); }
.plan.is-hot { box-shadow: 0 40px 80px -40px rgb(26 26 26 / .6); }
</style>
