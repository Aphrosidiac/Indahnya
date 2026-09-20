<script setup lang="ts">
/**
 * The detail panel's fact list — "MRN  PT-33218 / Room  12A": label on the
 * left in grey, value on the right in ink, one hairline between rows. The
 * value slot takes a chip when the fact is a status.
 */
defineProps<{ rows: { label: string; value?: string | number | null }[] }>();
</script>

<template>
  <dl class="divide-y divide-line-100">
    <div v-for="r in rows" :key="r.label" class="flex items-center justify-between gap-4 py-2 text-[13px] leading-5">
      <dt class="shrink-0 text-ink-500">{{ r.label }}</dt>
      <dd class="min-w-0 truncate text-right font-medium text-ink-900">
        <slot :name="r.label" :row="r">{{ r.value ?? '—' }}</slot>
      </dd>
    </div>
  </dl>
</template>
