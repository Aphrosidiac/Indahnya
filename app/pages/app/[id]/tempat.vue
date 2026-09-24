<script setup lang="ts">
import { Armchair, Plus, Trash2, Pencil, Users, GripVertical, Search, Printer } from 'lucide-vue-next';
import { PageHead, Btn, KpiStrip, Stat, Meter, Modal, Field, Alert, EmptyState, Sk, useUi } from '~/ui';

/**
 * The seating board. Left: everyone coming who has no table yet. Right: the
 * tables, each with its guests and how full it is. Drag a guest onto a
 * table (or back to the list) on a desk; on a phone, every guest has a
 * "Meja" picker instead — dragging with a thumb over a scrolling page is a
 * fight nobody wins. Every move saves at once.
 */
definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();

interface Guest { id: string; name: string; pax: number; side: string | null; tableId: string | null; attending: boolean }
interface Table { id: string; name: string; capacity: number; seated: number; sort: number }
const guests = ref<Guest[]>([]);
const tables = ref<Table[]>([]);
const loading = ref(true);

async function load() {
  try {
    const [r, t] = await Promise.all([
      $fetch<{ items: Guest[] }>(`/api/events/${id.value}/rsvps`, { query: { status: 'yes', sort: 'name' } }),
      $fetch<Table[]>(`/api/events/${id.value}/tables`),
    ]);
    guests.value = r.items; tables.value = t;
  } catch (e) { ui.error('Tak dapat load tempat duduk', apiError(e)); }
  finally { loading.value = false; }
}
onMounted(load);

const byTable = computed(() => {
  const m = new Map<string, Guest[]>();
  for (const g of guests.value) if (g.tableId) (m.get(g.tableId) ?? m.set(g.tableId, []).get(g.tableId)!).push(g);
  return m;
});
const seatedOf = (t: Table) => (byTable.value.get(t.id) ?? []).reduce((a, g) => a + g.pax, 0);
const q = ref('');
const unseated = computed(() => guests.value.filter(g => !g.tableId && (!q.value.trim() || g.name.toLowerCase().includes(q.value.trim().toLowerCase()))));
const totals = computed(() => {
  const pax = guests.value.reduce((a, g) => a + g.pax, 0);
  const seated = guests.value.filter(g => g.tableId).reduce((a, g) => a + g.pax, 0);
  const seats = tables.value.reduce((a, t) => a + t.capacity, 0);
  return { pax, seated, seats, waiting: guests.value.filter(g => !g.tableId).length };
});

/* ── moving guests (optimistic, rolled back on error) ── */
async function moveGuest(gid: string, tableId: string | null) {
  const g = guests.value.find(x => x.id === gid); if (!g || g.tableId === tableId) return;
  const before = g.tableId;
  g.tableId = tableId;
  try { await $fetch(`/api/events/${id.value}/seating`, { method: 'PATCH', body: { moves: [{ rsvpId: gid, tableId }] } }); void refresh(); }
  catch (e) { g.tableId = before; ui.error('Tak jadi', apiError(e)); }
}
const dragging = ref<string | null>(null);
const over = ref<string | null>(null);
function onDragStart(e: DragEvent, g: Guest) { dragging.value = g.id; e.dataTransfer?.setData('text/plain', g.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; }
function onDrop(e: DragEvent, tableId: string | null) {
  const gid = e.dataTransfer?.getData('text/plain') || dragging.value;
  dragging.value = null; over.value = null;
  if (gid) void moveGuest(gid, tableId);
}

/* ── tables ── */
const addOpen = ref(false);
const addForm = reactive({ mode: 'bulk' as 'bulk' | 'one', count: 10, capacity: 10, name: '' });
const busy = ref(false);
async function addTables() {
  busy.value = true;
  try {
    const body = addForm.mode === 'bulk' ? { count: addForm.count, capacity: addForm.capacity } : { name: addForm.name.trim() || `Meja ${tables.value.length + 1}`, capacity: addForm.capacity };
    await $fetch(`/api/events/${id.value}/tables`, { method: 'POST', body });
    addOpen.value = false; addForm.name = ''; await load();
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
const editT = ref<Table | null>(null);
const editForm = reactive({ name: '', capacity: 10 });
function openEdit(t: Table) { editT.value = t; Object.assign(editForm, { name: t.name, capacity: t.capacity }); }
async function saveTable() {
  if (!editT.value) return;
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}/tables/${editT.value.id}`, { method: 'PATCH', body: { name: editForm.name.trim(), capacity: editForm.capacity } }); editT.value = null; await load(); }
  catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
async function deleteTable() {
  const t = editT.value; if (!t) return;
  const n = (byTable.value.get(t.id) ?? []).length;
  if (!confirm(n ? `Padam ${t.name}? ${n} tetamu akan kembali ke senarai belum ada meja.` : `Padam ${t.name}?`)) return;
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}/tables/${t.id}`, { method: 'DELETE' }); editT.value = null; await load(); void refresh(); }
  catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
const SIDE: Record<string, string> = { lelaki: 'L', perempuan: 'P', rakan: 'K', lain: '·' };
const tempatOn = computed(() => !!ev.value?.settings.modules.tempat);
const printList = () => window.print();
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Tempat duduk" :sub="`${totals.seated} / ${totals.pax} pax dah ada meja`">
      <Btn v-if="tables.length" variant="secondary" size="sm" class="max-sm:hidden" @click="printList"><Printer class="size-4" :stroke-width="1.75" aria-hidden="true" />Cetak</Btn>
      <Btn variant="primary" size="sm" @click="addOpen = true"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Meja</Btn>
    </PageHead>
  </Teleport>

  <div class="seating px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Alert v-if="ev && !tempatOn" tone="info" title="Carian meja untuk tetamu belum dibuka" class="mb-4 print:hidden">Susun meja kat sini dulu. Bila dah siap, buka <NuxtLink :to="`/app/${id}/tetapan`" class="font-medium underline-offset-2 hover:underline">Tetapan → Tetamu → Tempat duduk</NuxtLink> supaya tetamu boleh cari nombor meja sendiri.</Alert>

    <KpiStrip :loading="loading" class="print:hidden">
      <Stat label="Pax hadir" :value="totals.pax" :icon="Users" :sub="`${guests.length} RSVP`" />
      <Stat label="Dah ada meja" :value="totals.seated" :icon="Armchair" sub="pax" />
      <Stat label="Belum ada meja" :value="totals.waiting" :icon="Users" sub="RSVP" :delta="totals.waiting ? 'perlu disusun' : undefined" delta-tone="amber" />
      <Stat label="Kerusi" :value="totals.seats" :icon="Armchair" :sub="`${tables.length} meja`" :delta="totals.seats && totals.pax > totals.seats ? `kurang ${totals.pax - totals.seats}` : undefined" delta-tone="red" />
    </KpiStrip>

    <div v-if="loading" class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]"><div class="card p-4"><Sk h="300px" /></div><div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"><div v-for="i in 6" :key="i" class="card p-4"><Sk h="120px" :seed="i" /></div></div></div>

    <div v-else class="reveal mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <!-- waiting list -->
      <div class="card flex flex-col overflow-hidden print:hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]"
        :class="over === 'none' && 'ring-2 ring-ink-900'" @dragover.prevent="over = 'none'" @dragleave="over = null" @drop.prevent="onDrop($event, null)">
        <div class="border-b border-line-100 px-4 py-3">
          <p class="text-[14px] font-semibold text-ink-900">Belum ada meja <span class="font-normal text-ink-500">{{ totals.waiting }}</span></p>
          <label class="relative mt-2 block">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" :stroke-width="1.75" aria-hidden="true" />
            <input v-model="q" type="search" class="field h-[34px] rounded-full pl-9 text-[13px]" placeholder="Cari nama" aria-label="Cari tetamu" />
          </label>
        </div>
        <ul class="min-h-[120px] flex-1 space-y-1.5 overflow-y-auto p-3">
          <li v-for="g in unseated" :key="g.id" draggable="true" class="group flex items-center gap-2 rounded-[10px] border border-line-100 bg-surface-0 py-1.5 pl-1.5 pr-2 shadow-xs"
            :class="dragging === g.id && 'opacity-50'" @dragstart="onDragStart($event, g)" @dragend="dragging = null; over = null">
            <GripVertical class="size-4 shrink-0 cursor-grab text-ink-300 max-lg:hidden" :stroke-width="1.75" aria-hidden="true" />
            <span class="min-w-0 flex-1"><span class="block truncate text-[13px] font-medium text-ink-900">{{ g.name }}</span><span class="block text-[11px] text-ink-500">{{ g.pax }} pax<template v-if="g.side"> · {{ SIDE[g.side] }}</template></span></span>
            <select class="field h-8 w-[104px] shrink-0 text-[12px]" :aria-label="`Meja untuk ${g.name}`" :value="''" @change="moveGuest(g.id, ($event.target as HTMLSelectElement).value || null)">
              <option value="">Meja…</option>
              <option v-for="t in tables" :key="t.id" :value="t.id">{{ t.name }} ({{ seatedOf(t) }}/{{ t.capacity }})</option>
            </select>
          </li>
          <li v-if="!unseated.length" class="px-2 py-6 text-center text-[13px] text-ink-500">{{ guests.length ? (q ? 'Tak jumpa' : 'Semua dah ada meja 🎉') : 'Belum ada tetamu yang RSVP hadir.' }}</li>
        </ul>
      </div>

      <!-- tables -->
      <div>
        <EmptyState v-if="!tables.length" class="card" title="Belum ada meja" body="Tambah meja dulu — contohnya 30 meja × 10 kerusi sekali gus — kemudian tarik tetamu ke meja masing-masing.">
          <template #icon><Armchair class="size-5" :stroke-width="1.5" /></template>
          <Btn variant="accent" @click="addOpen = true"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Tambah meja</Btn>
        </EmptyState>
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="t in tables" :key="t.id" class="card flex flex-col p-4 transition-shadow duration-[120ms] print:break-inside-avoid print:shadow-none"
            :class="over === t.id && 'ring-2 ring-ink-900'" @dragover.prevent="over = t.id" @dragleave="over === t.id && (over = null)" @drop.prevent="onDrop($event, t.id)">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0"><p class="truncate text-[15px] font-semibold text-ink-900">{{ t.name }}</p><p class="text-[12px] text-ink-500">{{ seatedOf(t) }} / {{ t.capacity }} kerusi</p></div>
              <Btn variant="ghost" size="xs" class="print:hidden" :aria-label="`Ubah ${t.name}`" @click="openEdit(t)"><Pencil class="size-3.5" :stroke-width="1.75" /></Btn>
            </div>
            <Meter bare class="mt-2" :pct="Math.min(100, Math.round((seatedOf(t) / t.capacity) * 100))" :tone="seatedOf(t) > t.capacity ? 'red' : seatedOf(t) === t.capacity ? 'green' : 'neutral'" />
            <ul class="mt-3 min-h-[44px] flex-1 space-y-1">
              <li v-for="g in byTable.get(t.id) ?? []" :key="g.id" draggable="true" class="group flex items-center gap-2 rounded-[8px] px-1.5 py-1 hover:bg-surface-50"
                :class="dragging === g.id && 'opacity-50'" @dragstart="onDragStart($event, g)" @dragend="dragging = null; over = null">
                <span class="min-w-0 flex-1 truncate text-[13px] text-ink-800">{{ g.name }}</span>
                <span class="shrink-0 text-[12px] tabular-nums text-ink-500">{{ g.pax }}</span>
                <button type="button" class="grid size-6 shrink-0 place-items-center rounded-full text-ink-400 opacity-100 hover:text-ink-900 lg:opacity-0 lg:group-hover:opacity-100 print:hidden" :aria-label="`Keluarkan ${g.name} dari ${t.name}`" @click="moveGuest(g.id, null)">×</button>
              </li>
              <li v-if="!(byTable.get(t.id) ?? []).length" class="rounded-[8px] border border-dashed border-line-200 px-2 py-3 text-center text-[12px] text-ink-400 print:hidden">Tarik tetamu ke sini</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Modal :open="addOpen" title="Tambah meja" @close="addOpen = false">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="rounded-md border px-3 py-2.5 text-left text-[13px]" :class="addForm.mode === 'bulk' ? 'border-ink-900 ring-1 ring-ink-900' : 'border-line-200'" @click="addForm.mode = 'bulk'"><span class="block font-medium text-ink-900">Banyak sekali gus</span><span class="text-ink-500">Meja 1, Meja 2, …</span></button>
        <button type="button" class="rounded-md border px-3 py-2.5 text-left text-[13px]" :class="addForm.mode === 'one' ? 'border-ink-900 ring-1 ring-ink-900' : 'border-line-200'" @click="addForm.mode = 'one'"><span class="block font-medium text-ink-900">Satu meja</span><span class="text-ink-500">cth. Meja VIP</span></button>
      </div>
      <Field v-if="addForm.mode === 'bulk'" v-slot="{ id: fid }" label="Berapa meja"><input :id="fid" v-model.number="addForm.count" type="number" min="1" max="200" class="num" /></Field>
      <Field v-else v-slot="{ id: fid }" label="Nama meja"><input :id="fid" v-model="addForm.name" type="text" maxlength="40" placeholder="Meja VIP" /></Field>
      <Field v-slot="{ id: fid }" label="Kerusi setiap meja"><input :id="fid" v-model.number="addForm.capacity" type="number" min="1" max="100" class="num" /></Field>
      <div class="flex justify-end gap-2 pt-1"><Btn variant="secondary" @click="addOpen = false">Batal</Btn><Btn variant="primary" :loading="busy" @click="addTables">Tambah</Btn></div>
    </div>
  </Modal>

  <Modal :open="!!editT" :title="editT?.name ?? ''" @close="editT = null">
    <div class="space-y-4">
      <Field v-slot="{ id: fid }" label="Nama meja"><input :id="fid" v-model="editForm.name" type="text" maxlength="40" /></Field>
      <Field v-slot="{ id: fid }" label="Kerusi"><input :id="fid" v-model.number="editForm.capacity" type="number" min="1" max="100" class="num" /></Field>
      <div class="flex items-center justify-between gap-2 pt-1">
        <Btn variant="danger-ghost" size="sm" :loading="busy" @click="deleteTable"><Trash2 class="size-4" :stroke-width="1.75" aria-hidden="true" />Padam meja</Btn>
        <div class="flex gap-2"><Btn variant="secondary" @click="editT = null">Batal</Btn><Btn variant="primary" :loading="busy" @click="saveTable">Simpan</Btn></div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
@media print {
  :global(aside), :global(header), :global(#page-actions) { display: none !important; }
  .seating { padding: 0; }
}
</style>
