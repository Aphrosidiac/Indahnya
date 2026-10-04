<script setup lang="ts">
import type { KadView as KadViewData } from '~~/shared/utils/kad-view';
import { isKadTemplate } from '~~/shared/utils/kad-templates';
import KadView from '~/components/kad/KadView.vue';

/**
 * The landing's phone frame. The sample kad (/aina-hakim), rendered by the
 * same component guests get, in preview mode (nothing autoplays, the forms
 * are inert). The landing re-dresses it by postMessage, same origin only:
 * a template and the visitor's own names, so "try a template" is the real
 * kad and not a picture of one.
 */
definePageMeta({ layout: 'bare' });
useSeoMeta({ robots: 'noindex, nofollow' });

const route = useRoute();
const { data } = await useFetch<{ kad: KadViewData | null }>('/api/g/aina-hakim/kad', { key: 'contoh-kad' });
const template = ref(isKadTemplate(route.query.t) ? route.query.t : null);
const names = ref<{ a: string; b: string } | null>(null);
const cover = ref(route.query.cover === '1');

const view = computed<KadViewData | null>(() => {
  const k = data.value?.kad;
  if (!k) return null;
  const n = names.value;
  return {
    ...k,
    template: template.value ?? k.template,
    names: n ? { a: n.a || k.names.a, b: n.b || k.names.b } : k.names,
    // a visitor who types names sees them in full on the invitation too, not Aina's parents' daughter
    fullNames: n ? { a: n.a || k.fullNames.a, b: n.b || k.fullNames.b } : k.fullNames,
  };
});

function onMessage(e: MessageEvent) {
  if (e.origin !== location.origin || e.data?.type !== 'kad-demo') return;
  if (isKadTemplate(e.data.template)) template.value = e.data.template;
  if (e.data.names) names.value = { a: String(e.data.names.a ?? '').slice(0, 40), b: String(e.data.names.b ?? '').slice(0, 40) };
  if (typeof e.data.cover === 'boolean') cover.value = e.data.cover;
}
onMounted(() => {
  addEventListener('message', onMessage);
  parent.postMessage({ type: 'kad-demo-ready' }, location.origin);
});
onBeforeUnmount(() => removeEventListener('message', onMessage));
</script>

<template>
  <KadView v-if="view" :key="view.template" :view="view" mode="preview" :show-cover="cover" :ready="17" />
  <div v-else class="grid min-h-screen place-items-center bg-surface-50"><span class="size-6 animate-spin rounded-full border-2 border-line-200 border-t-ink-700" aria-hidden="true" /></div>
</template>
