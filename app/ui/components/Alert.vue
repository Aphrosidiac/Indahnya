<script setup lang="ts">
import { AlertTriangle, Info, CircleAlert, CircleCheck } from 'lucide-vue-next';
import { computed } from 'vue';
import IconBox from './IconBox.vue';

/**
 * The reference's callout: a tinted box, no border, a small coloured icon
 * square, and one or two lines of plain language — "Medicaid is 52% of what
 * you are owed and the slowest to pay." `title` is optional now, because half
 * of the reference's callouts are a single sentence with the first clause in
 * bold, and that reads better as one paragraph than as a heading over a body.
 *
 * `banner` is the wide green one with buttons on the right ("A slot just
 * opened … Leave it open · Offer to all 3").
 */
const props = withDefaults(defineProps<{
  tone?: 'info' | 'warning' | 'danger' | 'success' | 'muted';
  title?: string;
  banner?: boolean;
}>(), { tone: 'info' });

const skin = computed(() => ({
  info:    ['bg-callout-blue',  'text-steel-700',   'blue',  Info],
  warning: ['bg-callout-amber', 'text-warning-600', 'amber', AlertTriangle],
  danger:  ['bg-callout-red',   'text-danger-600',  'red',   CircleAlert],
  success: ['bg-callout-green', 'text-success-600', 'green', CircleCheck],
  muted:   ['bg-[#f0efed]',     'text-ink-600',     'dark',  Info],
}[props.tone] as [string, string, 'blue' | 'amber' | 'red' | 'green' | 'dark', unknown]));
</script>

<template>
  <div class="flex gap-3 rounded-md" :class="[skin[0], banner ? 'items-center px-4 py-3' : 'px-4 py-3.5']" role="status">
    <IconBox :icon="skin[3]" size="sm" :tone="skin[2]" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="text-[13px] font-semibold leading-5" :class="skin[1]">{{ title }}</p>
      <div v-if="$slots.default" class="text-[13px] leading-5" :class="title ? 'text-ink-600' : skin[1]"><slot /></div>
    </div>
    <div v-if="$slots.action" class="flex shrink-0 items-center gap-2"><slot name="action" /></div>
  </div>
</template>
