<script setup lang="ts">
/**
 * The Indahnya mark: a green rounded square carrying a four-petal bloom in
 * ink — the same green-carries-ink rule as the accent button, so the mark and
 * the active nav item are visibly one family. Drawn, not an image, so it is
 * crisp at every size and never shifts the sidebar header while decoding.
 *
 * `size` is the square's side; the wordmark follows at 17px.
 */
withDefaults(defineProps<{ size?: number; wordmark?: boolean }>(), { size: 30, wordmark: true });
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" class="shrink-0 select-none">
      <rect width="32" height="32" rx="9" fill="#7dd56f" />
      <g fill="#1a1a1a">
        <circle cx="16" cy="9.5" r="4.2" />
        <circle cx="16" cy="22.5" r="4.2" />
        <circle cx="9.5" cy="16" r="4.2" />
        <circle cx="22.5" cy="16" r="4.2" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#7dd56f" />
    </svg>
    <span v-if="wordmark" class="text-[17px] font-semibold tracking-[-0.02em] text-ink-900">Indahnya</span>
  </span>
</template>
