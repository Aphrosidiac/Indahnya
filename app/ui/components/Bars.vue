<script setup lang="ts">
import { computed } from 'vue';
/**
 * The reference's bar chart: fat rounded bars in the quietest grey, the one
 * that matters in green, a few tick labels down the left and a label under
 * every bar (or every nth, when there are many). No library — it is twelve
 * divs, and a chart library would bring a second font, a second colour
 * system and a tooltip nobody asked for.
 *
 * `format` turns a value into a tick label; `highlight` defaults to the
 * largest bar, which is what the reference does ("Peak activity").
 */
const props = withDefaults(defineProps<{
  bars: { label: string; value: number; hint?: string }[];
  format?: (v: number) => string;
  highlight?: number | null;
  height?: number;
  /** Show every nth label under the bars. Auto by count when omitted. */
  every?: number;
}>(), { height: 160, highlight: undefined });

const max = computed(() => Math.max(1, ...props.bars.map(b => b.value)));
const hi = computed(() => {
  if (props.highlight === null) return -1;
  if (props.highlight !== undefined) return props.highlight;
  let i = -1, m = 0;
  props.bars.forEach((b, k) => { if (b.value > m) { m = b.value; i = k; } });
  return i;
});
const fmt = (v: number) => (props.format ?? (n => String(Math.round(n))))(v);
const ticks = computed(() => [1, 0.5, 0.25, 0].map(f => ({ f, label: fmt(max.value * f) })));
const nth = computed(() => props.every ?? (props.bars.length > 16 ? 4 : props.bars.length > 8 ? 2 : 1));
</script>

<template>
  <div class="flex gap-3">
    <div class="relative shrink-0 text-right text-[11px] leading-none text-ink-400" :style="{ height: `${height}px`, width: '34px' }">
      <span v-for="t in ticks" :key="t.f" class="num absolute right-0" :style="{ top: `calc(${(1 - t.f) * 100}% - ${t.f === 1 ? 0 : t.f === 0 ? 11 : 5}px)` }">{{ t.label }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-end gap-[6px]" :style="{ height: `${height}px` }" role="img" :aria-label="`${bars.length} bars`">
        <div v-for="(b, i) in bars" :key="b.label" class="group relative flex h-full max-w-[72px] flex-1 items-end"
          :title="b.hint ?? `${b.label}: ${fmt(b.value)}`">
          <div class="grow-y w-full rounded-[7px] transition-[height,background-color] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
            :class="i === hi ? 'bg-primary-500' : b.value > 0 ? 'bg-[#eceae8] group-hover:bg-line-200' : 'bg-[#f3f2f0]'"
            :style="{ height: `${Math.max(b.value > 0 ? 4 : 2, (b.value / max) * 100)}%` }" />
        </div>
      </div>
      <div class="mt-2 flex gap-[6px]">
        <span v-for="(b, i) in bars" :key="b.label" class="relative h-[11px] max-w-[72px] min-w-0 flex-1">
          <span v-if="i % nth === 0" class="num absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-ink-400">{{ b.label }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
