<script setup lang="ts">
import IconBox from './IconBox.vue';
import Count from './Count.vue';
/**
 * The card. Its header is the reference's: a dark icon square, the title, a
 * grey count, the subtitle running on after it in the same line — "Waiting
 * for a slot 14  14 people · average wait 3 days" — and whatever actions on
 * the right. `flush` drops the body padding for a table or a list.
 */
withDefaults(defineProps<{
  title?: string;
  sub?: string;
  icon?: unknown;
  count?: number | string;
  flush?: boolean;
  /** A hairline under the header. Off by default: the reference's cards run straight from title into rows. */
  divided?: boolean;
  /** Tinted card: the green "Left today" column, the muted note box. */
  tone?: 'default' | 'green' | 'muted' | 'dark';
}>(), { tone: 'default' });
const TONE = {
  default: 'card',
  green: 'rounded-md border border-[#cfe6c8] bg-callout-green',
  muted: 'rounded-md bg-[#f0efed]',
  dark: 'rounded-md bg-ink-700 text-white',
};
</script>

<template>
  <!-- min-w-0: a grid item defaults to min-width:auto, so one long subtitle
       would widen its column past the viewport on a phone -->
  <section class="min-w-0 overflow-hidden" :class="TONE[tone]">
    <header v-if="title || $slots.actions"
      class="flex items-center justify-between gap-3 px-5 pt-4"
      :class="divided ? 'border-b border-line-100 pb-4' : flush ? 'pb-3' : 'pb-1'">
      <div class="flex min-w-0 flex-1 items-center gap-2.5">
        <IconBox v-if="icon" :icon="icon" size="sm" :tone="tone === 'dark' ? 'blue' : 'dark'" />
        <div class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 v-if="title" class="text-[15px] font-semibold leading-6 lg:whitespace-nowrap"
            :class="tone === 'dark' ? 'text-white' : 'text-ink-900'">{{ title }}</h3>
          <Count v-if="count !== undefined" :value="count" :tone="tone === 'dark' ? 'on-dark' : 'neutral'" />
          <p v-if="sub" class="min-w-0 text-[13px] leading-[18px] max-lg:basis-full lg:truncate" :class="tone === 'dark' ? 'text-white/70' : 'text-ink-500'" :title="sub">{{ sub }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </header>
    <div :class="flush ? '' : (title || $slots.actions) ? 'px-5 pb-5 pt-3' : 'p-5'"><slot /></div>
    <footer v-if="$slots.footer" class="border-t border-line-100 bg-surface-50 px-5 py-3.5">
      <slot name="footer" />
    </footer>
  </section>
</template>
