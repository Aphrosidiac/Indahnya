<script setup lang="ts">
/**
 * A stack of equal bars. Only right where the thing that follows really IS a
 * stack of equal blocks — a list of cards, say. For anything with internal
 * structure, build the shape out of `Sk` instead: a generic block where a table
 * is about to appear tells the reader nothing and then jumps.
 */
withDefaults(defineProps<{ rows?: number; height?: string }>(), { rows: 4, height: '64px' });
</script>

<template>
  <div class="space-y-3" aria-hidden="true">
    <div v-for="i in rows" :key="i" class="skeleton" :style="{ height }" />
  </div>
</template>
