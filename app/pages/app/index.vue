<script setup lang="ts">
import { Plus, Images, CalendarDays, ArrowRight, PartyPopper } from 'lucide-vue-next';
import { PageHead, Btn, Card, Chip, EmptyState, Sk, Modal, Field, Select, useUi } from '~/ui';
import type { SelectOption } from '~/ui';
import { useEvents } from '~/stores/events';

definePageMeta({ layout: 'app', middleware: 'auth' });

const events = useEvents();
const ui = useUi();
const route = useRoute();
const router = useRouter();

onMounted(() => { void events.load(true); });

/* ── the create wizard ─────────────────────────────────────────────── */
const open = ref(false);
watch(() => route.query.new, v => { if (v) { open.value = true; router.replace({ query: {} }); } }, { immediate: true });

const TYPES: SelectOption<string>[] = [
  { value: 'kahwin', label: 'Majlis kahwin' }, { value: 'aqiqah', label: 'Aqiqah / cukur jambul' },
  { value: 'birthday', label: 'Birthday' }, { value: 'corporate', label: 'Majlis syarikat' },
  { value: 'graduation', label: 'Graduasi' }, { value: 'lain', label: 'Majlis lain' },
];
const form = reactive({ type: 'kahwin', a: '', b: '', date: '', venueName: '', locale: 'ms' as 'ms' | 'en' });
const busy = ref(false);
const errors = reactive<{ a?: string }>({});
const couple = computed(() => form.type === 'kahwin');

async function create() {
  errors.a = form.a.trim() ? undefined : 'Isi nama dulu';
  if (errors.a || busy.value) return;
  busy.value = true;
  try {
    const ev = await $fetch<{ id: string }>('/api/events', { method: 'POST', body: {
      type: form.type, names: { a: form.a.trim(), b: couple.value && form.b.trim() ? form.b.trim() : undefined },
      date: form.date ? new Date(form.date).toISOString() : null,
      venue: form.venueName ? { name: form.venueName } : {}, locale: form.locale,
    } });
    open.value = false;
    await events.load(true);
    ui.ok('Majlis dah siap', 'Sekarang share QR atau link dengan tetamu.');
    router.push(`/app/${ev.id}`);
  } catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Majlis saya" :sub="events.loaded ? `${events.items.length} majlis` : undefined">
      <Btn variant="primary" @click="open = true"><Plus class="size-4" :stroke-width="2" aria-hidden="true" />Majlis baru</Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <div v-if="!events.loaded" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 3" :key="i" class="card p-5">
        <Sk w="60%" h="16px" :seed="i" /><Sk w="40%" h="12px" :seed="i * 2" class="mt-2" />
        <div class="mt-5 flex gap-2"><Sk w="70px" h="22px" pill /><Sk w="90px" h="22px" pill :seed="i * 3" /></div>
      </div>
    </div>

    <EmptyState v-else-if="!events.items.length" title="Belum ada majlis"
      body="Buat majlis pertama korang — dalam 2 minit dah boleh share QR dengan tetamu.">
      <Btn variant="accent" size="lg" class="mt-5" @click="open = true"><PartyPopper class="size-4" :stroke-width="1.75" aria-hidden="true" />Buat majlis</Btn>
    </EmptyState>

    <div v-else class="reveal grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink v-for="e in events.items" :key="e.id" :to="`/app/${e.id}`"
        class="card group flex flex-col p-5 transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:shadow-md">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-[16px] font-semibold leading-6 text-ink-900">{{ e.title }}</h3>
            <p class="truncate text-[12px] leading-4 text-ink-500">{{ shortSite() }}/{{ e.slug }}</p>
          </div>
          <Chip :tone="e.plan === 'free' ? 'neutral' : 'green'" size="sm">{{ planName(e.plan) }}</Chip>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-600">
          <span class="inline-flex items-center gap-1.5"><Images class="size-4 text-ink-400" :stroke-width="1.5" aria-hidden="true" /><span class="num">{{ e.mediaCount }}</span> gambar</span>
          <span class="inline-flex items-center gap-1.5"><CalendarDays class="size-4 text-ink-400" :stroke-width="1.5" aria-hidden="true" />{{ e.date ? fmtDate(e.date) : 'Tarikh belum set' }}</span>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-line-100 pt-3 text-[12px] text-ink-500">
          <span>{{ typeName(e.type) }}</span>
          <span class="inline-flex items-center gap-1 text-ink-600 transition-colors group-hover:text-ink-900">Buka <ArrowRight class="size-3.5" :stroke-width="2" aria-hidden="true" /></span>
        </div>
      </NuxtLink>
    </div>
  </div>

  <Modal :open="open" title="Majlis baru" subtitle="Nama dan tarikh je dulu — yang lain boleh tambah kemudian." @close="open = false">
    <form class="space-y-4" novalidate @submit.prevent="create">
      <Field v-slot="{ id }" label="Jenis majlis">
        <Select :id="id" v-model="form.type" :options="TYPES" block />
      </Field>
      <div class="grid grid-cols-1 gap-4" :class="couple && 'sm:grid-cols-2'">
        <Field v-slot="{ id }" :label="couple ? 'Nama pengantin (1)' : 'Nama / tajuk'" required :error="errors.a">
          <input :id="id" v-model="form.a" type="text" :placeholder="couple ? 'Aina' : 'Aqiqah Adam'" :aria-invalid="!!errors.a" autofocus />
        </Field>
        <Field v-if="couple" v-slot="{ id }" label="Nama pengantin (2)">
          <input :id="id" v-model="form.b" type="text" placeholder="Hakim" />
        </Field>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field v-slot="{ id }" label="Tarikh" hint="Boleh kosongkan dulu">
          <input :id="id" v-model="form.date" type="date" />
        </Field>
        <Field v-slot="{ id }" label="Bahasa untuk tetamu">
          <Select :id="id" v-model="form.locale" :options="[{ value: 'ms', label: 'Bahasa Melayu' }, { value: 'en', label: 'English' }]" block />
        </Field>
      </div>
      <Field v-slot="{ id }" label="Tempat" hint="Nama dewan / hotel / rumah">
        <input :id="id" v-model="form.venueName" type="text" placeholder="Dewan Seri Melati, Shah Alam" />
      </Field>
      <div class="flex justify-end gap-2 pt-2">
        <Btn variant="secondary" @click="open = false">Batal</Btn>
        <Btn type="submit" variant="primary" :loading="busy">Buat majlis</Btn>
      </div>
    </form>
  </Modal>
</template>
