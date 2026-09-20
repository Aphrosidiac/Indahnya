<script setup lang="ts">
import { provide } from 'vue';
import { KPI_STRIP } from '../kpi-context';
import Sk from './Sk.vue';
/**
 * One white card, four cells, hairline dividers between them — the strip that
 * opens every reference page. Each cell is a <Stat>, which notices it is
 * inside a strip and drops its own card.
 */
/** `loading` draws the strip's own shape — icon square, label, figure — so nothing shifts when the numbers land. */
withDefaults(defineProps<{ cols?: 3 | 4 | 5; loading?: boolean }>(), { cols: 4 });
provide(KPI_STRIP, true);
</script>

<template>
  <!-- Two columns until xl: four cells across ~1100px truncated every label
       to "S…", and a label that cannot be read is a cell that says nothing. -->
  <div class="card grid min-w-0 grid-cols-2 divide-line-100 max-xl:divide-y xl:divide-x
              [&>*:nth-child(odd)]:max-xl:border-r [&>*:nth-child(odd)]:max-xl:border-line-100
              [&>*:nth-child(-n+2)]:max-xl:border-b-0"
    :class="cols === 5 ? 'xl:grid-cols-5' : cols === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'">
    <template v-if="loading">
      <div v-for="i in cols" :key="i" class="flex items-center gap-3 px-4 py-4 lg:px-5" aria-hidden="true">
        <Sk w="32px" square class="max-sm:hidden" />
        <span class="min-w-0 flex-1 space-y-2"><Sk w="58%" h="11px" :seed="i" /><Sk w="40%" h="20px" :seed="i * 3" /></span>
      </div>
    </template>
    <slot v-else />
  </div>
</template>
