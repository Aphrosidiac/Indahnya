<script setup lang="ts">
import { Camera, Video, X, Download, Trash2, ChevronLeft, ChevronRight, RefreshCw, Check, Heart, PartyPopper, Smile } from 'lucide-vue-next';
import { Btn, Tabs, EmptyState, Sk, Modal, Field, Alert, Meter, useUi } from '~/ui';

definePageMeta({ layout: 'bare' });
const { slug, ev, me, t, lang, displayName, setMe, setMeta } = await useGuestEvent();
const ui = useUi();
setMeta({ title: `${t('gallery.title')} · ${displayName.value}`, description: t('gallery.upload.sub') });

interface Item { id: string; kind: 'photo' | 'video'; width: number | null; height: number | null; durationSec: number | null; createdAt: string; takenAt: string | null; guestName: string | null; url: string; thumb: string | null; poster: string | null; reactions: Record<string, number>; mine: string | null; canDelete: boolean }

/* ── the feed ─────────────────────────────────────────────────────── */
/**
 * The first page is fetched on the server, so a guest on dewan 4G sees
 * photos in the first paint instead of a skeleton and a second round trip.
 */
const { data: first } = await useFetch<{ items: Item[]; next: string | null }>(() => `/api/g/${slug.value}/media`, { key: `gm:${slug.value}` });
const filter = ref<'all' | 'mine'>('all');
const items = ref<Item[]>(first.value?.items ?? []);
const next = ref<string | null>(first.value?.next ?? null);
const loading = ref(!first.value);
const loadingMore = ref(false);
async function load(reset = true) {
  if (reset) { loading.value = true; next.value = null; } else loadingMore.value = true;
  try {
    const r = await $fetch<{ items: Item[]; next: string | null }>(`/api/g/${slug.value}/media`, { query: { cursor: reset ? undefined : next.value, mine: filter.value === 'mine' ? 1 : undefined } });
    items.value = reset ? r.items : [...items.value, ...r.items];
    next.value = r.next;
  } catch (e) { ui.error(apiError(e)); }
  finally { loading.value = false; loadingMore.value = false; }
}
watch(filter, () => load());
onMounted(() => { if (!first.value) void load(); });

/** New photos from other phones join the top every 20 s without a reload. */
let timer: ReturnType<typeof setInterval> | undefined;
async function refreshTop() {
  if (document.hidden || filter.value === 'mine') return;
  try {
    const r = await $fetch<{ items: Item[] }>(`/api/g/${slug.value}/media`, { query: { limit: 20 } });
    const have = new Set(items.value.map(i => i.id));
    const fresh = r.items.filter(i => !have.has(i.id));
    if (fresh.length) items.value = [...fresh, ...items.value];
  } catch { /* next time */ }
}
onMounted(() => { timer = setInterval(refreshTop, 20_000); });
onBeforeUnmount(() => clearInterval(timer));

/* infinite scroll */
const sentinel = ref<HTMLElement>();
onMounted(() => {
  const io = new IntersectionObserver((es) => { if (es[0]?.isIntersecting && next.value && !loadingMore.value) load(false); }, { rootMargin: '600px' });
  watch(sentinel, (el, old) => { if (old) io.unobserve(old); if (el) io.observe(el); }, { immediate: true });
  onBeforeUnmount(() => io.disconnect());
});

/* ── upload ───────────────────────────────────────────────────────── */
const up = useUploader(() => slug.value);
const input = ref<HTMLInputElement>();
const sheet = ref(false);
const askName = ref(false);
const nameDraft = ref('');
let pendingFiles: File[] | null = null;

function pick() { input.value?.click(); }
function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  (e.target as HTMLInputElement).value = '';
  if (!files.length) return;
  if (!me.value?.name && !skippedName.value) { pendingFiles = files; nameDraft.value = ''; askName.value = true; return; }
  start(files);
}
const skippedName = ref(false);
async function saveName(skip = false) {
  askName.value = false;
  if (skip) skippedName.value = true;
  else if (nameDraft.value.trim()) {
    try { const r = await $fetch<{ id: string; name: string | null }>(`/api/g/${slug.value}/name`, { method: 'POST', body: { name: nameDraft.value.trim() } }); setMe(r); }
    catch { /* not fatal */ }
  } else skippedName.value = true;
  if (pendingFiles) { start(pendingFiles); pendingFiles = null; }
}
function start(files: File[]) { sheet.value = true; up.add(files); }

/* when the batch lands, pull the feed so the new ones appear in place */
watch(() => up.active.value, async (a, was) => {
  if (was && !a) {
    await load();
    if (sheet.value) return; // the open sheet already says it, and a toast would cover its buttons
    const shown = up.done.value - up.awaiting.value;
    if (shown) ui.ok(t('gallery.done', { n: shown }));
    if (up.awaiting.value) ui.ok(t('gallery.pending', { n: up.awaiting.value }));
    if (up.failed.value) ui.error(t('gallery.failed', { n: up.failed.value }));
  }
});
const sheetTitle = computed(() => {
  if (up.offline.value) return t('gallery.offline');
  if (up.active.value) return t('gallery.uploading');
  if (up.failed.value) return t('gallery.failed', { n: up.failed.value });
  return up.awaiting.value ? t('gallery.pending', { n: up.awaiting.value }) : t('gallery.done', { n: up.done.value });
});

/* the floating button only while the in-page one is scrolled away: one obvious action at a time */
const inlineCta = ref<HTMLElement>();
const inlineVisible = ref(true);
onMounted(() => {
  if (!inlineCta.value) return;
  const io = new IntersectionObserver(([e]) => { inlineVisible.value = !!e?.isIntersecting; });
  io.observe(inlineCta.value);
  onBeforeUnmount(() => io.disconnect());
});
function closeSheet() { sheet.value = false; if (!up.active.value) up.clear(); }

/* ── lightbox + reactions ────────────────────────────────────────── */
const viewing = ref<Item | null>(null);
const idx = computed(() => viewing.value ? items.value.findIndex(i => i.id === viewing.value!.id) : -1);
function step(d: 1 | -1) { const n = items.value[idx.value + d]; if (n) viewing.value = n; }
function onKey(e: KeyboardEvent) { if (!viewing.value) return; if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'Escape') viewing.value = null; }
onMounted(() => addEventListener('keydown', onKey));
onBeforeUnmount(() => removeEventListener('keydown', onKey));

/* swipe between photos */
let touchX = 0;
function onTouchStart(e: TouchEvent) { touchX = e.touches[0]!.clientX; }
function onTouchEnd(e: TouchEvent) { const dx = e.changedTouches[0]!.clientX - touchX; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); }

const REACT = [{ kind: 'love', icon: Heart, label: t('react.love') }, { kind: 'party', icon: PartyPopper, label: t('react.party') }, { kind: 'cry', icon: Smile, label: t('react.cry') }] as const;
async function react(m: Item, kind: 'love' | 'party' | 'cry') {
  const next = m.mine === kind ? null : kind;
  try { const r = await $fetch<{ mine: string | null; reactions: Record<string, number> }>(`/api/g/${slug.value}/media/${m.id}/react`, { method: 'POST', body: { kind: next } }); m.mine = r.mine; m.reactions = r.reactions; }
  catch (e) { ui.error(apiError(e)); }
}
async function remove(m: Item) {
  if (!confirm(t('gallery.delete.confirm'))) return;
  try { await $fetch(`/api/g/${slug.value}/media/${m.id}`, { method: 'DELETE' }); items.value = items.value.filter(i => i.id !== m.id); viewing.value = null; }
  catch (e) { ui.error(apiError(e)); }
}
const total = (m: Item) => Object.values(m.reactions).reduce((a, b) => a + b, 0);
</script>

<template>
  <GuestShell :ev="ev" :title="displayName" :t="t">
    <div class="reveal pt-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="shrink-0 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-ink-900">{{ t('gallery.title') }}</h1>
        <Tabs v-model="filter" :items="[{ key: 'all', label: t('gallery.all') }, { key: 'mine', label: t('gallery.mine') }]" />
      </div>

      <Alert v-if="ev.demo" tone="success" :title="t('demo.title')" class="mt-3">
        {{ t('demo.body') }}
        <span class="mt-2.5 block"><Btn to="/app?new=1" variant="primary" size="sm">{{ t('demo.cta') }}</Btn></span>
      </Alert>
      <Alert v-else-if="!ev.uploadsOpen" tone="muted" :title="t('gallery.closed')" class="mt-3">{{ t('gallery.closed.sub') }}</Alert>

      <!-- the one obvious thing to do: green, ink text, once on the page -->
      <button v-if="ev.uploadsOpen" type="button"
        ref="inlineCta"
        class="card mt-3 flex w-full items-center gap-3 p-4 text-left transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:shadow-md active:scale-[0.99] sm:hidden"
        @click="pick">
        <span class="grid size-11 shrink-0 place-items-center rounded-[12px] bg-primary-400 text-ink-900"><Camera class="size-5" :stroke-width="1.75" aria-hidden="true" /></span>
        <span class="min-w-0 flex-1"><span class="block text-[15px] font-semibold leading-5 text-ink-900">{{ t('gallery.upload') }}</span><span class="block text-[13px] leading-[18px] text-ink-500">{{ t('gallery.upload.sub') }}</span></span>
      </button>
      <div v-if="ev.uploadsOpen" class="mt-3 hidden sm:block">
        <Btn variant="accent" size="lg" @click="pick"><Camera class="size-[18px]" :stroke-width="1.75" aria-hidden="true" />{{ t('gallery.upload') }}</Btn>
        <span class="ml-3 text-[13px] text-ink-500">{{ t('gallery.limit.video') }}</span>
      </div>
      <input ref="input" type="file" multiple accept="image/*,video/*" class="hidden" @change="onFiles" />

      <div v-if="loading" class="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6">
        <Sk v-for="i in 18" :key="i" h="auto" class="aspect-square" :seed="i" />
      </div>
      <EmptyState v-else-if="!items.length" class="card mt-4" :title="filter === 'mine' ? t('gallery.mine') : t('gallery.empty')" :body="filter === 'mine' ? undefined : t('gallery.empty.sub')">
        <template #icon><Camera class="size-5" :stroke-width="1.5" /></template>
      </EmptyState>
      <div v-else class="reveal-flat mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6">
        <button v-for="m in items" :key="m.id" type="button" class="group relative aspect-square overflow-hidden rounded-[8px] bg-sand sm:rounded-[10px]"
          :aria-label="m.guestName ? t('gallery.photo.by', { name: m.guestName }) : m.kind === 'video' ? t('gallery.video') : t('gallery.photo')" @click="viewing = m">
          <img :src="m.thumb ?? m.poster ?? m.url" alt="" class="size-full object-cover transition-transform duration-[240ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.03]" loading="lazy" decoding="async" />
          <span v-if="m.kind === 'video'" class="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-full bg-ink-900/70 px-1.5 text-[10px] font-medium text-white"><Video class="size-3" :stroke-width="2" aria-hidden="true" />{{ m.durationSec }}s</span>
          <span v-if="total(m)" class="pointer-events-none absolute bottom-1.5 right-1.5 inline-flex h-5 items-center gap-0.5 rounded-full bg-white/90 px-1.5 text-[10px] font-medium text-ink-900"><Heart class="size-3 fill-danger-600 text-danger-600" :stroke-width="2" aria-hidden="true" />{{ total(m) }}</span>
        </button>
      </div>
      <div ref="sentinel" class="h-px" />
      <div v-if="loadingMore" class="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6"><Sk v-for="i in 6" :key="i" h="auto" class="aspect-square" :seed="i + 30" /></div>
    </div>

    <!-- phone: the upload button rides above the tab bar -->
    <Transition name="pop">
    <div v-if="ev.uploadsOpen && !inlineVisible" class="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 pb-3 sm:hidden">
      <button type="button" class="inline-flex h-12 items-center gap-2 rounded-full bg-ink-700 px-5 text-[15px] font-medium text-white shadow-lg transition-transform duration-[120ms] active:scale-[0.97]" @click="pick">
        <Camera class="size-5" :stroke-width="1.75" aria-hidden="true" />{{ t('gallery.upload') }}
      </button>
    </div>
    </Transition>
  </GuestShell>

  <!-- name prompt -->
  <Modal :open="askName" :title="t('gallery.name.title')" :subtitle="t('gallery.name.sub')" @close="saveName(true)">
    <form @submit.prevent="saveName()">
      <Field v-slot="{ id }" :label="t('gallery.name.title')"><input :id="id" v-model="nameDraft" type="text" :placeholder="t('gallery.name.placeholder')" autocomplete="name" maxlength="60" /></Field>
      <div class="mt-5 flex justify-end gap-2"><Btn variant="secondary" @click="saveName(true)">{{ t('gallery.name.skip') }}</Btn><Btn type="submit" variant="primary">{{ t('gallery.name.save') }}</Btn></div>
    </form>
  </Modal>

  <!-- upload sheet -->
  <Teleport to="body">
    <Transition name="veil"><div v-if="sheet" class="fixed inset-0 z-50 bg-ink-900/30" @click="closeSheet" /></Transition>
    <Transition name="pop">
      <div v-if="sheet" class="card fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80vh] w-full max-w-[560px] overflow-hidden rounded-b-none pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:rounded-b-[16px] sm:pb-0" role="dialog" aria-modal="true" :aria-label="t('gallery.upload')">
        <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div class="min-w-0" aria-live="polite"><p class="text-[15px] font-semibold leading-6 text-ink-900">{{ sheetTitle }}</p><p class="text-[12px] leading-4 text-ink-500">{{ up.done.value }} / {{ up.items.value.length }}</p></div>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-500 hover:bg-sand hover:text-ink-900" :aria-label="t('gallery.close')" @click="closeSheet"><X class="size-[18px]" :stroke-width="1.75" /></button>
        </div>
        <Meter bare :pct="up.items.value.length ? Math.round(up.items.value.reduce((a, i) => a + (i.state === 'ready' ? 100 : i.state === 'failed' ? 0 : i.pct), 0) / up.items.value.length) : 0" tone="green" class="mx-5" />
        <ul class="mt-3 max-h-[52vh] divide-y divide-line-100 overflow-y-auto border-t border-line-100">
          <li v-for="it in up.items.value" :key="it.key" class="flex items-center gap-3 px-5 py-2.5">
            <span class="size-10 shrink-0 overflow-hidden rounded-[8px] bg-sand"><img v-if="it.thumb ?? it.preview" :src="(it.thumb ?? it.preview)!" alt="" class="size-full object-cover" /><span v-else class="grid size-full place-items-center text-ink-400"><Video class="size-4" :stroke-width="1.75" /></span></span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13px] leading-[18px] text-ink-900">{{ it.name }}</span>
              <span class="block truncate text-[12px] leading-4" :class="it.state === 'failed' ? 'text-danger-600' : 'text-ink-500'">
                {{ it.state === 'failed' ? it.error : it.state === 'ready' ? (it.awaiting ? t('gallery.pending.item') : '✓') : it.state === 'processing' ? t('gallery.processing') : it.state === 'uploading' ? `${it.pct}%` : it.state === 'offline' ? t('gallery.offline') : '…' }}
              </span>
            </span>
            <Check v-if="it.state === 'ready'" class="size-5 shrink-0 text-success-600" :stroke-width="2" aria-hidden="true" />
            <button v-else-if="it.state === 'failed'" type="button" class="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-600 hover:bg-sand" :aria-label="t('gallery.retry')" @click="up.retry(it)"><RefreshCw class="size-4" :stroke-width="1.75" /></button>
            <span v-else class="size-5 shrink-0 animate-spin rounded-full border-2 border-line-200 border-t-ink-700" aria-hidden="true" />
          </li>
        </ul>
        <div class="flex gap-2 border-t border-line-100 bg-surface-50 px-5 py-3">
          <Btn v-if="ev.uploadsOpen" variant="secondary" block @click="pick"><Camera class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ t('gallery.add') }}</Btn>
          <Btn variant="primary" block @click="closeSheet">{{ t('gallery.ok') }}</Btn>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- lightbox -->
  <Teleport to="body">
    <Transition name="veil">
      <div v-if="viewing" class="fixed inset-0 z-[60] flex flex-col bg-ink-900/95" role="dialog" aria-modal="true" :aria-label="viewing.guestName ? t('gallery.photo.by', { name: viewing.guestName }) : t('gallery.photo')" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd" @click.self="viewing = null">
        <div class="flex items-center justify-between gap-3 p-3 text-white">
          <div class="min-w-0 px-1">
            <p class="truncate text-[13px] font-medium leading-5">{{ viewing.guestName || t('gallery.anon') }}</p>
            <p class="truncate text-[12px] leading-4 text-white/60">{{ fmtDateTime(viewing.takenAt ?? viewing.createdAt, lang) }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <a :href="`/api/g/${slug}/media/${viewing.id}/download`" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" :aria-label="t('gallery.download')"><Download class="size-[18px]" :stroke-width="1.75" /></a>
            <button v-if="viewing.canDelete" type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" :aria-label="t('gallery.delete')" @click="remove(viewing)"><Trash2 class="size-[18px]" :stroke-width="1.75" /></button>
            <button type="button" class="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white" :aria-label="t('gallery.close')" @click="viewing = null"><X class="size-5" :stroke-width="1.75" /></button>
          </div>
        </div>
        <button v-if="idx > 0" type="button" class="absolute left-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid" :aria-label="t('gallery.prev')" @click="step(-1)"><ChevronLeft class="size-6" :stroke-width="1.75" /></button>
        <button v-if="idx < items.length - 1" type="button" class="absolute right-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid" :aria-label="t('gallery.next')" @click="step(1)"><ChevronRight class="size-6" :stroke-width="1.75" /></button>
        <div class="flex min-h-0 flex-1 items-center justify-center p-2" @click.self="viewing = null">
          <video v-if="viewing.kind === 'video'" :key="viewing.id" :src="viewing.url" :poster="viewing.poster ?? undefined" controls autoplay playsinline class="max-h-full max-w-full rounded-[12px]" />
          <img v-else :key="viewing.id" :src="viewing.url" alt="" class="reveal-flat max-h-full max-w-full rounded-[12px] object-contain" />
        </div>
        <div class="flex items-center justify-center gap-2 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button v-for="r in REACT" :key="r.kind" type="button"
            class="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-[background-color,transform] duration-[120ms] active:scale-[0.95]"
            :aria-pressed="viewing.mine === r.kind"
            :class="viewing.mine === r.kind ? 'bg-primary-400 text-ink-900' : 'bg-white/10 text-white hover:bg-white/20'" @click="react(viewing, r.kind)">
            <component :is="r.icon" class="size-4" :stroke-width="2" aria-hidden="true" />{{ r.label }}<span v-if="viewing.reactions[r.kind]" class="num">{{ viewing.reactions[r.kind] }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
