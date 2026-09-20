<script setup lang="ts">
/**
 * The dark rounded square that leads every card title and KPI cell in the
 * reference (#515056, white glyph). `tone` covers the two tinted cousins the
 * reference uses for callouts — blue for information, green for good news —
 * and `soft` is the pale version that sits inside a quick-action tile.
 */
withDefaults(defineProps<{
  icon: unknown;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'blue' | 'green' | 'amber' | 'red' | 'soft';
}>(), { size: 'md', tone: 'dark' });

const TONE = {
  dark:  'bg-ink-700 text-white',
  blue:  'bg-steel-600 text-white',
  green: 'bg-primary-600 text-white',
  amber: 'bg-warning-600 text-white',
  red:   'bg-danger-600 text-white',
  soft:  'bg-[#fbf6d9] text-ink-700',
};
const SIZE = {
  sm: 'size-7 rounded-[8px] [&>svg]:size-[15px]',
  md: 'size-8 rounded-[9px] [&>svg]:size-[17px]',
  lg: 'size-11 rounded-[12px] [&>svg]:size-[20px]',
};
</script>

<template>
  <span class="grid shrink-0 place-items-center" :class="[TONE[tone], SIZE[size]]" aria-hidden="true">
    <component :is="icon" :stroke-width="1.75" />
  </span>
</template>
