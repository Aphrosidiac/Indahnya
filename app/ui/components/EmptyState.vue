<script setup lang="ts">
import { Inbox } from 'lucide-vue-next';
withDefaults(defineProps<{ title: string; body?: string; compact?: boolean }>(), {});
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 text-center"
    :class="compact ? 'py-10' : 'py-16'">
    <div class="mb-3 grid size-10 place-items-center rounded-[12px] bg-sand text-ink-500">
      <slot name="icon"><Inbox class="size-5" :stroke-width="1.5" /></slot>
    </div>
    <h3 class="text-[14px] leading-5 font-semibold">{{ title }}</h3>
    <p v-if="body" class="mt-1.5 max-w-md text-[13px] leading-5 text-ink-500">{{ body }}</p>
    <div v-if="$slots.default" class="mt-5"><slot /></div>
  </div>
</template>
