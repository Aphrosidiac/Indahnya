<script setup lang="ts">
/**
 * The small grey number beside a nav item, a tab or a card title — "Scheduling
 * 10", "Waitlist 14", "Patients 8". Tones only when the number IS the problem
 * (failed jobs, unread chats).
 */
withDefaults(defineProps<{ value: number | string; tone?: 'neutral' | 'red' | 'green' | 'amber' | 'dark' | 'on-dark' }>(),
  { tone: 'neutral' });
const TONE = {
  neutral: 'bg-sand text-ink-600',
  red:     'bg-danger-50 text-danger-600',
  green:   'bg-success-50 text-success-600',
  amber:   'bg-warning-50 text-warning-600',
  dark:    'bg-ink-700 text-white',
  'on-dark': 'bg-white/20 text-white',
};
</script>

<template>
  <span class="num inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[6px] px-1.5
               text-[11px] font-medium leading-none" :class="TONE[tone]">{{ value }}</span>
</template>
