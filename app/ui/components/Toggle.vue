<script setup lang="ts">
/**
 * The switch ANK's Marketing screen hand-rolls, as a primitive: green track
 * when on (the accent, carrying nothing but a white knob), line-200 when off.
 * Label and hint on the left, the control on the right, one row.
 */
const model = defineModel<boolean>({ required: true });
withDefaults(defineProps<{ label?: string; hint?: string; disabled?: boolean; inset?: boolean }>(), {});
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-4" :class="[inset && 'px-5 py-3.5', disabled && 'cursor-not-allowed opacity-50']">
    <span v-if="label || hint" class="min-w-0">
      <span v-if="label" class="block text-[14px] font-medium leading-5 text-ink-900">{{ label }}</span>
      <span v-if="hint" class="block text-[13px] leading-[18px] text-ink-500">{{ hint }}</span>
    </span>
    <button type="button" role="switch" :aria-checked="model" :aria-label="label" :disabled="disabled"
      class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)]"
      :class="model ? 'bg-primary-400' : 'bg-line-200'" @click="model = !model">
      <span class="absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)]"
        :class="model ? 'translate-x-[22px]' : 'translate-x-0.5'" />
    </button>
  </label>
</template>
