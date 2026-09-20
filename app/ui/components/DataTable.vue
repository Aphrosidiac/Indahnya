<script setup lang="ts" generic="T extends Record<string, any>">
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-vue-next';
import Sk from './Sk.vue';
import Btn from './Btn.vue';

/**
 * `Row` is not referenced in the body, and that is deliberate: it makes callers
 * write `Column<Order>[]` beside `rows: Order[]`, so the two cannot silently
 * describe different things when a column list is copied between screens.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Column<Row> {
  key: string;
  label: string;
  /** Right-aligns and applies tabular figures. Every column of digits gets this. */
  numeric?: boolean;
  sortable?: boolean;
  width?: string;
  hideBelow?: 'sm' | 'md' | 'lg';
  /**
   * What this cell looks like while it loads. Defaults to a single bar, or a
   * short right-aligned one for a numeric column — so a table that says nothing
   * still gets a skeleton with its own shape.
   */
  skeleton?: 'text' | 'twoLine' | 'thumb' | 'pill' | 'code';
}

withDefaults(defineProps<{
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** How many placeholder rows to draw. Match the page size you expect. */
  skeletonRows?: number;
  sort?: string | null;
  dir?: 'asc' | 'desc';
  /** Present when there is another page; cursor pagination, never offset. */
  hasMore?: boolean;
  loadingMore?: boolean;
  selectedKey?: string | null;
}>(), { dir: 'desc', skeletonRows: 8 });

const emit = defineEmits<{
  'row-click': [row: T];
  sort: [key: string];
  more: [];
}>();

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
</script>

<template>
  <div class="card overflow-hidden">
    <!-- own scroller: a wide table must never make the page scroll sideways -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-[13px]">
        <thead>
          <tr class="border-b border-line-100">
            <th v-for="c in columns" :key="c.key" scope="col"
              class="px-4 py-2.5 text-left first:pl-5 last:pr-5"
              :class="[c.numeric && 'text-right', c.hideBelow && HIDE[c.hideBelow]]"
              :style="c.width ? { width: c.width } : undefined">
              <button v-if="c.sortable" type="button"
                class="eyebrow inline-flex items-center gap-1 font-medium transition-colors hover:text-ink-900"
                @click="emit('sort', c.key)">
                {{ c.label }}
                <component
                  :is="sort === c.key ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown"
                  class="size-3" :class="sort === c.key ? 'text-primary-700' : 'text-ink-300'"
                  :stroke-width="2.5" aria-hidden="true" />
              </button>
              <span v-else class="eyebrow">{{ c.label }}</span>
            </th>
          </tr>
        </thead>

        <!-- The skeleton is the table, not a block where the table will be:
             same rows, same columns, same widths and alignment, so nothing
             shifts when the data lands. -->
        <tbody v-if="loading" aria-hidden="true">
          <tr v-for="r in skeletonRows" :key="r" class="border-b border-line-100 last:border-0">
            <td v-for="(c, ci) in columns" :key="c.key"
              class="px-4 py-3.5 align-middle first:pl-5 last:pr-5"
              :class="[c.numeric && 'text-right', c.hideBelow && HIDE[c.hideBelow]]"
              :style="c.width ? { width: c.width } : undefined">
              <Sk v-if="c.skeleton === 'thumb'" w="40px" square />
              <span v-else-if="c.skeleton === 'twoLine'" class="block space-y-1.5">
                <Sk w="72%" h="13px" :seed="r * 31 + ci" />
                <Sk w="48%" h="11px" :seed="r * 17 + ci" />
              </span>
              <Sk v-else-if="c.skeleton === 'pill'" w="68px" h="20px" pill />
              <Sk v-else-if="c.skeleton === 'code'" w="84px" h="12px" />
              <span v-else-if="c.numeric" class="flex justify-end">
                <Sk w="38px" h="12px" :seed="r * 7 + ci" />
              </span>
              <Sk v-else w="64%" h="12px" :seed="r * 13 + ci" />
            </td>
          </tr>
        </tbody>

        <tbody v-else class="reveal-flat">
          <tr v-for="row in rows" :key="rowKey(row)"
            class="cursor-pointer border-b border-line-100 transition-colors last:border-0
                   hover:bg-surface-50 focus-visible:bg-surface-50"
            :class="selectedKey === rowKey(row) && 'bg-primary-50/70'"
            tabindex="0"
            @click="emit('row-click', row)"
            @keydown.enter.prevent="emit('row-click', row)"
            @keydown.space.prevent="emit('row-click', row)">
            <td v-for="c in columns" :key="c.key"
              class="px-4 py-3.5 align-middle text-ink-800 first:pl-5 last:pr-5"
              :class="[c.numeric && 'num whitespace-nowrap text-right', c.hideBelow && HIDE[c.hideBelow]]">
              <slot :name="`cell:${c.key}`" :row="row" :value="row[c.key]">{{ row[c.key] }}</slot>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="columns.length" class="p-0"><slot name="empty" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="hasMore" class="flex justify-center border-t border-line-100 px-4 py-3">
      <Btn size="sm" :loading="loadingMore" @click="emit('more')">Load more</Btn>
    </footer>
  </div>
</template>
