<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
/**
 * The reference's score ring: a thick grey track, a green arc, the number in
 * the middle. `pct` drives the arc; `tone` colours it by how the number is
 * doing, not by taste.
 */
const props = withDefaults(defineProps<{
  pct: number;
  label?: string;
  size?: number;
  tone?: 'green' | 'amber' | 'red' | 'blue';
}>(), { size: 120, tone: 'green' });
const R = 44, C = 2 * Math.PI * R;
/** Draws from zero on the first frame after mount, then follows `pct`. A CSS
    transition on stroke-dasharray, so a ring that never animates is full. */
const shown = ref(0);
onMounted(() => { requestAnimationFrame(() => { shown.value = props.pct; }); setTimeout(() => { shown.value = props.pct; }, 50); });
const dash = computed(() => `${(Math.max(0, Math.min(100, shown.value || props.pct)) / 100) * C} ${C}`);
const STROKE = { green: '#76c66e', amber: '#e6a24c', red: '#d15c49', blue: '#6887db' };
</script>

<template>
  <div class="relative grid place-items-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg viewBox="0 0 100 100" class="absolute inset-0 size-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" :r="R" fill="none" stroke="#eceae8" stroke-width="9" />
      <circle cx="50" cy="50" :r="R" fill="none" :stroke="STROKE[tone]" stroke-width="9" stroke-linecap="round"
        :stroke-dasharray="dash" class="transition-[stroke-dasharray] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)]" />
    </svg>
    <div class="relative text-center">
      <slot>
        <p class="num text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink-900">{{ Math.round(pct) }}</p>
        <p v-if="label" class="mt-1 text-[11px] leading-none text-ink-500">{{ label }}</p>
      </slot>
    </div>
  </div>
</template>
