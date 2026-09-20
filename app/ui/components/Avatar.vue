<script setup lang="ts">
import { computed } from 'vue';
/**
 * A coloured circle with an initial. The reference gives every person one, in
 * a palette of six, and the same person always gets the same colour — so the
 * hue is hashed from the name, not picked at random per render.
 */
const props = withDefaults(defineProps<{
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Two letters instead of one, e.g. a branch code. */
  code?: string;
  src?: string | null;
}>(), { size: 'sm' });

const PALETTE = [
  'bg-[#3aa48e] text-white', 'bg-[#5474c4] text-white', 'bg-[#d2694a] text-white',
  'bg-[#8c6fd6] text-white', 'bg-[#c9587f] text-white', 'bg-[#4f9bd1] text-white',
  'bg-[#2f7a2b] text-white', 'bg-[#a8792a] text-white',
];
const hue = computed(() => {
  let h = 0;
  for (const ch of props.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
});
const initial = computed(() => props.code ?? (props.name.trim()[0] ?? '?').toUpperCase());
const SIZE = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[12px]', md: 'size-9 text-[14px]', lg: 'size-11 text-[16px]' };
</script>

<template>
  <span class="grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold"
    :class="[SIZE[size], !src && hue]" aria-hidden="true">
    <img v-if="src" :src="src" alt="" class="size-full object-cover" />
    <template v-else>{{ initial }}</template>
  </span>
</template>
