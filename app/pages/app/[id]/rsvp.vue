<script setup lang="ts">
import { Users, UserCheck, UserX, Armchair, Plus, Download, Settings2, Trash2, ExternalLink, X } from 'lucide-vue-next';
import { PageHead, Btn, KpiStrip, Stat, DataTable, Tabs, FilterBar, Chip, Drawer, Field, Select, Toggle, Alert, EmptyState, useUi } from '~/ui';
import type { Column, SelectOption } from '~/ui';

/**
 * RSVP for the host: the totals first (how many are coming, how many plates,
 * from which side, how many already have a seat), then every reply. A row
 * opens a drawer — edit, move to a table, delete — and replies taken by
 * phone are added the same way. The form's rules (deadline, pax, meals) sit
 * behind "Tetapan RSVP".
 */
definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();

interface Row { id: string; name: string; phone: string | null; attending: boolean; pax: number; side: string | null; meal: string | null; note: string | null; tableId: string | null; table: string | null; source: 'guest' | 'host'; updatedAt: string }
interface Settings { deadline: string | null; maxPax: number; meals: string[]; sides: boolean }
interface Summary { replies: number; yes: number; no: number; pax: number; lelaki: number; perempuan: number; rakan: number; seated: number }
const rows = ref<Row[]>([]);
const summary = ref<Summary | null>(null);
const settings = ref<Settings | null>(null);
const open = ref(true);
const loading = ref(true);
type F = 'all' | 'yes' | 'no';
const filter = ref<F>('all');
const q = ref('');
const tables = ref<{ id: string; name: string; seated: number; capacity: number }[]>([]);

let seq = 0;
async function load() {
  const mine = ++seq; // typing in the search fires loads; only the newest may land
  try {
    const [r, t] = await Promise.all([
      $fetch<{ items: Row[]; summary: Summary; settings: Settings; open: boolean }>(`/api/events/${id.value}/rsvps`, { query: { status: filter.value === 'all' ? undefined : filter.value, q: q.value || undefined } }),
      $fetch<typeof tables.value>(`/api/events/${id.value}/tables`),
    ]);
    if (mine !== seq) return;
    rows.value = r.items; summary.value = r.summary; settings.value = r.settings; open.value = r.open; tables.value = t;
  } catch (e) { ui.error('Tak dapat load RSVP', apiError(e)); }
  finally { loading.value = false; }
}
onMounted(load);
watch(filter, load);
let qt: ReturnType<typeof setTimeout> | undefined;
watch(q, () => { clearTimeout(qt); qt = setTimeout(load, 250); });

const SIDE: Record<string, string> = { lelaki: 'Lelaki', perempuan: 'Perempuan', rakan: 'Kawan', lain: 'Lain' };
const columns: Column<Row>[] = [
  { key: 'name', label: 'Nama', skeleton: 'twoLine' },
  { key: 'attending', label: 'Status', skeleton: 'pill', width: '110px' },
  { key: 'pax', label: 'Pax', numeric: true, width: '64px' },
  { key: 'side', label: 'Pihak', hideBelow: 'md', width: '110px' },
  { key: 'meal', label: 'Makanan', hideBelow: 'lg', width: '120px' },
  { key: 'table', label: 'Meja', hideBelow: 'sm', width: '110px' },
  { key: 'updatedAt', label: 'Dikemas kini', hideBelow: 'lg', width: '140px' },
];
const tabs = computed(() => [
  { key: 'all' as F, label: 'Semua', count: summary.value?.replies },
  { key: 'yes' as F, label: 'Hadir', count: summary.value?.yes },
  { key: 'no' as F, label: 'Tak hadir', count: summary.value?.no },
]);

/* ── edit / add drawer ── */
const drawer = ref(false);
const editing = ref<Row | null>(null);
const form = reactive({ name: '', phone: '', attending: true, pax: 1, side: '' as string, meal: '' as string, note: '', tableId: '' as string });
const busy = ref(false);
function openRow(r: Row | null) {
  editing.value = r;
  Object.assign(form, r
    ? { name: r.name, phone: r.phone ?? '', attending: r.attending, pax: Math.max(1, r.pax), side: r.side ?? '', meal: r.meal ?? '', note: r.note ?? '', tableId: r.tableId ?? '' }
    : { name: '', phone: '', attending: true, pax: 1, side: '', meal: '', note: '', tableId: '' });
  drawer.value = true;
}
const sideOptions: SelectOption<string>[] = [{ value: '', label: '—' }, { value: 'lelaki', label: 'Pihak lelaki' }, { value: 'perempuan', label: 'Pihak perempuan' }, { value: 'rakan', label: 'Kawan-kawan' }, { value: 'lain', label: 'Lain' }];
const mealOptions = computed<SelectOption<string>[]>(() => [{ value: '', label: '—' }, ...(settings.value?.meals ?? []).map(m => ({ value: m, label: m }))]);
const tableOptions = computed<SelectOption<string>[]>(() => [{ value: '', label: 'Belum ada meja' }, ...tables.value.map(t => ({ value: t.id, label: `${t.name} (${t.seated}/${t.capacity})` }))]);
async function saveRow() {
  if (!form.name.trim()) return ui.error('Tak jadi', 'Isi nama dulu');
  busy.value = true;
  const body = { name: form.name.trim(), phone: form.phone.trim() || null, attending: form.attending, pax: form.attending ? form.pax : 0, side: form.side || null, meal: form.meal || null, note: form.note.trim() || null, tableId: form.attending ? form.tableId || null : null };
  try {
    if (editing.value) await $fetch(`/api/events/${id.value}/rsvps/${editing.value.id}`, { method: 'PATCH', body });
    else await $fetch(`/api/events/${id.value}/rsvps`, { method: 'POST', body });
    drawer.value = false; ui.ok(editing.value ? 'Dah simpan' : 'RSVP ditambah');
    await Promise.all([load(), refresh()]);
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
async function removeRow() {
  if (!editing.value || !confirm(`Padam RSVP ${editing.value.name}?`)) return;
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}/rsvps/${editing.value.id}`, { method: 'DELETE' }); drawer.value = false; ui.ok('RSVP dipadam'); await Promise.all([load(), refresh()]); }
  catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}

/* ── settings drawer ── */
const setOpen = ref(false);
const sform = reactive({ deadline: '', maxPax: 5, meals: [] as string[], sides: true, meal: '' });
function openSettings() {
  const s = settings.value; if (!s) return;
  Object.assign(sform, { deadline: s.deadline ?? '', maxPax: s.maxPax, meals: [...s.meals], sides: s.sides, meal: '' });
  setOpen.value = true;
}
function addMeal() { const m = sform.meal.trim(); if (m && !sform.meals.includes(m) && sform.meals.length < 6) sform.meals.push(m); sform.meal = ''; }
async function saveSettings() {
  busy.value = true;
  try {
    await $fetch(`/api/events/${id.value}`, { method: 'PATCH', body: { settings: { rsvp: { deadline: sform.deadline || null, maxPax: sform.maxPax, meals: sform.meals, sides: sform.sides } } } });
    setOpen.value = false; ui.ok('Tetapan RSVP disimpan'); await Promise.all([load(), refresh()]);
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
const guestLink = computed(() => (ev.value ? `${siteUrl()}/${ev.value.slug}${ev.value.settings.modules.kad ? '' : '/rsvp'}` : ''));
const rsvpOn = computed(() => !!ev.value?.settings.modules.rsvp);
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="RSVP" :sub="summary ? `${summary.replies} jawapan · ${summary.pax} pax hadir` : undefined">
      <Btn variant="secondary" size="sm" @click="openSettings"><Settings2 class="size-4" :stroke-width="1.75" aria-hidden="true" /><span class="max-sm:hidden">Tetapan RSVP</span></Btn>
      <Btn v-if="summary?.replies" :href="`/api/events/${id}/rsvps.csv`" download variant="secondary" size="sm"><Download class="size-4" :stroke-width="1.75" aria-hidden="true" />CSV</Btn>
      <Btn variant="primary" size="sm" @click="openRow(null)"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Tambah</Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Alert v-if="ev && !rsvpOn" tone="warning" title="RSVP ditutup untuk tetamu" class="mb-4">Buka kat <NuxtLink :to="`/app/${id}/tetapan`" class="font-medium underline-offset-2 hover:underline">Tetapan → Tetamu</NuxtLink> supaya tetamu boleh RSVP dari kad.</Alert>
    <Alert v-else-if="settings && !open" tone="muted" title="Borang RSVP dah tutup" class="mb-4">Tarikh akhir {{ fmtDate(`${settings.deadline}T00:00:00Z`) }} dah lepas. Korang masih boleh tambah atau ubah jawapan kat sini.</Alert>

    <KpiStrip :loading="!summary">
      <Stat label="Hadir" :value="summary?.yes ?? 0" :unit="summary?.pax ? `· ${summary.pax} pax` : undefined" :icon="UserCheck" sub="jawapan" />
      <Stat label="Tak hadir" :value="summary?.no ?? 0" :icon="UserX" sub="jawapan" />
      <Stat v-if="settings?.sides" label="Pihak lelaki / perempuan" :value="`${summary?.lelaki ?? 0} / ${summary?.perempuan ?? 0}`" :icon="Users" :sub="summary?.rakan ? `+ ${summary.rakan} kawan` : 'pax'" />
      <Stat label="Dah ada meja" :value="summary ? `${summary.seated} / ${summary.pax}` : 0" :icon="Armchair" sub="pax" />
    </KpiStrip>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <Tabs v-model="filter" :items="tabs" variant="filter" />
    </div>
    <div class="mt-3"><FilterBar v-model:q="q" placeholder="Cari nama, telefon, nota…" /></div>

    <DataTable :columns="columns" :rows="rows" :row-key="r => r.id" :loading="loading" :selected-key="drawer ? editing?.id ?? null : null" @row-click="openRow">
      <template #cell:name="{ row }"><span class="block font-medium text-ink-900">{{ row.name }}</span><span v-if="row.phone || row.note" class="block max-w-[260px] truncate text-[12px] text-ink-500">{{ [row.phone, row.note].filter(Boolean).join(' · ') }}</span></template>
      <template #cell:attending="{ row }"><Chip :tone="row.attending ? 'green' : 'neutral'" size="sm">{{ row.attending ? 'Hadir' : 'Tak hadir' }}</Chip></template>
      <template #cell:pax="{ row }">{{ row.attending ? row.pax : '—' }}</template>
      <template #cell:side="{ row }">{{ row.side ? SIDE[row.side] : '—' }}</template>
      <template #cell:meal="{ row }">{{ row.meal || '—' }}</template>
      <template #cell:table="{ row }"><span :class="!row.table && row.attending && 'text-ink-400'">{{ row.table || (row.attending ? 'Belum' : '—') }}</span></template>
      <template #cell:updatedAt="{ row }"><span class="text-ink-500">{{ fmtDateTime(row.updatedAt) }}</span><span v-if="row.source === 'host'" class="ml-1 text-[11px] text-ink-400">· manual</span></template>
      <template #empty>
        <EmptyState compact :title="q || filter !== 'all' ? 'Tak ada yang padan' : 'Belum ada RSVP'" :body="q || filter !== 'all' ? undefined : 'Tetamu RSVP terus dari kad jemputan. Jawapan yang diterima melalui call atau WhatsApp boleh ditambah sendiri.'">
          <Btn v-if="!q && filter === 'all' && ev" :href="guestLink" target="_blank" variant="secondary" size="sm"><ExternalLink class="size-4" :stroke-width="1.75" aria-hidden="true" />Buka borang tetamu</Btn>
        </EmptyState>
      </template>
    </DataTable>
  </div>

  <Drawer :open="drawer" :title="editing ? editing.name : 'RSVP baru'" :subtitle="editing ? (editing.source === 'host' ? 'Ditambah oleh tuan majlis' : 'Dari tetamu') : 'Jawapan melalui call, WhatsApp atau depan-depan'" @close="drawer = false">
    <form class="space-y-4" novalidate @submit.prevent="saveRow">
      <Field v-slot="{ id: fid }" label="Nama" required><input :id="fid" v-model="form.name" type="text" maxlength="80" /></Field>
      <Field v-slot="{ id: fid }" label="Telefon"><input :id="fid" v-model="form.phone" type="tel" maxlength="20" /></Field>
      <Toggle v-model="form.attending" label="Hadir" :hint="form.attending ? 'Akan datang' : 'Tak dapat hadir'" />
      <template v-if="form.attending">
        <div class="grid grid-cols-2 gap-4">
          <Field v-slot="{ id: fid }" label="Pax"><input :id="fid" v-model.number="form.pax" type="number" min="1" max="50" class="num" /></Field>
          <Field v-slot="{ id: fid }" label="Pihak"><Select :id="fid" v-model="form.side" :options="sideOptions" block /></Field>
        </div>
        <Field v-if="settings?.meals.length" v-slot="{ id: fid }" label="Makanan"><Select :id="fid" v-model="form.meal" :options="mealOptions" block /></Field>
        <Field v-slot="{ id: fid }" label="Meja" :hint="tables.length ? undefined : 'Tambah meja kat Tempat duduk dulu'"><Select :id="fid" v-model="form.tableId" :options="tableOptions" block /></Field>
      </template>
      <Field v-slot="{ id: fid }" label="Nota"><textarea :id="fid" v-model="form.note" rows="2" maxlength="300" /></Field>
    </form>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <Btn v-if="editing" variant="danger-ghost" size="sm" :loading="busy" @click="removeRow"><Trash2 class="size-4" :stroke-width="1.75" aria-hidden="true" />Padam</Btn><span v-else />
        <div class="flex gap-2"><Btn variant="secondary" @click="drawer = false">Batal</Btn><Btn variant="primary" :loading="busy" @click="saveRow">Simpan</Btn></div>
      </div>
    </template>
  </Drawer>

  <Drawer :open="setOpen" title="Tetapan RSVP" subtitle="Apa yang tetamu isi dalam borang" @close="setOpen = false">
    <div class="space-y-5">
      <Field v-slot="{ id: fid }" label="Tarikh akhir RSVP" hint="Kosong = terbuka sampai majlis. Ditutup pada hujung hari tu."><input :id="fid" v-model="sform.deadline" type="date" /></Field>
      <Field v-slot="{ id: fid }" label="Maksimum pax satu RSVP" hint="Contoh: 5 untuk sekeluarga"><input :id="fid" v-model.number="sform.maxPax" type="number" min="1" max="30" class="num" /></Field>
      <Toggle v-model="sform.sides" label="Tanya pihak" hint="Pihak lelaki, pihak perempuan atau kawan" />
      <div>
        <p class="mb-1.5 text-[13px] font-medium leading-5 text-ink-800">Pilihan makanan</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="(m, i) in sform.meals" :key="m" class="inline-flex h-8 items-center gap-1 rounded-full border border-line-200 bg-surface-0 pl-3 pr-1.5 text-[13px]">{{ m }}<button type="button" class="grid size-6 place-items-center rounded-full text-ink-400 hover:text-ink-900" :aria-label="`Buang ${m}`" @click="sform.meals.splice(i, 1)"><X class="size-3.5" :stroke-width="2" /></button></span>
        </div>
        <div class="mt-2 flex gap-2">
          <input v-model="sform.meal" type="text" maxlength="40" class="field flex-1" placeholder="cth. Biasa, Vegetarian, Kanak-kanak" aria-label="Pilihan makanan baru" @keydown.enter.prevent="addMeal" />
          <Btn variant="secondary" :disabled="!sform.meal.trim() || sform.meals.length >= 6" @click="addMeal">Tambah</Btn>
        </div>
        <p class="mt-1.5 text-[12px] leading-4 text-ink-500">Kosong = tak tanya. Sampai 6 pilihan.</p>
      </div>
    </div>
    <template #footer><div class="flex w-full justify-end gap-2"><Btn variant="secondary" @click="setOpen = false">Batal</Btn><Btn variant="primary" :loading="busy" @click="saveSettings">Simpan</Btn></div></template>
  </Drawer>
</template>
