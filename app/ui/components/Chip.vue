<script setup lang="ts">
/**
 * A tinted pill with regular-weight text — the reference's status vocabulary.
 * StatusPill maps a domain status onto one of these tones; Chip is for the
 * ad-hoc ones a page makes up as it goes ("+31%", "breach", "4 claims").
 *
 * `dark` is the filled one used for a selected filter ("Needs Action 9").
 */
withDefaults(defineProps<{
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'dark' | 'outline';
  size?: 'sm' | 'md';
}>(), { tone: 'neutral', size: 'md' });

const TONE = {
  neutral: 'bg-[#f0f0ee] text-ink-600',
  green:   'bg-success-50 text-success-600',
  amber:   'bg-warning-50 text-warning-600',
  red:     'bg-danger-50 text-danger-600',
  blue:    'bg-info-50 text-info-600',
  violet:  'bg-violet-50 text-violet-600',
  dark:    'bg-ink-700 text-white',
  outline: 'border border-line-200 bg-surface-0 text-ink-600',
};
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-medium"
    :class="[TONE[tone], size === 'sm' ? 'h-[18px] px-1.5 text-[11px]' : 'h-[22px] px-2 text-[12px]']">
    <slot />
  </span>
</template>
