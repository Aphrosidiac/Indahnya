<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import type { LandingCopy } from '~/composables/useLanding';

defineProps<{ L: LandingCopy }>();
const open = ref<number | null>(0);
</script>

<template>
  <section id="soalan" class="l-wrap scroll-mt-24 py-20 md:py-28">
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
      <h2 class="l-h2 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">{{ L.faq.title }}</h2>
      <div class="lg:col-span-7">
        <div v-for="(f, i) in L.faq.items" :key="f.q" class="border-b border-[#1a1a1a]/10 first:border-t">
          <h3>
            <button :id="`faq-q-${i}`" type="button" class="flex w-full items-center justify-between gap-6 py-6 text-left" :aria-expanded="open === i" :aria-controls="`faq-a-${i}`" @click="open = open === i ? null : i">
              <span class="text-[clamp(18px,1.5vw,21px)] font-semibold leading-[1.3] tracking-[-0.015em] text-[#1a1a1a]">{{ f.q }}</span>
              <span class="grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-300" :class="open === i ? 'bg-[#1a1a1a] text-white' : 'bg-[#ebe8e5] text-[#1a1a1a]'">
                <Plus class="size-5 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]" :class="open === i && 'rotate-45'" :stroke-width="2" aria-hidden="true" />
              </span>
            </button>
          </h3>
          <div :id="`faq-a-${i}`" role="region" :aria-labelledby="`faq-q-${i}`" class="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)]" :style="{ gridTemplateRows: open === i ? '1fr' : '0fr' }">
            <div class="overflow-hidden"><p class="max-w-[62ch] pb-7 pr-14 text-[16px] leading-[1.6] text-[#55524f]">{{ f.a }}</p></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
