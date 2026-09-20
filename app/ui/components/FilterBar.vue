<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import Btn from './Btn.vue';

/**
 * Search, branch, date range, status. Whatever is passed in the slot.
 * State belongs in the URL — see useUrlState — so a filtered view is shareable
 * and the back button does what a person expects.
 */
const q = defineModel<string>('q', { default: '' });
withDefaults(defineProps<{ placeholder?: string; dirty?: boolean }>(), {
  placeholder: 'Search…',
});
const emit = defineEmits<{ clear: [] }>();
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <label class="relative min-w-[180px] flex-1 sm:max-w-[240px]">
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
        :stroke-width="1.75" aria-hidden="true" />
      <span class="sr-only">Search</span>
      <input v-model="q" type="search" class="field h-[34px] rounded-full pl-9 text-[13px]" :placeholder="placeholder" />
    </label>
    <slot />
    <Btn v-if="dirty" size="sm" variant="ghost" @click="emit('clear')">
      <X class="size-4" :stroke-width="1.75" aria-hidden="true" /> Clear
    </Btn>
  </div>
</template>
