<script setup lang="ts">
import { useId } from 'vue';
defineProps<{ label: string; hint?: string; error?: string; required?: boolean;
               prefix?: string; suffix?: string }>();
const id = useId();
const describedBy = `${id}-help`;
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-[13px] font-medium leading-5 text-ink-800">
      {{ label }}<span v-if="required" class="ml-0.5 text-danger-600" aria-hidden="true">*</span>
    </label>

    <div v-if="prefix || suffix" class="flex"
      :class="[prefix && 'has-prefix', suffix && 'has-suffix']">
      <span v-if="prefix" class="affix -mr-px rounded-l-sm">{{ prefix }}</span>
      <slot :id="id" :described-by="describedBy" />
      <span v-if="suffix" class="affix -ml-px rounded-r-sm">{{ suffix }}</span>
    </div>
    <slot v-else :id="id" :described-by="describedBy" />

    <p v-if="error" :id="describedBy" class="mt-1.5 text-[13px] leading-[18px] text-danger-600">{{ error }}</p>
    <p v-else-if="hint" :id="describedBy" class="mt-1.5 text-[13px] leading-[18px] text-ink-500">{{ hint }}</p>
  </div>
</template>

<style scoped>
/* The consumer writes a plain <input>; this mirrors the global `.field` token.
   Written as plain CSS on purpose — Tailwind v4 needs `@reference` to resolve
   `@apply` inside an SFC style block, which re-parses the whole stylesheet for
   every component that does it. */
:slotted(input), :slotted(select), :slotted(textarea) {
  width: 100%;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-line-200);
  background: var(--color-surface-0);
  padding: 0 12px;
  font: inherit;
  font-size: 14px;
  color: var(--color-ink-800);
  transition: border-color 120ms var(--ease-in-out), box-shadow 120ms var(--ease-in-out);
}
:slotted(textarea) { height: auto; padding: 9px 12px; line-height: 1.5; resize: vertical; }
:slotted(input::placeholder), :slotted(textarea::placeholder) { color: var(--color-ink-400); }
:slotted(input:focus), :slotted(select:focus), :slotted(textarea:focus) {
  outline: none;
  border-color: var(--color-ink-400);
  box-shadow: 0 0 0 3px rgb(0 0 0 / 0.05);
}
:slotted(input:disabled), :slotted(select:disabled), :slotted(textarea:disabled) {
  background: var(--color-surface-50);
  color: var(--color-ink-400);
  cursor: not-allowed;
}
:slotted([aria-invalid="true"]) { border-color: var(--color-danger-600); }
:slotted(input[type="checkbox"]) { width: auto; height: auto; padding: 0; }

/* Affixes (currency, kg, %) sit inside the field's border, so the input gives up
   the radius on that side. Handled here rather than at every call site. */
.affix {
  display: inline-flex;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  border: 1px solid var(--color-line-200);
  background: var(--color-surface-50);
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-ink-500);
}
.has-prefix :slotted(input) { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.has-suffix :slotted(input) { border-top-right-radius: 0; border-bottom-right-radius: 0; }
</style>
