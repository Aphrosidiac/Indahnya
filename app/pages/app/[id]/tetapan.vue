<script setup lang="ts">
import { Sparkles, Check, Trash2, Settings2, Users, Link2 } from 'lucide-vue-next';
import { PageHead, Btn, Card, Field, Select, Toggle, Alert, Chip, Modal, Sk, Tabs, useUi } from '~/ui';

definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();
const router = useRouter();

type Tab = 'pakej' | 'majlis' | 'tetamu' | 'lanjutan';
const tab = ref<Tab>('pakej');

/* ── plan ─────────────────────────────────────────────────────────── */
const PLANS = [
  { key: 'free', name: 'Percuma', price: 'RM0', rows: ['50 upload', 'Upload 30 hari', 'Simpan 30 hari', 'Semua feature'] },
  { key: 'std', name: 'Indahnya', price: 'RM59', rows: ['Upload tanpa had', 'Upload 6 bulan', 'Simpan 1 tahun', 'Link sendiri', '1 co-host'] },
  { key: 'full', name: 'Indahnya Lengkap', price: 'RM99', rows: ['Upload tanpa had', 'Upload 12 bulan', 'Simpan 2 tahun', 'Link sendiri', '5 co-host', 'Tanpa badge Indahnya'] },
] as const;
const paying = ref<string | null>(null);
async function checkout(plan: 'std' | 'full') {
  paying.value = plan;
  try { const r = await $fetch<{ url: string }>(`/api/events/${id.value}/checkout`, { method: 'POST', body: { plan } }); location.href = r.url; }
  catch (e) { ui.error('Tak dapat buka bayaran', apiError(e)); paying.value = null; }
}

/* ── majlis details ───────────────────────────────────────────────── */
const TYPES = [
  { value: 'kahwin', label: 'Majlis kahwin' }, { value: 'aqiqah', label: 'Aqiqah / cukur jambul' }, { value: 'birthday', label: 'Birthday' },
  { value: 'corporate', label: 'Majlis syarikat' }, { value: 'graduation', label: 'Graduasi' }, { value: 'lain', label: 'Majlis lain' },
];
const form = reactive({ title: '', a: '', b: '', type: 'kahwin', date: '', venueName: '', venueAddress: '', waze: '', gmaps: '', slug: '', locale: 'ms' as 'ms' | 'en' });
const settings = reactive({ approvalMode: false, guestDeleteHours: 24, modules: { gambar: true, ucapan: true, rsvp: true, tempat: false, kad: true } });
watch(ev, (e) => {
  if (!e) return;
  Object.assign(form, { title: e.title, a: e.names.a, b: e.names.b ?? '', type: e.type, date: e.date ? new Date(e.date).toISOString().slice(0, 10) : '', venueName: e.venue.name ?? '', venueAddress: e.venue.address ?? '', waze: e.venue.waze ?? '', gmaps: e.venue.gmaps ?? '', slug: e.slug, locale: e.settings.locale });
  settings.approvalMode = e.settings.approvalMode; settings.guestDeleteHours = e.settings.guestDeleteHours; Object.assign(settings.modules, e.settings.modules);
}, { immediate: true });

const busy = ref(false);
async function saveMajlis() {
  busy.value = true;
  try {
    await $fetch(`/api/events/${id.value}`, { method: 'PATCH', body: {
      title: form.title, names: { a: form.a, b: form.b || undefined }, type: form.type, date: form.date ? new Date(form.date).toISOString() : null,
      venue: { name: form.venueName, address: form.venueAddress, waze: form.waze, gmaps: form.gmaps }, settings: { locale: form.locale },
      ...(ev.value?.planInfo.customSlug && form.slug !== ev.value.slug ? { slug: form.slug } : {}),
    } });
    await refresh(); await useEvents().load(true);
    ui.ok('Dah simpan');
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
async function saveTetamu() {
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}`, { method: 'PATCH', body: { settings: { approvalMode: settings.approvalMode, guestDeleteHours: settings.guestDeleteHours, modules: settings.modules } } }); await refresh(); ui.ok('Dah simpan'); }
  catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}

/* ── delete ───────────────────────────────────────────────────────── */
const confirmDelete = ref(false);
const confirmText = ref('');
async function destroy() {
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}`, { method: 'DELETE' }); await useEvents().load(true); ui.ok('Majlis dipadam'); router.push('/app'); }
  catch (e) { ui.error('Tak jadi', apiError(e)); busy.value = false; }
}
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Pakej & tetapan" :sub="ev ? `${planName(ev.plan)} · simpan sampai ${fmtDate(ev.storageEndsAt)}` : undefined" />
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Tabs v-model="tab" :items="[{ key: 'pakej', label: 'Pakej' }, { key: 'majlis', label: 'Majlis' }, { key: 'tetamu', label: 'Tetamu' }, { key: 'lanjutan', label: 'Lanjutan' }]" />

    <div v-if="!ev" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3"><div v-for="i in 3" :key="i" class="card p-5"><Sk w="50%" h="15px" :seed="i" /><Sk w="30%" h="28px" class="mt-3" :seed="i * 2" /></div></div>

    <div v-else :key="tab" class="reveal mt-4">
      <!-- PAKEJ -->
      <template v-if="tab === 'pakej'">
        <Alert v-if="ev.plan === 'free'" tone="info" title="Bayar sekali je, untuk satu majlis" class="mb-4">Tak ada subscription. Upgrade bila-bila — jam upload dan simpanan dikira dari tarikh bayar.</Alert>
        <div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          <Card v-for="p in PLANS" :key="p.key" :tone="ev.plan === p.key ? 'green' : 'default'" class="flex flex-col">
            <div class="flex items-start justify-between gap-2">
              <div><p class="text-[15px] font-semibold leading-6 text-ink-900">{{ p.name }}</p><p class="num text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-900">{{ p.price }}</p></div>
              <Chip v-if="ev.plan === p.key" tone="green">Aktif</Chip>
            </div>
            <ul class="mt-4 flex-1 space-y-2 text-[13px] leading-[18px] text-ink-600">
              <li v-for="r in p.rows" :key="r" class="flex items-center gap-2"><Check class="size-4 shrink-0 text-success-600" :stroke-width="2" aria-hidden="true" />{{ r }}</li>
            </ul>
            <Btn v-if="p.key !== 'free' && ev.plan !== 'full' && ev.plan !== p.key" :variant="p.key === 'std' ? 'primary' : 'accent'" block class="mt-5" :loading="paying === p.key" @click="checkout(p.key)">
              {{ ev.plan === 'std' && p.key === 'full' ? 'Upgrade ke Lengkap' : `Pilih ${p.name}` }}
            </Btn>
            <p v-else-if="p.key === 'free' && ev.plan === 'free'" class="mt-5 text-center text-[12px] leading-4 text-ink-500">Pakej semasa</p>
          </Card>
        </div>
        <p class="mt-4 text-[12px] leading-4 text-ink-500">Bayaran melalui Stripe — FPX, kad, GrabPay. Harga dalam Ringgit Malaysia. Resit dihantar ke email.</p>
      </template>

      <!-- MAJLIS -->
      <div v-else-if="tab === 'majlis'" class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <Card class="xl:col-span-2" title="Butiran majlis" :icon="Settings2" divided>
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field v-slot="{ id: f }" label="Nama (1)" required><input :id="f" v-model="form.a" type="text" /></Field>
              <Field v-slot="{ id: f }" label="Nama (2)" hint="Kosongkan kalau bukan pasangan"><input :id="f" v-model="form.b" type="text" /></Field>
            </div>
            <Field v-slot="{ id: f }" label="Tajuk" hint="Yang muncul kat kad dan galeri"><input :id="f" v-model="form.title" type="text" /></Field>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field v-slot="{ id: f }" label="Jenis"><Select :id="f" v-model="form.type" :options="TYPES" block /></Field>
              <Field v-slot="{ id: f }" label="Tarikh"><input :id="f" v-model="form.date" type="date" /></Field>
              <Field v-slot="{ id: f }" label="Bahasa tetamu"><Select :id="f" v-model="form.locale" :options="[{ value: 'ms', label: 'Bahasa Melayu' }, { value: 'en', label: 'English' }]" block /></Field>
            </div>
            <Field v-slot="{ id: f }" label="Tempat"><input :id="f" v-model="form.venueName" type="text" placeholder="Dewan Seri Melati" /></Field>
            <Field v-slot="{ id: f }" label="Alamat"><textarea :id="f" v-model="form.venueAddress" rows="2" /></Field>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field v-slot="{ id: f }" label="Link Waze"><input :id="f" v-model="form.waze" type="url" placeholder="https://waze.com/ul/…" /></Field>
              <Field v-slot="{ id: f }" label="Link Google Maps"><input :id="f" v-model="form.gmaps" type="url" placeholder="https://maps.app.goo.gl/…" /></Field>
            </div>
          </div>
          <template #footer><div class="flex justify-end"><Btn variant="primary" :loading="busy" @click="saveMajlis">Simpan</Btn></div></template>
        </Card>
        <Card title="Link" :icon="Link2" :sub="ev.planInfo.customSlug ? 'Tukar link pendek korang' : 'Link sendiri untuk pakej berbayar'">
          <Field v-slot="{ id: f }" label="Link" :prefix="`${shortSite()}/`" :hint="ev.planInfo.customSlug ? 'Huruf kecil, nombor dan sengkang. Link lama akan terus mati.' : undefined">
            <input :id="f" v-model="form.slug" type="text" :disabled="!ev.planInfo.customSlug" />
          </Field>
          <Btn v-if="!ev.planInfo.customSlug" variant="accent" size="sm" class="mt-3" @click="tab = 'pakej'"><Sparkles class="size-4" :stroke-width="1.75" aria-hidden="true" />Upgrade</Btn>
        </Card>
      </div>

      <!-- TETAMU -->
      <div v-else-if="tab === 'tetamu'" class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <Card class="xl:col-span-2" title="Apa tetamu nampak" :icon="Users" flush>
          <div class="divide-y divide-line-100">
            <Toggle v-model="settings.modules.gambar" inset label="Gambar" hint="Galeri dan upload" />
            <Toggle v-model="settings.modules.kad" inset label="Kad jemputan" hint="Butiran majlis, lokasi, aturcara" />
            <Toggle v-model="settings.modules.ucapan" inset label="Ucapan" hint="Tetamu tinggalkan ucapan tulis atau suara" />
            <Toggle v-model="settings.modules.rsvp" inset label="RSVP" hint="Tetamu confirm kehadiran" />
            <Toggle v-model="settings.modules.tempat" inset label="Tempat duduk" hint="Tetamu cari nombor meja" />
          </div>
          <template #footer><div class="flex justify-end"><Btn variant="primary" :loading="busy" @click="saveTetamu">Simpan</Btn></div></template>
        </Card>
        <Card title="Kawalan" flush>
          <div class="divide-y divide-line-100">
            <Toggle v-model="settings.approvalMode" inset label="Approval mode" hint="Gambar disembunyikan sampai korang approve" />
            <div class="px-5 py-3.5">
              <Field v-slot="{ id: f }" label="Tetamu boleh padam gambar sendiri dalam" suffix="jam" hint="0 untuk tak benarkan">
                <input :id="f" v-model.number="settings.guestDeleteHours" type="number" min="0" max="72" class="num" />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <!-- LANJUTAN -->
      <div v-else class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <Card class="xl:col-span-2" title="Co-host" :icon="Users" sub="Orang lain yang boleh urus majlis ni" flush>
          <ul class="divide-y divide-line-100">
            <li v-for="m in ev.members" :key="m.userId" class="flex items-center gap-3 px-5 py-3">
              <span class="min-w-0 flex-1"><span class="block truncate text-[13px] font-medium leading-5 text-ink-900">{{ m.name ?? m.email }}</span><span class="block truncate text-[12px] leading-4 text-ink-500">{{ m.email }}</span></span>
              <Chip :tone="m.role === 'owner' ? 'dark' : 'neutral'" size="sm">{{ m.role === 'owner' ? 'Pemilik' : 'Co-host' }}</Chip>
            </li>
          </ul>
          <template #footer><p class="text-[12px] leading-4 text-ink-500">Jemput co-host — akan datang. Pakej semasa benarkan {{ ev.planInfo.cohosts }} co-host.</p></template>
        </Card>
        <Card title="Padam majlis" tone="default">
          <p class="text-[13px] leading-[18px] text-ink-600">Semua gambar, video, ucapan dan RSVP akan dipadam terus. Tak boleh undo. Download dulu kalau nak simpan.</p>
          <Btn v-if="ev.isOwner" variant="danger-ghost" class="mt-4" @click="confirmDelete = true"><Trash2 class="size-4" :stroke-width="1.75" aria-hidden="true" />Padam majlis ni</Btn>
          <p v-else class="mt-4 text-[12px] leading-4 text-ink-500">Hanya pemilik boleh padam.</p>
        </Card>
      </div>
    </div>
  </div>

  <Modal :open="confirmDelete" title="Padam majlis?" subtitle="Taip nama majlis untuk sahkan." @close="confirmDelete = false">
    <Field v-slot="{ id: f }" :label="`Taip “${ev?.title}”`"><input :id="f" v-model="confirmText" type="text" autocomplete="off" /></Field>
    <div class="mt-5 flex justify-end gap-2">
      <Btn variant="secondary" @click="confirmDelete = false">Batal</Btn>
      <Btn variant="danger" :disabled="confirmText.trim() !== ev?.title" :loading="busy" @click="destroy">Padam terus</Btn>
    </div>
  </Modal>
</template>
