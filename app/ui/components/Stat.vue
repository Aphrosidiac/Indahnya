<script setup lang="ts">
import { inject } from 'vue';
import IconBox from './IconBox.vue';
import Chip from './Chip.vue';
import { KPI_STRIP } from '../kpi-context';
/**
 * A KPI cell: dark icon square, quiet label, the figure, and a chip that says
 * whether the figure is good ("+31%", "On target", "breach"). Inside a
 * <KpiStrip> it is one cell of the strip; on its own it is a card.
 *
 * `tone` was the old way of saying "this number is a problem" and still works:
 * it colours the figure. Prefer `delta` + `deltaTone`, which say so in words.
 */
withDefaults(defineProps<{
  label: string;
  value: string | number;
  /** The figure's unit or denominator, set small beside it: "patients", "/100". */
  unit?: string;
  sub?: string;
  icon?: unknown;
  delta?: string;
  deltaTone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
  tone?: 'default' | 'warn' | 'danger';
}>(), { tone: 'default', deltaTone: 'neutral' });
const inStrip = inject(KPI_STRIP, false);
</script>

<template>
  <!-- The chip sits beside the figure on a desk and under it on a phone: a
       170px cell has no room for both on one line, and a chip that overflows
       its cell is worse than one that moved. -->
  <div class="flex min-w-0 items-center gap-3 px-4 py-4 lg:px-5" :class="!inStrip && 'card'">
    <IconBox v-if="icon" :icon="icon" class="max-sm:hidden" />
    <div class="min-w-0 flex-1">
      <p class="text-[13px] leading-[18px] text-ink-500">{{ label }}</p>
      <p class="flex flex-wrap items-baseline gap-x-1.5">
        <span class="num whitespace-nowrap text-[22px] font-semibold leading-7 tracking-[-0.02em]"
          :class="tone === 'warn' ? 'text-warning-600' : tone === 'danger' ? 'text-danger-600' : 'text-ink-900'">{{ value }}</span>
        <span v-if="unit" class="truncate text-[14px] leading-5 text-ink-500">{{ unit }}</span>
      </p>
      <p v-if="sub" class="mt-0.5 text-[12px] leading-4 text-ink-500">{{ sub }}</p>
      <Chip v-if="delta" :tone="deltaTone" class="mt-1.5 xl:hidden">{{ delta }}</Chip>
    </div>
    <Chip v-if="delta" :tone="deltaTone" class="max-xl:hidden">{{ delta }}</Chip>
  </div>
</template>
