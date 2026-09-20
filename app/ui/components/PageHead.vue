<script setup lang="ts">
import { useMedia } from '../use-media';
defineProps<{ title: string; sub?: string }>();
/**
 * On a phone the head is 64px wide of nothing once two buttons and a bell are
 * in it, and the title was truncating to "F…". Below `sm` the actions move to
 * a second row the shell provides under the head (#page-actions), and the
 * title keeps the line.
 */
const narrow = useMedia('(max-width: 639px)');
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center justify-between gap-4">
    <div class="min-w-0">
      <h1 class="truncate text-[22px] font-semibold leading-7 tracking-[-0.02em]">{{ title }}</h1>
      <p v-if="sub" class="truncate text-[12px] leading-4 text-ink-500">{{ sub }}</p>
    </div>
    <div v-if="!narrow" class="flex shrink-0 items-center gap-2"><slot /></div>
    <Teleport v-else defer to="#page-actions">
      <div class="flex items-center gap-2 overflow-x-auto"><slot /></div>
    </Teleport>
  </div>
</template>
