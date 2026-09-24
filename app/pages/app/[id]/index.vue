<script setup lang="ts">
import { Images, Video, Users, MessageSquareHeart, Link2, QrCode, MonitorPlay, Download, Sparkles, Clock, Copy, Check, ExternalLink } from 'lucide-vue-next';
import { PageHead, Btn, Card, KpiStrip, Stat, Meter, ActionRow, Alert, Sk, EmptyState, useUi } from '~/ui';

definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, loading, error, refresh } = useCurrentEvent();
const ui = useUi();
const route = useRoute();

const link = computed(() => ev.value ? `${siteUrl()}/${ev.value.slug}` : '');
const copied = ref(false);
async function copy() {
  if (await copyText(link.value)) { copied.value = true; ui.ok('Link dah copy'); setTimeout(() => { copied.value = false; }, 1500); }
}

/**
 * Back from Stripe: the webhook may not have landed yet, so ask Stripe once
 * the event is loaded (on a fresh page load it is not, at mount). The query
 * is dropped either way so a refresh does not ask again.
 */
const router = useRouter();
let reconciled = false;
watch(ev, async (e) => {
  if (!e || reconciled || !route.query.paid) return;
  reconciled = true;
  router.replace({ query: {} });
  try {
    const r = await $fetch<{ paid: boolean }>(`/api/events/${e.id}/reconcile`, { method: 'POST' });
    if (r.paid) await refresh();
    ui.ok('Terima kasih!', 'Bayaran diterima. Pakej dah aktif.');
  } catch { ui.ok('Terima kasih!', 'Bayaran sedang disahkan — pakej akan aktif dalam beberapa minit.'); }
}, { immediate: true });

interface Recent { id: string; kind: string; thumb: string | null; poster: string | null; url: string | null; guestName: string | null }
const recent = ref<Recent[] | null>(null);
watch(ev, async (e) => {
  if (!e || recent.value) return;
  try {
    const r = await $fetch<{ items: Recent[] }>(`/api/events/${e.id}/media`, { query: { status: 'ready', limit: 12 } });
    recent.value = r.items;
  } catch { recent.value = []; }
}, { immediate: true });
const renew = computed(() => ev.value?.offers.find(o => o.kind === 'renew'));

const uploadPct = computed(() => ev.value?.uploads.cap ? Math.min(100, Math.round((ev.value.uploads.used / ev.value.uploads.cap) * 100)) : 0);
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead :title="ev?.title ?? 'Majlis'" :sub="ev ? `${typeName(ev.type)} · ${ev.date ? fmtDate(ev.date) : 'tarikh belum set'}` : undefined">
      <Btn v-if="ev" variant="secondary" size="sm" @click="copy">
        <component :is="copied ? Check : Copy" class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ copied ? 'Dah copy' : 'Copy link' }}
      </Btn>
      <Btn v-if="ev" variant="primary" size="sm" :to="`/app/${ev.id}/qr`">
        <QrCode class="size-4" :stroke-width="1.75" aria-hidden="true" />QR
      </Btn>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <Alert v-if="error" tone="danger" title="Tak dapat buka majlis">{{ error }}</Alert>

    <template v-else-if="loading || !ev">
      <KpiStrip loading />
      <div class="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div class="card xl:col-span-2 p-5"><Sk w="40%" h="15px" /><div class="mt-4 grid grid-cols-4 gap-2"><Sk v-for="i in 8" :key="i" h="90px" :seed="i" /></div></div>
        <div class="card p-5"><Sk w="50%" h="15px" /><Sk h="12px" class="mt-3" :seed="2" /><Sk h="8px" class="mt-3" pill /></div>
      </div>
    </template>

    <div v-else class="reveal">
      <KpiStrip>
        <Stat label="Gambar & video" :value="ev.counts.ready" :icon="Images"
          :sub="ev.counts.hidden ? `${ev.counts.hidden} disembunyikan` : 'dalam galeri'"
          :delta="ev.counts.pending + ev.counts.uploaded ? `${ev.counts.pending + ev.counts.uploaded} tengah proses` : undefined" delta-tone="blue" />
        <Stat label="Upload digunakan" :value="ev.uploads.cap ? `${ev.uploads.used} / ${ev.uploads.cap}` : ev.uploads.used" :icon="Sparkles"
          :sub="ev.uploads.cap ? 'pakej percuma' : 'tanpa had'"
          :delta="ev.uploads.cap && uploadPct >= 80 ? 'hampir penuh' : undefined" delta-tone="amber" />
        <Stat label="RSVP" :value="ev.rsvp.n" :unit="ev.rsvp.pax ? `· ${ev.rsvp.pax} pax` : undefined" :icon="Users" sub="tetamu confirm" />
        <Stat label="Ucapan" :value="ev.ucapan" :icon="MessageSquareHeart" sub="dari tetamu" />
      </KpiStrip>

      <Alert v-if="ev.purgedAt" tone="danger" title="Simpanan dah tamat" class="mt-4">
        Gambar dan video majlis ni dah dipadam pada {{ fmtDate(ev.purgedAt) }}, selepas tempoh simpanan dan 30 hari tambahan.
      </Alert>
      <Alert v-else-if="!ev.uploads.open" tone="warning" title="Tempoh upload dah tamat" class="mt-4">
        Tetamu tak boleh upload lagi. Gambar masih boleh ditengok sampai {{ fmtDate(ev.storageEndsAt) }}.
        <NuxtLink v-if="renew" :to="`/app/${ev.id}/tetapan`" class="ml-1 font-medium underline-offset-2 hover:underline">Lanjutkan pakej</NuxtLink>
      </Alert>
      <Alert v-else-if="renew" tone="warning" title="Simpanan hampir tamat" class="mt-4">
        Gambar disimpan sampai {{ fmtDate(ev.storageEndsAt) }}. Download semua, atau
        <NuxtLink :to="`/app/${ev.id}/tetapan`" class="font-medium underline-offset-2 hover:underline">lanjutkan pakej ({{ fmtRM(renew.cents) }})</NuxtLink>.
      </Alert>

      <div class="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <Card class="xl:col-span-2" title="Gambar terkini" :icon="Images" :count="ev.counts.ready || undefined" sub="Yang baru masuk dari tetamu" flush>
          <template #actions>
            <Btn variant="ghost" size="sm" :to="`/app/${ev.id}/gambar`">Semua gambar</Btn>
          </template>
          <div v-if="recent === null" class="grid grid-cols-3 gap-px bg-line-100 sm:grid-cols-4 lg:grid-cols-6">
            <Sk v-for="i in 12" :key="i" h="auto" class="aspect-square rounded-none" :seed="i" />
          </div>
          <div v-else-if="recent.length" class="grid grid-cols-3 gap-px bg-line-100 sm:grid-cols-4 lg:grid-cols-6">
            <NuxtLink v-for="m in recent" :key="m.id" :to="`/app/${ev.id}/gambar`" class="relative aspect-square overflow-hidden bg-surface-0" :aria-label="m.guestName ? `Gambar oleh ${m.guestName}` : 'Gambar tetamu'">
              <img :src="m.thumb ?? m.poster ?? ''" alt="" class="size-full object-cover transition-transform duration-[240ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:scale-[1.03]" loading="lazy" />
              <span v-if="m.kind === 'video'" class="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-ink-900/70 text-white"><Video class="size-3.5" :stroke-width="2" aria-hidden="true" /></span>
            </NuxtLink>
          </div>
          <EmptyState v-else compact title="Belum ada gambar" body="Share QR atau link dengan tetamu — gambar akan muncul kat sini serta-merta.">
            <Btn variant="accent" size="sm" :to="`/app/${ev.id}/qr`"><QrCode class="size-4" :stroke-width="1.75" aria-hidden="true" />Dapatkan QR</Btn>
          </EmptyState>
        </Card>

        <div class="space-y-4">
          <Card title="Pakej" :icon="Sparkles" :sub="planName(ev.plan)">
            <Meter v-if="ev.uploads.cap" label="Upload" :value="`${ev.uploads.used} / ${ev.uploads.cap}`" :pct="uploadPct" :tone="uploadPct >= 90 ? 'red' : uploadPct >= 70 ? 'amber' : 'green'" />
            <p v-else class="text-[13px] leading-[18px] text-ink-600">Upload tanpa had. Terima kasih sebab support!</p>
            <div class="mt-4 space-y-2 text-[13px] leading-[18px]">
              <p class="flex items-center gap-2 text-ink-600"><Clock class="size-4 shrink-0 text-ink-400" :stroke-width="1.5" aria-hidden="true" />Upload terbuka <span class="num font-medium text-ink-900">{{ daysLeft(ev.uploadWindowEndsAt) }} hari</span> lagi</p>
              <p class="flex items-center gap-2 text-ink-600"><Download class="size-4 shrink-0 text-ink-400" :stroke-width="1.5" aria-hidden="true" />Simpanan sampai <span class="font-medium text-ink-900">{{ fmtDate(ev.storageEndsAt) }}</span></p>
            </div>
            <Btn v-if="ev.offers.some(o => o.kind === 'upgrade')" variant="accent" block class="mt-4" :to="`/app/${ev.id}/tetapan`">{{ ev.plan === 'free' ? 'Upgrade — dari RM59' : `Upgrade ke Lengkap — ${fmtRM(ev.offers.find(o => o.plan === 'full')!.cents)}` }}</Btn>
          </Card>

          <Card title="Buat sekarang" :icon="Link2" flush>
            <ActionRow inset :to="`/app/${ev.id}/qr`" title="Print QR untuk meja" sub="A5, A4 atau kad meja" :icon="QrCode" tone="green" class="border-b border-line-100" />
            <ActionRow inset :to="`/app/${ev.id}/slideshow`" title="Pasang slideshow kat TV" sub="Gambar masuk live masa majlis" :icon="MonitorPlay" tone="blue" class="border-b border-line-100" />
            <ActionRow inset :href="`/api/events/${ev.id}/download`" download title="Download semua (zip)" :sub="`${ev.counts.ready + ev.counts.hidden} fail, kualiti asal`" :icon="Download" tone="neutral" />
          </Card>

          <Card tone="muted">
            <p class="text-[13px] leading-[18px] text-ink-600">Link tetamu: <a :href="link" target="_blank" rel="noopener" class="inline-flex items-center gap-1 font-medium text-ink-900 underline-offset-2 hover:underline">{{ shortSite() }}/{{ ev.slug }}<ExternalLink class="size-3" :stroke-width="2" aria-hidden="true" /></a></p>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
