<script setup lang="ts">
import { Palette, FileText, ListOrdered, ImagePlus, Gift, Phone, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Smartphone, Music2, Upload, RotateCcw, Check, X, Share2 } from 'lucide-vue-next';
import { PageHead, Btn, Card, Field, Tabs, Toggle, Alert, Sk, Modal, Chip, useUi } from '~/ui';
import { KAD_TEMPLATES, KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';
import { composeKad, type KadFieldsShape, type KadDefaults } from '~~/shared/utils/kad-view';

/**
 * The e-kad editor. Left: the form, one tab per part of the kad. Right: a
 * phone frame running the real guest page in an iframe, fed the draft on
 * every keystroke — what the host sees is exactly what guests will get.
 *
 * Text fields start filled with the default wording for the majlis type and
 * language; anything left equal to the default is saved as "use the
 * default", so switching the guests' language later re-words the kad.
 */
definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id } = useCurrentEvent();
const ui = useUi();
const kadUpload = useKadUpload(() => id.value);

type Tab = 'reka' | 'butiran' | 'aturcara' | 'media' | 'hadiah' | 'hubungi';
const tab = ref<Tab>('reka');
const TABS = [
  { key: 'reka' as Tab, label: 'Reka bentuk' }, { key: 'butiran' as Tab, label: 'Butiran' }, { key: 'aturcara' as Tab, label: 'Aturcara' },
  { key: 'media' as Tab, label: 'Gambar & lagu' }, { key: 'hadiah' as Tab, label: 'Salam kaut' }, { key: 'hubungi' as Tab, label: 'Hubungi' },
];

/* ── load ─────────────────────────────────────────────────────────── */
interface KadGet { template: KadTemplate; fields: KadFieldsShape; defaults: KadDefaults; assets: Record<string, string>; ogUrl: string | null; updatedAt: string | null }
const loading = ref(true);
const loadError = ref('');
const template = ref<KadTemplate>('garden');
const defaults = ref<KadDefaults | null>(null);
const assets = reactive<Record<string, string>>({});
const ogUrl = ref<string | null>(null);
const savedAt = ref<string | null>(null);
const TEXT = ['title', 'greeting', 'hosts', 'invite', 'doa'] as const;
const f = reactive<KadFieldsShape & { title: string; greeting: string; hosts: string; invite: string; doa: string; dressCode: string }>({
  title: '', greeting: '', hosts: '', invite: '', doa: '', dressCode: '',
  fullNames: { a: '', b: '' }, time: { start: '', end: '' }, aturcara: [], colours: [], contacts: [],
  gift: { enabled: false, note: '', accounts: [] }, photos: [], countdown: true,
});
const giftNoteDefault = computed(() => defaults.value?.giftNote ?? '');
/** The last saved payload. A ref, so `dirty` re-evaluates the moment a save lands. */
const saved = ref('');

async function load() {
  loading.value = true; loadError.value = '';
  try {
    const r = await $fetch<KadGet>(`/api/events/${id.value}/kad`);
    template.value = KAD_TEMPLATES.includes(r.template) ? r.template : 'garden';
    defaults.value = r.defaults;
    Object.assign(assets, r.assets);
    ogUrl.value = r.ogUrl; savedAt.value = r.updatedAt;
    const x = r.fields;
    Object.assign(f, {
      title: x.title ?? r.defaults.title, greeting: x.greeting ?? r.defaults.greeting, hosts: x.hosts ?? r.defaults.hosts,
      invite: x.invite ?? r.defaults.invite, doa: x.doa ?? r.defaults.doa, dressCode: x.dressCode ?? '',
      fullNames: { a: x.fullNames.a ?? '', b: x.fullNames.b ?? '' },
      time: { start: x.time.start ?? '', end: x.time.end ?? '' },
      aturcara: x.aturcara.map(a => ({ ...a })), colours: [...x.colours], contacts: x.contacts.map(c => ({ role: '', ...c })),
      gift: { enabled: x.gift.enabled, note: x.gift.note ?? r.defaults.giftNote, accounts: x.gift.accounts.map(a => ({ ...a })), qrKey: x.gift.qrKey },
      photos: [...x.photos], coverKey: x.coverKey, music: x.music ? { ...x.music } : undefined, countdown: x.countdown,
    });
    saved.value = snapshot();
  } catch (e) { loadError.value = apiError(e, 'Tak dapat buka kad'); }
  finally { loading.value = false; }
}
onMounted(load);

/** What is stored: text equal to the default is saved as "default", so a language switch re-words it. */
function payload(): { template: KadTemplate; fields: KadFieldsShape } {
  const d = defaults.value!;
  const txt = (v: string, def: string) => (v.trim() === def.trim() ? undefined : v);
  return {
    template: template.value,
    fields: {
      title: txt(f.title, d.title), greeting: txt(f.greeting, d.greeting), hosts: txt(f.hosts, d.hosts), invite: txt(f.invite, d.invite), doa: txt(f.doa, d.doa),
      dressCode: f.dressCode || undefined,
      fullNames: { a: f.fullNames.a || undefined, b: f.fullNames.b || undefined },
      time: { start: f.time.start || undefined, end: f.time.end || undefined },
      aturcara: f.aturcara.filter(a => a.item.trim()).map(a => ({ time: a.time.trim(), item: a.item.trim() })),
      colours: f.colours,
      contacts: f.contacts.filter(c => c.name.trim() && c.phone.trim()).map(c => ({ name: c.name.trim(), role: c.role?.trim() || undefined, phone: c.phone.trim() })),
      gift: { enabled: f.gift.enabled, note: txt(f.gift.note ?? '', d.giftNote), accounts: f.gift.accounts.filter(a => a.bank.trim() && a.name.trim() && a.number.trim()).map(a => ({ bank: a.bank.trim(), name: a.name.trim(), number: a.number.trim() })), qrKey: f.gift.qrKey },
      photos: f.photos, coverKey: f.coverKey, music: f.music, countdown: f.countdown,
    },
  };
}
const snapshot = () => JSON.stringify(payload());
const dirty = computed(() => !loading.value && !!defaults.value && JSON.stringify(payload()) !== saved.value);

/* ── save ─────────────────────────────────────────────────────────── */
const saving = ref(false);
async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    const body = payload();
    const r = await $fetch<{ ogUrl: string | null; updatedAt: string }>(`/api/events/${id.value}/kad`, { method: 'PUT', body: { ...body, baseUpdatedAt: savedAt.value } });
    saved.value = JSON.stringify(body); ogUrl.value = r.ogUrl; savedAt.value = r.updatedAt;
    ui.ok('Kad dah simpan', 'Tetamu nampak versi baru serta-merta.');
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { saving.value = false; }
}
onBeforeRouteLeave(() => (dirty.value ? confirm('Ada perubahan belum disimpan. Tinggalkan juga?') : true));
function beforeUnload(e: BeforeUnloadEvent) { if (dirty.value) e.preventDefault(); }
onMounted(() => addEventListener('beforeunload', beforeUnload));
onBeforeUnmount(() => removeEventListener('beforeunload', beforeUnload));

/* ── the live preview ─────────────────────────────────────────────── */
const frame = ref<HTMLIFrameElement>();
const mobileFrame = ref<HTMLIFrameElement>();
const showCover = ref(false);
const previewOpen = ref(false);
const view = computed(() => {
  if (!ev.value || !defaults.value) return null;
  const p = payload();
  return composeKad(ev.value, p.template, p.fields, defaults.value, k => assets[k] ?? '', !ev.value.planInfo.badgeFree);
});
function push() {
  const msg = { type: 'kad-preview', view: JSON.parse(JSON.stringify(view.value)), cover: showCover.value, ready: ev.value?.counts.ready ?? 0 };
  for (const fr of [frame.value, mobileFrame.value]) fr?.contentWindow?.postMessage(msg, location.origin);
}
watch([view, showCover], push, { deep: true });
function onMessage(e: MessageEvent) { if (e.origin === location.origin && e.data?.type === 'kad-preview-ready') push(); }
onMounted(() => addEventListener('message', onMessage));
onBeforeUnmount(() => removeEventListener('message', onMessage));
const previewSrc = computed(() => `/app/${id.value}/kad-preview`);

/* ── lists ────────────────────────────────────────────────────────── */
function move<T>(list: T[], i: number, d: -1 | 1) { const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j]!, list[i]!]; }
const addAturcara = () => { if (f.aturcara.length < 20) f.aturcara.push({ time: '', item: '' }); };
const addContact = () => { if (f.contacts.length < 8) f.contacts.push({ name: '', role: '', phone: '' }); };
const addAccount = () => { if (f.gift.accounts.length < 4) f.gift.accounts.push({ bank: '', name: '', number: '' }); };
const addColour = () => { if (f.colours.length < 5) f.colours.push('#c8b89a'); };
const ATURCARA_SAMPLE = [
  { time: '11:00', item: 'Ketibaan tetamu' }, { time: '12:30', item: 'Ketibaan pengantin' },
  { time: '13:00', item: 'Makan beradab' }, { time: '16:00', item: 'Majlis bersurai' },
];

/* ── uploads ──────────────────────────────────────────────────────── */
const progress = reactive<Record<string, number>>({});
async function pickAndUpload(kind: 'photo' | 'qr' | 'music', accept: string, max = 1): Promise<{ key: string; url: string }[]> {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = accept; input.multiple = max > 1;
  const picked = await new Promise<File[]>((res) => { input.onchange = () => res(Array.from(input.files ?? [])); input.click(); });
  // only what fits is uploaded: an extra file would be an orphan on the CDN
  if (picked.length > max) ui.error('Terlalu banyak', `Hanya ${max} lagi yang muat — yang lain tak diupload.`);
  const files = picked.slice(0, max);
  const out: { key: string; url: string }[] = [];
  for (const file of files) {
    const tag = `${kind}:${file.name}`;
    progress[tag] = 0;
    try {
      const r = await kadUpload.upload(file, kind, (p) => { progress[tag] = p; });
      assets[r.key] = r.url; out.push(r);
    } catch (e) { ui.error(`${file.name} tak jadi`, apiError(e)); }
    finally { delete progress[tag]; }
  }
  return out;
}
async function addPhotos() {
  const room = 12 - f.photos.length;
  if (room <= 0) return ui.error('Dah penuh', 'Maksimum 12 gambar.');
  const r = await pickAndUpload('photo', 'image/*', room);
  f.photos.push(...r.map(x => x.key));
}
async function setCover() { const [r] = await pickAndUpload('photo', 'image/*'); if (r) f.coverKey = r.key; }
async function setQr() { const [r] = await pickAndUpload('qr', 'image/png,image/jpeg,image/webp'); if (r) f.gift.qrKey = r.key; }
async function setMusic() {
  const [r] = await pickAndUpload('music', 'audio/*,.mp3,.m4a');
  if (r) f.music = { key: r.key, title: f.music?.title ?? '' };
}
const uploading = computed(() => kadUpload.busy.value > 0);

const kadLink = computed(() => (ev.value ? `${siteUrl()}/${ev.value.slug}` : ''));
const kadOn = computed(() => !!ev.value?.settings.modules.kad);
const reset = (k: typeof TEXT[number]) => { if (defaults.value) f[k] = defaults.value[k]; };
const isDefault = (k: typeof TEXT[number]) => !!defaults.value && f[k].trim() === defaults.value[k].trim();
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Kad jemputan" :sub="dirty ? 'Ada perubahan belum disimpan' : savedAt ? `Disimpan ${fmtDateTime(savedAt)}` : 'Belum disimpan'">
      <Btn variant="secondary" size="sm" class="xl:hidden" @click="previewOpen = true"><Smartphone class="size-4" :stroke-width="1.75" aria-hidden="true" />Pratonton</Btn>
      <Btn v-if="ev" :href="kadLink" target="_blank" variant="secondary" size="sm"><ExternalLink class="size-4" :stroke-width="1.75" aria-hidden="true" /><span class="max-sm:hidden">Buka kad</span></Btn>
      <Btn variant="primary" size="sm" :disabled="!dirty || uploading" :loading="saving" @click="save"><Check class="size-4" :stroke-width="2" aria-hidden="true" />Simpan</Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Alert v-if="loadError" tone="danger" title="Tak dapat buka kad">{{ loadError }}</Alert>
    <div v-else-if="loading || !ev" class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"><div class="card p-5"><Sk w="40%" h="15px" /><Sk h="120px" class="mt-4" /></div><div class="card hidden p-5 xl:block"><Sk h="640px" /></div></div>

    <div v-else class="reveal grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div class="min-w-0 space-y-4">
        <Alert v-if="!kadOn" tone="warning" title="Kad ditutup untuk tetamu">Link majlis sekarang tunjuk halaman ringkas je. Buka semula kat <NuxtLink :to="`/app/${id}/tetapan`" class="font-medium underline-offset-2 hover:underline">Tetapan → Tetamu</NuxtLink>.</Alert>
        <div class="overflow-x-auto pb-1"><Tabs v-model="tab" :items="TABS" /></div>

        <!-- REKA BENTUK -->
        <template v-if="tab === 'reka'">
          <Card title="Template" :icon="Palette" sub="Tukar bila-bila — isi kad kekal sama">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <button v-for="k in KAD_TEMPLATES" :key="k" type="button" :aria-pressed="template === k"
                class="group relative overflow-hidden rounded-md border text-left transition-[border-color,box-shadow] duration-[120ms]"
                :class="template === k ? 'border-ink-900 ring-2 ring-ink-900 ring-offset-2 ring-offset-surface-0' : 'border-line-200 hover:border-ink-300'"
                @click="template = k">
                <span class="block px-3 pb-4 pt-5 text-center" :style="{ background: KAD_THEMES[k].bg, color: KAD_THEMES[k].ink }">
                  <span class="block text-[9px] font-semibold uppercase tracking-[.22em]" :style="{ color: KAD_THEMES[k].accent, fontFamily: KAD_THEMES[k].heading }">{{ ev.type === 'kahwin' ? 'Walimatulurus' : 'Jemputan' }}</span>
                  <span class="mt-2 block truncate text-[24px] leading-7" :style="{ fontFamily: KAD_THEMES[k].names, textTransform: KAD_THEMES[k].namesCaps ? 'uppercase' : 'none', fontWeight: k === 'moden' ? 700 : 400, fontStyle: k === 'klasik' ? 'italic' : 'normal' }">{{ ev.names.a }}</span>
                  <span class="mx-auto mt-2 block h-px w-10" :style="{ background: KAD_THEMES[k].accent }" />
                </span>
                <span class="block border-t border-line-100 bg-surface-0 px-3 py-2">
                  <span class="flex items-center justify-between gap-1 text-[13px] font-medium leading-5 text-ink-900">{{ KAD_THEMES[k].label }}<Check v-if="template === k" class="size-4" :stroke-width="2" aria-hidden="true" /></span>
                  <span class="block truncate text-[11px] leading-4 text-ink-500">{{ KAD_THEMES[k].blurb }}</span>
                </span>
              </button>
            </div>
          </Card>
          <Card title="Muka depan & gambar utama" :icon="ImagePlus" sub="Gambar berdua untuk muka depan kad — pilihan">
            <div class="flex flex-wrap items-center gap-4">
              <div class="grid size-28 shrink-0 place-items-center overflow-hidden rounded-md border border-line-200 bg-surface-50">
                <img v-if="f.coverKey && assets[f.coverKey]" :src="assets[f.coverKey]" alt="Gambar muka depan" class="size-full object-cover" />
                <ImagePlus v-else class="size-6 text-ink-400" :stroke-width="1.5" aria-hidden="true" />
              </div>
              <div class="flex flex-wrap gap-2">
                <Btn variant="secondary" size="sm" :loading="uploading" @click="setCover"><Upload class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ f.coverKey ? 'Tukar gambar' : 'Upload gambar' }}</Btn>
                <Btn v-if="f.coverKey" variant="ghost" size="sm" @click="f.coverKey = undefined"><X class="size-4" :stroke-width="1.75" aria-hidden="true" />Buang</Btn>
              </div>
            </div>
          </Card>
          <Card flush>
            <Toggle v-model="f.countdown" inset label="Kira detik" hint="Hari, jam dan minit sampai majlis" />
          </Card>
          <Card v-if="ogUrl" title="Pratonton WhatsApp" :icon="Share2" sub="Yang orang nampak bila link kad dikongsi">
            <img :src="ogUrl" alt="Pratonton link kad" class="w-full max-w-[480px] rounded-md border border-line-100" />
            <p class="mt-2 text-[12px] leading-4 text-ink-500">Dikemas kini setiap kali kad disimpan.</p>
          </Card>
        </template>

        <!-- BUTIRAN -->
        <template v-else-if="tab === 'butiran'">
          <Card title="Jemputan" :icon="FileText" divided>
            <div class="space-y-4">
              <Field v-slot="{ id: fid }" label="Tajuk" hint="Contoh: Walimatulurus, Majlis Aqiqah">
                <input :id="fid" v-model="f.title" type="text" maxlength="60" />
              </Field>
              <Field v-slot="{ id: fid }" label="Salam pembuka">
                <input :id="fid" v-model="f.greeting" type="text" maxlength="200" />
              </Field>
              <Field v-slot="{ id: fid }" label="Tuan rumah / ibu bapa" hint="Satu nama satu baris. Kosongkan kalau tak nak tunjuk.">
                <textarea :id="fid" v-model="f.hosts" rows="3" maxlength="400" placeholder="Ahmad bin Ismail&#10;&amp;&#10;Rohana binti Musa" />
              </Field>
              <Field v-slot="{ id: fid }" label="Ayat jemputan">
                <textarea :id="fid" v-model="f.invite" rows="3" maxlength="700" />
              </Field>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field v-slot="{ id: fid }" :label="ev.type === 'kahwin' ? 'Nama penuh pengantin (1)' : 'Nama penuh'" :hint="`Kosong = ${ev.names.a}`">
                  <input :id="fid" v-model="f.fullNames.a" type="text" maxlength="100" placeholder="Nur Aina binti Ahmad" />
                </Field>
                <Field v-if="ev.type === 'kahwin'" v-slot="{ id: fid }" label="Nama penuh pengantin (2)" :hint="ev.names.b ? `Kosong = ${ev.names.b}` : undefined">
                  <input :id="fid" v-model="f.fullNames.b" type="text" maxlength="100" placeholder="Muhammad Hakim bin Hassan" />
                </Field>
              </div>
              <p class="flex flex-wrap gap-x-3 gap-y-1 text-[12px] leading-4">
                <template v-for="k in TEXT" :key="k"><button v-if="!isDefault(k)" type="button" class="inline-flex items-center gap-1 text-ink-500 hover:text-ink-900" @click="reset(k)"><RotateCcw class="size-3" :stroke-width="2" aria-hidden="true" />Guna ayat asal: {{ { title: 'tajuk', greeting: 'salam', hosts: 'tuan rumah', invite: 'jemputan', doa: 'doa' }[k] }}</button></template>
              </p>
            </div>
          </Card>
          <Card title="Hari & tempat" divided>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <Field v-slot="{ id: fid }" label="Mula"><input :id="fid" v-model="f.time.start" type="time" /></Field>
                <Field v-slot="{ id: fid }" label="Tamat"><input :id="fid" v-model="f.time.end" type="time" /></Field>
              </div>
              <div class="rounded-md bg-surface-50 px-4 py-3 text-[13px] leading-5 text-ink-600">
                <p><span class="text-ink-500">Tarikh:</span> <span class="font-medium text-ink-900">{{ ev.date ? fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'belum set' }}</span></p>
                <p><span class="text-ink-500">Tempat:</span> <span class="font-medium text-ink-900">{{ ev.venue.name || 'belum set' }}</span><span v-if="ev.venue.address"> · {{ ev.venue.address }}</span></p>
                <NuxtLink :to="`/app/${id}/tetapan`" class="mt-1 inline-block font-medium text-ink-900 underline-offset-2 hover:underline">Tukar tarikh & tempat kat Tetapan</NuxtLink>
              </div>
            </div>
          </Card>
          <Card title="Doa & tema pakaian" divided>
            <div class="space-y-4">
              <Field v-slot="{ id: fid }" label="Doa" hint="Kosongkan kalau tak nak tunjuk">
                <textarea :id="fid" v-model="f.doa" rows="4" maxlength="1500" />
              </Field>
              <Field v-slot="{ id: fid }" label="Tema pakaian" hint="Contoh: Tona earth — sage, krim, coklat">
                <input :id="fid" v-model="f.dressCode" type="text" maxlength="200" />
              </Field>
              <div>
                <p class="mb-1.5 text-[13px] font-medium leading-5 text-ink-800">Warna</p>
                <div class="flex flex-wrap items-center gap-2">
                  <span v-for="(c, i) in f.colours" :key="i" class="inline-flex items-center gap-1 rounded-full border border-line-200 bg-surface-0 py-1 pl-1 pr-2">
                    <input v-model="f.colours[i]" type="color" class="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0" :aria-label="`Warna ${i + 1}`" />
                    <button type="button" class="text-ink-400 hover:text-ink-900" :aria-label="`Buang warna ${i + 1}`" @click="f.colours.splice(i, 1)"><X class="size-3.5" :stroke-width="2" /></button>
                  </span>
                  <Btn v-if="f.colours.length < 5" variant="secondary" size="xs" @click="addColour"><Plus class="size-3.5" :stroke-width="2" aria-hidden="true" />Warna</Btn>
                </div>
              </div>
            </div>
          </Card>
        </template>

        <!-- ATURCARA -->
        <Card v-else-if="tab === 'aturcara'" title="Aturcara majlis" :icon="ListOrdered" :count="f.aturcara.length || undefined" flush>
          <template #actions><Btn v-if="!f.aturcara.length" variant="ghost" size="sm" @click="f.aturcara = ATURCARA_SAMPLE.map(a => ({ ...a }))">Guna contoh</Btn></template>
          <ul class="divide-y divide-line-100">
            <li v-for="(a, i) in f.aturcara" :key="i" class="flex items-center gap-2 px-5 py-3">
              <input v-model="a.time" type="time" class="field w-[112px] shrink-0" :aria-label="`Masa ${i + 1}`" />
              <input v-model="a.item" type="text" maxlength="140" class="field min-w-0 flex-1" placeholder="Ketibaan pengantin" :aria-label="`Acara ${i + 1}`" />
              <div class="flex shrink-0">
                <Btn variant="ghost" size="xs" :disabled="i === 0" aria-label="Naik" @click="move(f.aturcara, i, -1)"><ArrowUp class="size-3.5" :stroke-width="2" /></Btn>
                <Btn variant="ghost" size="xs" :disabled="i === f.aturcara.length - 1" aria-label="Turun" @click="move(f.aturcara, i, 1)"><ArrowDown class="size-3.5" :stroke-width="2" /></Btn>
                <Btn variant="ghost" size="xs" aria-label="Buang" @click="f.aturcara.splice(i, 1)"><Trash2 class="size-3.5" :stroke-width="1.75" /></Btn>
              </div>
            </li>
          </ul>
          <p v-if="!f.aturcara.length" class="px-5 py-6 text-center text-[13px] text-ink-500">Belum ada aturcara. Tambah satu-satu, atau guna contoh.</p>
          <template #footer><Btn variant="secondary" size="sm" :disabled="f.aturcara.length >= 20" @click="addAturcara"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Tambah acara</Btn></template>
        </Card>

        <!-- GAMBAR & LAGU -->
        <template v-else-if="tab === 'media'">
          <Card title="Gambar kenangan" :icon="ImagePlus" :count="f.photos.length || undefined" sub="Sampai 12 gambar — prewedding, tunang, gambar berdua">
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="(k, i) in f.photos" :key="k" class="group relative aspect-[4/5] overflow-hidden rounded-[10px] bg-sand">
                <img :src="assets[k]" alt="" class="size-full object-cover" />
                <div class="absolute inset-x-1 bottom-1 flex justify-between opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <button type="button" class="grid size-7 place-items-center rounded-full bg-white/90 text-ink-900 shadow-xs disabled:opacity-40" :disabled="i === 0" aria-label="Ke kiri" @click="move(f.photos, i, -1)"><ArrowUp class="size-3.5 -rotate-90" :stroke-width="2" /></button>
                  <button type="button" class="grid size-7 place-items-center rounded-full bg-white/90 text-danger-600 shadow-xs" aria-label="Buang gambar" @click="f.photos.splice(i, 1)"><Trash2 class="size-3.5" :stroke-width="1.75" /></button>
                </div>
              </div>
              <button v-if="f.photos.length < 12" type="button" class="grid aspect-[4/5] place-items-center rounded-[10px] border border-dashed border-line-200 text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-900" :disabled="uploading" @click="addPhotos">
                <span class="text-center text-[12px]"><Plus class="mx-auto size-5" :stroke-width="1.75" aria-hidden="true" />Tambah</span>
              </button>
            </div>
            <p v-for="(p, tag) in progress" :key="tag" class="mt-2 text-[12px] text-ink-500">{{ String(tag).split(':').slice(1).join(':') }} — {{ p }}%</p>
          </Card>
          <Card title="Lagu latar" :icon="Music2" sub="Main bila tetamu buka kad. MP3 atau M4A, sampai 8 minit.">
            <div v-if="f.music" class="space-y-3">
              <audio :src="assets[f.music.key]" controls class="w-full" />
              <Field v-slot="{ id: fid }" label="Tajuk lagu" hint="Pilihan — contoh: Selamat Pengantin Baru"><input :id="fid" v-model="f.music.title" type="text" maxlength="100" /></Field>
              <div class="flex gap-2">
                <Btn variant="secondary" size="sm" :loading="uploading" @click="setMusic"><Upload class="size-4" :stroke-width="1.75" aria-hidden="true" />Tukar lagu</Btn>
                <Btn variant="ghost" size="sm" @click="f.music = undefined"><X class="size-4" :stroke-width="1.75" aria-hidden="true" />Buang</Btn>
              </div>
            </div>
            <Btn v-else variant="secondary" size="sm" :loading="uploading" @click="setMusic"><Upload class="size-4" :stroke-width="1.75" aria-hidden="true" />Upload lagu</Btn>
            <p class="mt-3 text-[12px] leading-4 text-ink-500">Pastikan korang ada hak untuk guna lagu tu.</p>
          </Card>
        </template>

        <!-- SALAM KAUT -->
        <template v-else-if="tab === 'hadiah'">
          <Card flush>
            <Toggle v-model="f.gift.enabled" inset label="Tunjuk salam kaut" hint="Akaun bank dan QR DuitNow untuk tetamu yang nak beri hadiah" />
          </Card>
          <template v-if="f.gift.enabled">
            <Card title="Akaun" :icon="Gift" :count="f.gift.accounts.length || undefined" flush>
              <ul class="divide-y divide-line-100">
                <li v-for="(a, i) in f.gift.accounts" :key="i" class="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input v-model="a.bank" type="text" maxlength="60" class="field" placeholder="Maybank" :aria-label="`Bank ${i + 1}`" :aria-invalid="!!a.number.trim() && !a.bank.trim()" />
                  <input v-model="a.name" type="text" maxlength="100" class="field" placeholder="Nama pemegang akaun" :aria-label="`Nama akaun ${i + 1}`" :aria-invalid="!!a.number.trim() && !a.name.trim()" />
                  <input v-model="a.number" type="text" inputmode="numeric" maxlength="40" class="field num" placeholder="1621 2345 6789" :aria-label="`Nombor akaun ${i + 1}`" />
                  <Btn variant="ghost" size="sm" aria-label="Buang akaun" @click="f.gift.accounts.splice(i, 1)"><Trash2 class="size-4" :stroke-width="1.75" /></Btn>
                </li>
              </ul>
              <p v-if="f.gift.accounts.some(a => a.number.trim() && (!a.bank.trim() || !a.name.trim()))" class="px-5 pb-3 text-[12px] leading-4 text-danger-600">Akaun tanpa bank atau nama tak akan ditunjuk — lengkapkan dulu.</p>
              <template #footer><Btn variant="secondary" size="sm" :disabled="f.gift.accounts.length >= 4" @click="addAccount"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Tambah akaun</Btn></template>
            </Card>
            <Card title="QR DuitNow" sub="Screenshot QR dari app bank korang">
              <div class="flex flex-wrap items-center gap-4">
                <div class="grid size-28 shrink-0 place-items-center overflow-hidden rounded-md border border-line-200 bg-white">
                  <img v-if="f.gift.qrKey && assets[f.gift.qrKey]" :src="assets[f.gift.qrKey]" alt="QR DuitNow" class="size-full object-contain" />
                  <span v-else class="text-[12px] text-ink-400">Tiada QR</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Btn variant="secondary" size="sm" :loading="uploading" @click="setQr"><Upload class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ f.gift.qrKey ? 'Tukar QR' : 'Upload QR' }}</Btn>
                  <Btn v-if="f.gift.qrKey" variant="ghost" size="sm" @click="f.gift.qrKey = undefined"><X class="size-4" :stroke-width="1.75" aria-hidden="true" />Buang</Btn>
                </div>
              </div>
            </Card>
            <Card title="Ayat" divided>
              <Field v-slot="{ id: fid }" label="Nota untuk tetamu"><textarea :id="fid" v-model="f.gift.note" rows="3" maxlength="500" /></Field>
              <button v-if="(f.gift.note ?? '').trim() !== giftNoteDefault.trim()" type="button" class="mt-2 inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900" @click="f.gift.note = giftNoteDefault"><RotateCcw class="size-3" :stroke-width="2" aria-hidden="true" />Guna ayat asal</button>
            </Card>
          </template>
        </template>

        <!-- HUBUNGI -->
        <Card v-else title="Hubungi" :icon="Phone" :count="f.contacts.length || undefined" sub="Tetamu boleh WhatsApp atau call terus dari kad" flush>
          <ul class="divide-y divide-line-100">
            <li v-for="(c, i) in f.contacts" :key="i" class="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px_auto]">
              <input v-model="c.name" type="text" maxlength="60" class="field" placeholder="Encik Ahmad" :aria-label="`Nama ${i + 1}`" />
              <input v-model="c.role" type="text" maxlength="60" class="field" placeholder="Bapa pengantin" :aria-label="`Hubungan ${i + 1}`" />
              <input v-model="c.phone" type="tel" inputmode="tel" maxlength="20" class="field num" placeholder="012-345 6789" :aria-label="`Telefon ${i + 1}`" />
              <Btn variant="ghost" size="sm" aria-label="Buang" @click="f.contacts.splice(i, 1)"><Trash2 class="size-4" :stroke-width="1.75" /></Btn>
            </li>
          </ul>
          <p v-if="!f.contacts.length" class="px-5 py-6 text-center text-[13px] text-ink-500">Belum ada nombor. Biasanya ibu bapa atau adik-beradik terdekat.</p>
          <template #footer><Btn variant="secondary" size="sm" :disabled="f.contacts.length >= 8" @click="addContact"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Tambah orang</Btn></template>
        </Card>
      </div>

      <!-- the phone -->
      <div class="sticky top-20 hidden xl:block">
        <div class="mx-auto w-[360px] overflow-hidden rounded-[40px] border-[10px] border-ink-900 bg-ink-900 shadow-lg">
          <iframe ref="frame" :src="previewSrc" title="Pratonton kad" class="block h-[700px] w-full rounded-[30px] bg-white" />
        </div>
        <div class="mx-auto mt-3 flex w-[360px] items-center justify-between gap-3">
          <Chip v-if="dirty" tone="amber" size="sm">Draf — belum disimpan</Chip><Chip v-else tone="green" size="sm">Sama macam yang tetamu nampak</Chip>
          <label class="inline-flex items-center gap-2 text-[12px] text-ink-600"><input v-model="showCover" type="checkbox" class="size-4 accent-ink-900" />Muka depan</label>
        </div>
      </div>
    </div>
  </div>

  <Modal :open="previewOpen" title="Pratonton" subtitle="Draf — simpan untuk tetamu nampak" @close="previewOpen = false">
    <label class="mb-3 inline-flex items-center gap-2 text-[13px] text-ink-600"><input v-model="showCover" type="checkbox" class="size-4 accent-ink-900" />Tunjuk muka depan</label>
    <div class="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-[8px] border-ink-900">
      <iframe v-if="previewOpen" ref="mobileFrame" :src="previewSrc" title="Pratonton kad" class="block h-[70vh] w-full bg-white" />
    </div>
  </Modal>
</template>
