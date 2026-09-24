<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
/**
 * A white row with a leading icon, a title, a grey line under it and a
 * chevron — the reference's "Blocking her discharge" list and its "Staff
 * tasks". Renders as a button (or a RouterLink when `to` is given) because
 * the whole row is the target. Indahnya: `href` makes it a plain <a> (a
 * file download, an API route) rather than wrapping a button in a link.
 */
withDefaults(defineProps<{
  title: string;
  sub?: string;
  icon?: unknown;
  tone?: 'neutral' | 'amber' | 'red' | 'green' | 'blue';
  to?: string;
  href?: string;
  download?: boolean;
  /** Inside a card: no border, hairline between rows. Standalone: a bordered white tile. */
  inset?: boolean;
}>(), { tone: 'neutral' });
const TONE = {
  neutral: 'text-ink-400', amber: 'text-warning-600', red: 'text-danger-600',
  green: 'text-success-600', blue: 'text-info-600',
};
</script>

<template>
  <component :is="to ? 'RouterLink' : href ? 'a' : 'button'" :to="to" :href="href" :download="href && download ? '' : undefined" :type="to || href ? undefined : 'button'"
    class="group flex w-full items-center gap-3 text-left transition-colors"
    :class="inset
      ? 'px-5 py-3 hover:bg-surface-50'
      : 'rounded-[12px] border border-line-100 bg-surface-0 px-3.5 py-3 shadow-xs hover:border-line-200'">
    <span v-if="icon" class="grid size-5 shrink-0 place-items-center" :class="TONE[tone]">
      <component :is="icon" class="size-[18px]" :stroke-width="1.75" aria-hidden="true" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[13px] font-medium leading-5 text-ink-900">{{ title }}</span>
      <span v-if="sub" class="block truncate text-[12px] leading-4 text-ink-500">{{ sub }}</span>
    </span>
    <slot name="trailing">
      <ChevronRight class="size-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-600" :stroke-width="1.75" aria-hidden="true" />
    </slot>
  </component>
</template>
