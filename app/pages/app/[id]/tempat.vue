<script setup lang="ts">
import { Construction } from 'lucide-vue-next';
import { PageHead, EmptyState } from '~/ui';
definePageMeta({ layout: 'app', middleware: 'auth' });
useCurrentEvent();
</script>

<template>
  <Teleport defer to="#page-head"><PageHead title="Tempat duduk" sub="Fasa B" /></Teleport>
  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <EmptyState class="card" title="Tempat duduk — akan datang" body="Susun meja dan tetamu cari nombor meja. Dibina selepas galeri siap.">
      <template #icon><Construction class="size-5" :stroke-width="1.5" /></template>
    </EmptyState>
  </div>
</template>
