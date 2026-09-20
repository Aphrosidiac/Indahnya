<script setup lang="ts">
/**
 * A labelled bar: "Rapid antigen ——— 48 min". The reference draws these
 * everywhere it would otherwise print a percentage, and colours the bar by
 * how the number is doing, not by which row it is.
 */
withDefaults(defineProps<{
  label?: string;
  value?: string;
  /** 0–100 */
  pct: number;
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'neutral';
  /** A thin bar with no label row — inside a table cell. */
  bare?: boolean;
  /** A marker on the track, e.g. a benchmark. 0–100. */
  mark?: number;
}>(), { tone: 'green' });
const TONE = { green: 'bg-primary-500', blue: 'bg-steel-400', amber: 'bg-[#e6a24c]', red: 'bg-[#d15c49]', neutral: 'bg-ink-300' };
</script>

<template>
  <div :class="!bare && 'py-1'">
    <div v-if="!bare && (label || value)" class="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] leading-[18px]">
      <span class="truncate text-ink-600">{{ label }}</span>
      <span class="num shrink-0 font-medium text-ink-900">{{ value }}</span>
    </div>
    <div class="relative h-[6px] w-full overflow-hidden rounded-full bg-[#efefeb]">
      <div class="grow-x h-full rounded-full transition-[width] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
        :class="TONE[tone]" :style="{ width: `${Math.max(0, Math.min(100, pct))}%` }" />
      <span v-if="mark !== undefined" class="absolute inset-y-0 w-px bg-ink-900" :style="{ left: `${mark}%` }" aria-hidden="true" />
    </div>
  </div>
</template>
