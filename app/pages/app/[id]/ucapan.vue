<script setup lang="ts">
import { MessageSquareHeart, Mic, Eye, EyeOff, Trash2, Download, Play, Pause } from 'lucide-vue-next';
import { PageHead, Btn, Tabs, Chip, EmptyState, Sk, Alert, useUi } from '~/ui';

/**
 * The wishes, for the couple to read (and keep). Hide one and it leaves the
 * kad at once — a hidden voice note's link dies with it; delete removes the
 * words and the recording. "Download semua" is the keepsake: every wish as
 * text, every voice note as a file.
 */
definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();

interface Wish { id: string; name: string | null; kind: 'text' | 'audio'; body: string | null; status: string; createdAt: string; durationSec: number | null; audio: string | null }
type F = 'visible' | 'hidden';
const filter = ref<F>('visible');
const items = ref<Wish[]>([]);
const next = ref<string | null>(null);
const loading = ref(true);
async function load(reset = true) {
  if (reset) loading.value = true;
  try {
    const r = await $fetch<{ items: Wish[]; next: string | null }>(`/api/events/${id.value}/ucapan`, { query: { status: filter.value, cursor: reset ? undefined : next.value } });
    items.value = reset ? r.items : [...items.value, ...r.items]; next.value = r.next;
  } catch (e) { ui.error('Tak dapat load ucapan', apiError(e)); }
  finally { loading.value = false; }
}
onMounted(() => load());
watch(filter, () => load());

const busy = ref<string | null>(null);
async function act(w: Wish, action: 'hide' | 'show' | 'delete') {
  if (action === 'delete' && !confirm(`Padam ucapan ${w.name ?? 'tetamu'}? Tak boleh undo.`)) return;
  busy.value = w.id;
  try {
    await $fetch(`/api/events/${id.value}/ucapan`, { method: 'PATCH', body: { ids: [w.id], action } });
    items.value = items.value.filter(i => i.id !== w.id);
    ui.ok({ hide: 'Disembunyikan', show: 'Dipaparkan semula', delete: 'Dipadam' }[action]);
    void refresh();
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = null; }
}
const playing = ref<string | null>(null);
let player: HTMLAudioElement | null = null;
function play(w: Wish) {
  if (!w.audio) return;
  if (playing.value === w.id) { player?.pause(); playing.value = null; return; }
  player?.pause(); player = new Audio(w.audio); player.onended = () => { playing.value = null; };
  player.play().then(() => { playing.value = w.id; }, () => { playing.value = null; });
}
onBeforeUnmount(() => player?.pause());
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const tabs = computed(() => [{ key: 'visible' as F, label: 'Dipaparkan', count: filter.value === 'visible' && !loading.value ? items.value.length + (next.value ? '+' : '') : undefined }, { key: 'hidden' as F, label: 'Disembunyikan' }]);
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Ucapan" :sub="ev ? `${ev.ucapan} dipaparkan` : undefined">
      <Btn v-if="ev?.ucapan" :href="`/api/events/${id}/ucapan.zip`" download variant="primary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />Download semua</Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Alert v-if="ev && !ev.settings.modules.ucapan" tone="warning" title="Ucapan ditutup untuk tetamu" class="mb-4">Buka kat <NuxtLink :to="`/app/${id}/tetapan`" class="font-medium underline-offset-2 hover:underline">Tetapan → Tetamu</NuxtLink>.</Alert>
    <Alert v-else-if="ev?.settings.approvalMode" tone="info" title="Approval mode on" class="mb-4">Ucapan baru masuk ke Disembunyikan dulu — paparkan yang korang setuju.</Alert>
    <Tabs v-model="filter" :items="tabs" />

    <div v-if="loading" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"><div v-for="i in 6" :key="i" class="card p-4"><Sk w="40%" h="14px" :seed="i" /><Sk h="48px" class="mt-3" :seed="i * 2" /></div></div>
    <EmptyState v-else-if="!items.length" class="card mt-4" :title="filter === 'visible' ? 'Belum ada ucapan' : 'Tak ada yang disembunyikan'" :body="filter === 'visible' ? 'Tetamu boleh tulis atau rakam ucapan dari kad jemputan dan halaman ucapan.' : undefined">
      <template #icon><MessageSquareHeart class="size-5" :stroke-width="1.5" /></template>
    </EmptyState>
    <div v-else class="reveal-flat mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="w in items" :key="w.id" class="card flex flex-col p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="truncate text-[14px] font-semibold text-ink-900">{{ w.name || 'Tetamu' }}</p><p class="text-[12px] text-ink-500">{{ fmtDateTime(w.createdAt) }}</p></div>
          <Chip v-if="w.kind === 'audio'" tone="blue" size="sm"><Mic class="size-3" :stroke-width="2" aria-hidden="true" />Suara</Chip>
        </div>
        <p v-if="w.kind === 'text'" class="mt-2 flex-1 whitespace-pre-line break-words text-[14px] leading-[21px] text-ink-800">{{ w.body }}</p>
        <button v-else type="button" class="mt-3 inline-flex h-9 w-fit items-center gap-2 rounded-full border border-line-200 bg-surface-0 px-3 text-[13px] font-medium text-ink-800 hover:border-ink-300" :aria-pressed="playing === w.id" @click="play(w)">
          <component :is="playing === w.id ? Pause : Play" class="size-4" :stroke-width="2" aria-hidden="true" />{{ playing === w.id ? 'Berhenti' : 'Dengar' }}<span v-if="w.durationSec" class="tabular-nums text-ink-500">{{ mmss(w.durationSec) }}</span>
        </button>
        <div class="mt-3 flex justify-end gap-1 border-t border-line-100 pt-2">
          <Btn v-if="w.status === 'visible'" variant="ghost" size="xs" :loading="busy === w.id" @click="act(w, 'hide')"><EyeOff class="size-3.5" :stroke-width="1.75" aria-hidden="true" />Sembunyi</Btn>
          <Btn v-else variant="ghost" size="xs" :loading="busy === w.id" @click="act(w, 'show')"><Eye class="size-3.5" :stroke-width="1.75" aria-hidden="true" />Paparkan</Btn>
          <Btn variant="ghost" size="xs" :disabled="busy === w.id" :aria-label="`Padam ucapan ${w.name ?? 'tetamu'}`" @click="act(w, 'delete')"><Trash2 class="size-3.5 text-danger-600" :stroke-width="1.75" /></Btn>
        </div>
      </article>
    </div>
    <div v-if="next" class="mt-5 flex justify-center"><Btn variant="secondary" @click="load(false)">Tunjuk lagi</Btn></div>
  </div>
</template>
