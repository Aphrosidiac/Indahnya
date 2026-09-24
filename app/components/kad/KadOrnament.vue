<script setup lang="ts">
/**
 * The template's one decorative mark, drawn in its accent. Line work only —
 * no stock florals — so it stays crisp at any size and never outweighs the
 * names. `flip` mirrors it for the foot of a section.
 */
defineProps<{ kind: 'sprig' | 'filigree' | 'none' | 'deco' | 'rule'; flip?: boolean; width?: number }>();
</script>

<template>
  <svg v-if="kind !== 'none'" :width="width ?? 180" height="28" viewBox="0 0 180 28" fill="none" aria-hidden="true"
    class="mx-auto block" :style="flip ? 'transform: scaleY(-1)' : undefined">
    <g v-if="kind === 'sprig'" stroke="var(--k-accent)" stroke-width="1.4" stroke-linecap="round">
      <path d="M8 14H70M110 14H172" />
      <path d="M90 22c-6-8-6-14 0-20c6 6 6 12 0 20Z" fill="var(--k-accent)" fill-opacity=".14" />
      <path d="M90 22c-9-2-15-7-18-13c7 0 13 4 18 13Zm0 0c9-2 15-7 18-13c-7 0-13 4-18 13Z" fill="var(--k-accent)" fill-opacity=".1" />
      <path d="M70 14c4-4 9-5 13-3M110 14c-4-4-9-5-13-3" />
    </g>
    <g v-else-if="kind === 'filigree'" stroke="var(--k-accent)" stroke-width="1.2" stroke-linecap="round">
      <path d="M6 14H62M118 14H174" />
      <path d="M62 14c6-9 13-9 19 0c6 9 12 9 18 0c6-9 13-9 19 0" />
      <circle cx="90" cy="14" r="2.4" fill="var(--k-accent)" />
      <circle cx="56" cy="14" r="1.4" fill="var(--k-accent)" /><circle cx="124" cy="14" r="1.4" fill="var(--k-accent)" />
    </g>
    <g v-else-if="kind === 'deco'" stroke="var(--k-accent)" stroke-width="1.2">
      <path d="M6 10H74M6 18H74M106 10H174M106 18H174" />
      <path d="M90 3L101 14L90 25L79 14Z" fill="var(--k-accent)" />
      <path d="M90 8L96 14L90 20L84 14Z" stroke="var(--k-bg)" />
    </g>
    <path v-else d="M50 14H130" stroke="var(--k-accent)" stroke-width="1" />
  </svg>
</template>
