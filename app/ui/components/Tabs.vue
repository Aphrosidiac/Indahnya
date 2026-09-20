<script setup lang="ts" generic="K extends string">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Count from './Count.vue';
/**
 * The reference's tab strip: a grey pill with the active tab lifted out in
 * white — "Overview · Claims 4 · Invoices 8 · Payers". It is a segmented
 * control, so it belongs to a PAGE and should carry at most seven or eight
 * entries; a screen that needs ten tabs needs a second screen, not a
 * wider strip.
 *
 * The white lift is ONE element that slides between tabs. Its position is
 * measured from the buttons and applied as a transform, so the move is a CSS
 * transition on something that already exists — if the frame never comes it
 * is simply at the new tab. Until the first measurement it sits under the
 * active tab without animating, so nothing flashes on mount.
 *
 * `filter` is the other shape: loose chips on the ground, the active one
 * filled dark — "Needs Action 9 · In Clinic 20 · Outpatient 1 · All 248".
 * That one is for narrowing a list, and can hold as many as the list has
 * states.
 */
const props = withDefaults(defineProps<{
  items: readonly { key: K; label: string; count?: number | string; tone?: 'neutral' | 'red' | 'green' | 'amber' }[];
  variant?: 'segment' | 'filter';
}>(), { variant: 'segment' });
const model = defineModel<K>({ required: true });

const strip = ref<HTMLElement>();
const pill = ref({ x: 0, w: 0, ready: false });

function measure() {
  const el = strip.value?.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!el || !strip.value) { pill.value.ready = false; return; }
  pill.value = { x: el.offsetLeft, w: el.offsetWidth, ready: true };
}
watch(() => [model.value, props.items.length], () => nextTick(measure));
let ro: ResizeObserver | undefined;
onMounted(() => {
  measure();
  /** Fonts land after first paint and widen every tab a little; re-measure. */
  if (typeof ResizeObserver !== 'undefined' && strip.value) { ro = new ResizeObserver(measure); ro.observe(strip.value); }
  (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(measure);
});
onBeforeUnmount(() => ro?.disconnect());
</script>

<template>
  <div v-if="variant === 'segment'" ref="strip" role="tablist"
    class="relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[11px] bg-sand p-[3px] max-lg:w-full">
    <span v-if="pill.ready" aria-hidden="true"
      class="pointer-events-none absolute left-0 top-[3px] h-[30px] rounded-[8px] bg-surface-0 shadow-[0_1px_2px_rgb(0_0_0/.06),0_1px_1px_rgb(0_0_0/.03)]
             transition-[transform,width] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)]"
      :style="{ width: `${pill.w}px`, transform: `translateX(${pill.x}px)` }" />
    <button v-for="t in items" :key="t.key" type="button" role="tab" :aria-selected="model === t.key"
      class="relative z-10 inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium
             transition-colors duration-[160ms]"
      :class="model === t.key
        ? ['text-ink-900', !pill.ready && 'bg-surface-0 shadow-[0_1px_2px_rgb(0_0_0/.06),0_1px_1px_rgb(0_0_0/.03)]']
        : 'text-ink-600 hover:text-ink-900'"
      @click="model = t.key">
      {{ t.label }}
      <Count v-if="t.count !== undefined && t.count !== 0" :value="t.count" :tone="t.tone ?? 'neutral'" />
    </button>
  </div>

  <div v-else role="tablist" class="flex flex-wrap items-center gap-1.5">
    <button v-for="t in items" :key="t.key" type="button" role="tab" :aria-selected="model === t.key"
      class="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium
             transition-[background-color,border-color,color,transform] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] active:scale-[0.97]"
      :class="model === t.key
        ? 'border border-ink-700 bg-ink-700 text-white'
        : 'border border-line-200 bg-surface-0 text-ink-600 hover:border-ink-300 hover:text-ink-900'"
      @click="model = t.key">
      {{ t.label }}
      <Count v-if="t.count !== undefined && t.count !== 0" :value="t.count"
        :tone="model === t.key ? 'on-dark' : (t.tone ?? 'neutral')" />
    </button>
  </div>
</template>
