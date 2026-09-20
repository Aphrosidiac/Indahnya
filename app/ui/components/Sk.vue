<script setup lang="ts">
import { computed } from 'vue';

/**
 * One shimmer bar. The building block for skeletons that match the shape of
 * what follows, rather than a stack of identical grey rectangles.
 *
 * `seed` varies the width deterministically, so a column of bars looks like
 * ragged real text instead of a bar chart — and looks the SAME on every render,
 * because a width that jitters between frames reads as a bug.
 */
const props = withDefaults(defineProps<{
  w?: string;
  h?: string;
  /** Vary the width by up to ±18%, keyed on this. */
  seed?: number;
  pill?: boolean;
  square?: boolean;
}>(), { w: '100%', h: '12px' });

const width = computed(() => {
  if (props.seed === undefined || !props.w.endsWith('%')) return props.w;
  const base = parseFloat(props.w);
  /** A cheap deterministic hash; no Math.random, so it never re-rolls. */
  const n = Math.sin(props.seed * 12.9898) * 43758.5453;
  const jitter = (n - Math.floor(n)) * 0.36 - 0.18;
  /** Two decimals: Node and the browser disagree past the 11th digit of sin(), which is a hydration mismatch. */
  return `${Math.max(18, Math.min(100, base * (1 + jitter))).toFixed(2)}%`;
});
</script>

<template>
  <span
    class="skeleton block shrink-0"
    :style="{
      width,
      height: square ? w : h,
      borderRadius: pill ? '999px' : square ? '6px' : '4px',
    }"
    aria-hidden="true" />
</template>
