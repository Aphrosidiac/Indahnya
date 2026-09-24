<script setup lang="ts">
import type { KadView as KadViewData } from '~~/shared/utils/kad-view';
import KadView from '~/components/kad/KadView.vue';

/**
 * The editor's phone frame loads this page in an iframe, so the kad renders
 * at a real phone width with its own viewport, fixed bar and sheets. The
 * draft arrives by postMessage from the editor (same origin only) and is
 * rendered by the SAME component guests get.
 */
definePageMeta({ layout: 'bare', middleware: 'auth' });
const view = ref<KadViewData | null>(null);
const cover = ref(false);
const ready = ref(0);
function onMessage(e: MessageEvent) {
  if (e.origin !== location.origin || e.data?.type !== 'kad-preview') return;
  view.value = e.data.view; cover.value = !!e.data.cover; ready.value = e.data.ready ?? 0;
}
onMounted(() => {
  addEventListener('message', onMessage);
  parent.postMessage({ type: 'kad-preview-ready' }, location.origin);
});
onBeforeUnmount(() => removeEventListener('message', onMessage));
</script>

<template>
  <KadView v-if="view" :key="view.template" :view="view" mode="preview" :show-cover="cover" :ready="ready" />
  <div v-else class="grid min-h-screen place-items-center bg-surface-50"><span class="size-6 animate-spin rounded-full border-2 border-line-200 border-t-ink-700" aria-hidden="true" /></div>
</template>
