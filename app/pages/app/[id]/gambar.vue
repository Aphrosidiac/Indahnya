<script setup lang="ts">
import { Download, Eye, EyeOff, Trash2, Video, CheckSquare, Square, X, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-vue-next';
import { PageHead, Btn, Tabs, Chip, EmptyState, Sk, Modal, useUi } from '~/ui';

definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();

interface Item { id: string; kind: 'photo' | 'video'; status: string; width: number | null; height: number | null; durationSec: number | null; bytes: number; takenAt: string | null; createdAt: string; guestName: string | null; error: string | null; url: string | null; thumb: string | null; poster: string | null }

type Filter = 'ready' | 'hidden' | 'uploaded,pending' | 'failed';
const filter = ref<Filter>('ready');
const tabs = computed(() => [
  { key: 'ready' as Filter, label: 'Dipaparkan', count: ev.value?.counts.ready },
  { key: 'hidden' as Filter, label: 'Disembunyikan', count: ev.value?.counts.hidden },
  { key: 'uploaded,pending' as Filter, label: 'Tengah proses', count: (ev.value?.counts.uploaded ?? 0) + (ev.value?.counts.pending ?? 0) || undefined, tone: 'amber' as const },
  { key: 'failed' as Filter, label: 'Gagal', count: ev.value?.counts.failed || undefined, tone: 'red' as const },
]);

const items = ref<Item[]>([]);
const next = ref<string | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
const selected = reactive(new Set<string>());

async function load(reset = true) {
  if (reset) { loading.value = true; items.value = []; next.value = null; selected.clear(); }
  else loadingMore.value = true;
  try {
    const r = await $fetch<{ items: Item[]; next: string | null }>(`/api/events/${id.value}/media`, { query: { status: filter.value, cursor: reset ? undefined : next.value, limit: 60 } });
    items.value = reset ? r.items : [...items.value, ...r.items];
    next.value = r.next;
  } catch (e) { ui.error('Tak dapat load gambar', apiError(e)); }
  finally { loading.value = false; loadingMore.value = false; }
}
watch(filter, () => load());
onMounted(() => load());

/* processing tab refreshes itself: the worker is usually seconds away */
let timer: ReturnType<typeof setInterval> | undefined;
watch(filter, f => { clearInterval(timer); if (f === 'uploaded,pending') timer = setInterval(() => { load(); refresh(); }, 4000); }, { immediate: true });
onBeforeUnmount(() => clearInterval(timer));

const allSelected = computed(() => items.value.length > 0 && items.value.every(i => selected.has(i.id)));
function toggleAll() { if (allSelected.value) selected.clear(); else items.value.forEach(i => selected.add(i.id)); }
function toggle(i: Item, e?: MouseEvent) {
  if (e?.shiftKey && lastClicked && lastClicked !== i.id) {
    const a = items.value.findIndex(x => x.id === lastClicked), b = items.value.findIndex(x => x.id === i.id);
    for (const x of items.value.slice(Math.min(a, b), Math.max(a, b) + 1)) selected.add(x.id);
  } else if (selected.has(i.id)) selected.delete(i.id); else selected.add(i.id);
  lastClicked = i.id;
}
let lastClicked: string | null = null;

const confirmDelete = ref(false);
const busy = ref(false);
async function act(action: 'hide' | 'show' | 'delete', ids = [...selected]) {
  if (!ids.length || busy.value) return;
  busy.value = true;
  try {
    const r = await $fetch<{ n: number }>(`/api/events/${id.value}/media`, { method: 'PATCH', body: { ids, action } });
    ui.ok({ hide: 'Disembunyikan', show: 'Dipaparkan semula', delete: 'Dipadam' }[action], `${r.n} fail`);
    confirmDelete.value = false;
    viewing.value = null;
    await Promise.all([load(), refresh()]);
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}

/* lightbox */
const viewing = ref<Item | null>(null);
const viewIndex = computed(() => viewing.value ? items.value.findIndex(i => i.id === viewing.value!.id) : -1);
function step(d: 1 | -1) { const n = items.value[viewIndex.value + d]; if (n) viewing.value = n; }
function onKey(e: KeyboardEvent) {
  if (!viewing.value) return;
  if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'Escape') viewing.value = null;
}
onMounted(() => addEventListener('keydown', onKey));
onBeforeUnmount(() => removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Gambar" :sub="ev ? `${ev.counts.ready} dipaparkan · ${ev.counts.hidden} disembunyikan` : undefined">
      <Btn variant="secondary" size="sm" @click="load(); refresh()"><RefreshCw class="size-4" :stroke-width="1.75" aria-hidden="true" /><span class="max-sm:hidden">Refresh</span></Btn>
      <a v-if="ev" :href="`/api/events/${ev.id}/download`">
        <Btn variant="primary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />Download semua</Btn>
      </a>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Tabs v-model="filter" :items="tabs" />
      <div class="flex items-center gap-2">
        <button type="button" class="inline-flex h-[30px] items-center gap-1.5 rounded-[8px] px-2 text-[13px] text-ink-600 transition-colors hover:bg-sand hover:text-ink-900" @click="toggleAll">
          <component :is="allSelected ? CheckSquare : Square" class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ allSelected ? 'Batal pilih' : 'Pilih semua' }}
        </button>
      </div>
    </div>

    <!-- the selection bar: appears above the grid, never covers it -->
    <Transition name="drop">
      <div v-if="selected.size" class="card mt-3 flex flex-wrap items-center gap-2 px-3 py-2">
        <Chip tone="dark">{{ selected.size }} dipilih</Chip>
        <span class="flex-1" />
        <Btn v-if="filter === 'ready'" variant="secondary" size="sm" :loading="busy" @click="act('hide')"><EyeOff class="size-4" :stroke-width="1.75" aria-hidden="true" />Sembunyi</Btn>
        <Btn v-if="filter === 'hidden'" variant="secondary" size="sm" :loading="busy" @click="act('show')"><Eye class="size-4" :stroke-width="1.75" aria-hidden="true" />Paparkan</Btn>
        <Btn variant="danger-ghost" size="sm" @click="confirmDelete = true"><Trash2 class="size-4" :stroke-width="1.75" aria-hidden="true" />Padam</Btn>
        <Btn variant="ghost" size="sm" aria-label="Batal" @click="selected.clear()"><X class="size-4" :stroke-width="1.75" /></Btn>
      </div>
    </Transition>

    <div v-if="loading" class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      <Sk v-for="i in 16" :key="i" h="auto" class="aspect-square" :seed="i" />
    </div>

    <EmptyState v-else-if="!items.length" class="card mt-4"
      :title="filter === 'ready' ? 'Belum ada gambar' : filter === 'hidden' ? 'Tak ada yang disembunyikan' : filter === 'failed' ? 'Tak ada yang gagal' : 'Tak ada yang tengah proses'"
      :body="filter === 'ready' ? 'Bila tetamu upload, gambar akan muncul kat sini.' : undefined" />

    <div v-else class="reveal-flat mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      <div v-for="m in items" :key="m.id" class="group relative aspect-square overflow-hidden rounded-[10px] bg-sand ring-offset-2 ring-offset-surface-50 transition-[box-shadow] duration-[120ms]"
        :class="selected.has(m.id) && 'ring-2 ring-ink-900'">
        <button type="button" class="absolute inset-0" :aria-label="m.guestName ? `Gambar oleh ${m.guestName}` : 'Gambar'" @click="m.status === 'ready' || m.status === 'hidden' ? viewing = m : toggle(m, $event)">
          <img v-if="m.thumb ?? m.poster" :src="(m.thumb ?? m.poster)!" alt="" class="size-full object-cover" loading="lazy" />
          <span v-else-if="m.status === 'failed'" class="grid size-full place-items-center text-danger-600"><AlertCircle class="size-6" :stroke-width="1.5" aria-hidden="true" /></span>
          <span v-else class="skeleton block size-full rounded-none" />
        </button>
        <button type="button" class="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-[6px] bg-white/90 text-ink-900 shadow-xs transition-opacity duration-[120ms]"
          :class="selected.has(m.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 max-lg:opacity-100'"
          :aria-pressed="selected.has(m.id)" aria-label="Pilih" @click.stop="toggle(m, $event)">
          <component :is="selected.has(m.id) ? CheckSquare : Square" class="size-4" :stroke-width="2" aria-hidden="true" />
        </button>
        <span v-if="m.kind === 'video'" class="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-full bg-ink-900/70 px-1.5 text-[10px] font-medium text-white">
          <Video class="size-3" :stroke-width="2" aria-hidden="true" />{{ m.durationSec ?? '' }}{{ m.durationSec ? 's' : '' }}
        </span>
        <span v-if="m.guestName" class="pointer-events-none absolute bottom-1.5 right-1.5 max-w-[70%] truncate rounded-full bg-ink-900/60 px-1.5 text-[10px] leading-5 text-white">{{ m.guestName }}</span>
      </div>
    </div>

    <div v-if="next" class="mt-5 flex justify-center">
      <Btn variant="secondary" :loading="loadingMore" @click="load(false)">Tunjuk lagi</Btn>
    </div>
  </div>

  <!-- lightbox -->
  <Teleport to="body">
    <Transition name="veil">
      <div v-if="viewing" class="fixed inset-0 z-[60] bg-ink-900/95" @click.self="viewing = null">
        <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3 text-white">
          <div class="min-w-0 px-1">
            <p class="truncate text-[13px] font-medium leading-5">{{ viewing.guestName || 'Tetamu' }}</p>
            <p class="truncate text-[12px] leading-4 text-white/60">{{ fmtDateTime(viewing.takenAt ?? viewing.createdAt) }} · {{ fmtBytes(viewing.bytes) }}<span v-if="viewing.width"> · {{ viewing.width }}×{{ viewing.height }}</span></p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <a :href="viewing.url!" download class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Download"><Download class="size-[18px]" :stroke-width="1.75" /></a>
            <button v-if="viewing.status === 'ready'" type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Sembunyi" @click="act('hide', [viewing.id])"><EyeOff class="size-[18px]" :stroke-width="1.75" /></button>
            <button v-else type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Paparkan" @click="act('show', [viewing.id])"><Eye class="size-[18px]" :stroke-width="1.75" /></button>
            <button type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Padam" @click="selected.clear(); selected.add(viewing.id); confirmDelete = true"><Trash2 class="size-[18px]" :stroke-width="1.75" /></button>
            <button type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Tutup" @click="viewing = null"><X class="size-5" :stroke-width="1.75" /></button>
          </div>
        </div>
        <button v-if="viewIndex > 0" type="button" class="absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Sebelum" @click="step(-1)"><ChevronLeft class="size-6" :stroke-width="1.75" /></button>
        <button v-if="viewIndex < items.length - 1" type="button" class="absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Seterusnya" @click="step(1)"><ChevronRight class="size-6" :stroke-width="1.75" /></button>
        <div class="flex size-full items-center justify-center p-4 pt-16">
          <video v-if="viewing.kind === 'video'" :key="viewing.id" :src="viewing.url!" :poster="viewing.poster ?? undefined" controls autoplay playsinline class="max-h-full max-w-full rounded-[12px]" />
          <img v-else :key="viewing.id" :src="viewing.url!" alt="" class="reveal-flat max-h-full max-w-full rounded-[12px] object-contain" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <Modal :open="confirmDelete" title="Padam gambar?" :subtitle="`${selected.size} fail akan dipadam terus. Tak boleh undo.`" @close="confirmDelete = false">
    <div class="flex justify-end gap-2">
      <Btn variant="secondary" @click="confirmDelete = false">Batal</Btn>
      <Btn variant="danger" :loading="busy" @click="act('delete')">Padam {{ selected.size }} fail</Btn>
    </div>
  </Modal>
</template>
