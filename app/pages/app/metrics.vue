<script setup lang="ts">
import { Users, Bot, UserPlus, Wallet } from 'lucide-vue-next';
import { PageHead, Card, DataTable, KpiStrip, Stat, Tabs, EmptyState, Chip } from '~/ui';
import type { Report } from '~~/server/utils/traffic/report';

/**
 * Staff only (NUXT_STAFF_EMAILS): the analytics report as tables (docs/ANALYTICS.md). The same JSON as
 * GET /api/internal/metrics. Anyone else gets the "not found" state, as if the page did not exist.
 * No charts, no entrance motion: numbers first.
 */
definePageMeta({ layout: 'app', middleware: 'auth' });
useHead({ title: 'Metrik', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });

const days = ref<'7' | '30' | '90'>('30');
const RANGES = [{ key: '7', label: '7 hari' }, { key: '30', label: '30 hari' }, { key: '90', label: '90 hari' }] as const;
const report = ref<Report | null>(null);
const loading = ref(true);
const missing = ref(false);
const failed = ref('');

async function load() {
  loading.value = true; failed.value = '';
  try { report.value = await $fetch<Report>('/api/internal/metrics', { query: { days: days.value } }); missing.value = false; }
  catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 401) missing.value = true; else failed.value = apiError(e);
  } finally { loading.value = false; }
}
onMounted(load);
watch(days, load);

const num = (v: number) => v.toLocaleString('en-US');
const rm = (cents: number) => `RM${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (a: number, z: number) => (z ? `${Math.round((a / z) * 100)}%` : '-');

/** Columns of a plain list: first is text, the rest are figures. */
const cols = (...labels: string[]) => labels.map((label, i) => ({ key: String(i), label, numeric: i > 0 }));
const textCols = (...labels: string[]) => labels.map((label, i) => ({ key: String(i), label }));
const rows = (list: (string | number | null | undefined)[][]) => list.map((r, i) => ({ id: String(i), ...Object.fromEntries(r.map((c, j) => [String(j), c == null ? '' : typeof c === 'number' ? num(c) : c])) }));
const rowKey = (r: { id: string }) => r.id;

const classDays = computed(() => {
  const p = report.value?.people;
  if (!p) return { head: [] as string[], body: [] as (string | number)[][] };
  const classes = [...new Set(p.byDay.map(d => d.class))].sort();
  const dayList = [...new Set(p.byDay.map(d => d.day))].sort().reverse();
  return { head: ['Hari', ...classes], body: dayList.map(day => [day, ...classes.map(c => p.byDay.find(d => d.day === day && d.class === c)?.views ?? 0)]) };
});
const collectors = computed(() => report.value?.sources.collectors ?? []);
</script>

<template>
  <div class="mx-auto max-w-[1100px] space-y-5 pb-16">
    <PageHead title="Metrik" :sub="report ? `${report.range.days} hari, hari Malaysia (UTC+8). Staf sahaja.` : 'Staf sahaja'">
      <Tabs v-model="days" variant="filter" :items="RANGES" />
    </PageHead>

    <EmptyState v-if="missing" title="Tak jumpa" body="Halaman ini tak wujud." />
    <EmptyState v-else-if="failed" title="Tak jadi" :body="failed" />
    <KpiStrip v-else-if="loading && !report" loading />

    <template v-else-if="report">
      <KpiStrip>
        <Stat :icon="Users" label="Orang sebenar" :value="num(report.people.human.visitors)" :sub="`${num(report.people.human.views)} paparan, pelawat setiap hari dicampur`" />
        <Stat :icon="Bot" label="Bot, pengimbas, peniru" :value="num(report.bots.byClass.reduce((a, b) => a + b.requests, 0))" :sub="`${num(report.bots.agents.filter(a => a.class === 'ai-bot').reduce((a, b) => a + b.requests, 0))} daripada bot AI`" />
        <Stat :icon="UserPlus" label="Daftar masuk" :value="num(report.funnel.signups)" :sub="`${report.funnel.createdMajlis} cipta majlis, ${report.funnel.paid} bayar`" />
        <Stat :icon="Wallet" label="Kutipan" :value="rm(report.revenue.totalCents)" :sub="`${report.revenue.payments} bayaran`" />
      </KpiStrip>

      <Card title="Sumber data" sub="Ingest log nginx dan tarikan carian">
        <p class="mb-3 text-[13px] text-ink-500">
          Log meliputi {{ report.sources.trafficLogFrom?.slice(0, 16).replace('T', ' ') ?? 'belum ada' }} hingga {{ report.sources.trafficLogTo?.slice(0, 16).replace('T', ' ') ?? '-' }} UTC.
          Emel staf ditetapkan: {{ report.sources.staffConfigured }}.
        </p>
        <DataTable :columns="textCols('Pengumpul', 'Status', 'Larian akhir (UTC)', 'Baris', 'Butiran')"
          :rows="rows(collectors.map(c => [c.id, c.ok ? 'OK' : 'TIDAK', c.ranAt.slice(0, 16).replace('T', ' '), c.rows, (c.detail ?? '').slice(0, 100)]))" :row-key="rowKey" />
      </Card>

      <h2 class="eyebrow pt-2">Orang di halaman pemasaran</h2>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card title="Mengikut jenis" flush>
          <DataTable :columns="cols('Siapa', 'Paparan', 'Pelawat')" :row-key="rowKey" :rows="rows([
            ['Manusia (beacon sampai)', report.people.human.views, report.people.human.visitors],
            ['Belum disahkan (JS tak jalan)', report.people.unconfirmed.views, report.people.unconfirmed.visitors],
            ['Automasi', report.people.automation.views, report.people.automation.visitors],
            ['Staf FF', report.people.staff.views, report.people.staff.visitors]])" />
        </Card>
        <Card title="Dari mana datang" flush>
          <DataTable :columns="cols('Saluran', 'Lawatan')" :row-key="rowKey" :rows="rows(report.people.channels.map(c => [c.name, c.visits]))" />
        </Card>
      </div>
      <Card title="Halaman teratas (manusia)" flush>
        <DataTable :columns="cols('Halaman', 'Paparan', 'Pelawat')" :row-key="rowKey" :rows="rows(report.people.topPages.map(p => [p.path, p.views, p.visitors]))" />
      </Card>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card title="Perujuk" flush>
          <DataTable :columns="cols('Laman', 'Lawatan')" :row-key="rowKey" :rows="rows(report.people.referrers.slice(0, 15).map(c => [c.name, c.visits]))" />
        </Card>
        <Card title="Rujukan pembantu AI" :count="report.ai.visitsFromAssistants" flush>
          <DataTable :columns="cols('Pembantu', 'Lawatan')" :row-key="rowKey" :rows="rows(report.ai.assistantReferrers.map(c => [c.name, c.visits]))" />
        </Card>
      </div>
      <Card title="Paparan setiap hari dan jenis" flush>
        <DataTable :columns="cols(...classDays.head)" :row-key="rowKey" :rows="rows(classDays.body)" />
      </Card>

      <h2 class="eyebrow pt-2">Daftar masuk dan bayaran</h2>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card title="Daftar masuk ikut halaman pertama" flush>
          <DataTable :columns="cols('Halaman', 'Daftar', 'Cipta majlis', 'Bayar')" :row-key="rowKey" :rows="rows(report.funnel.byLanding.map(c => [c.name, c.signups, c.majlis, c.paid]))" />
        </Card>
        <Card title="Daftar masuk ikut saluran" flush>
          <DataTable :columns="cols('Saluran', 'Daftar', 'Cipta majlis', 'Bayar')" :row-key="rowKey" :rows="rows(report.funnel.byChannel.map(c => [c.name, c.signups, c.majlis, c.paid]))" />
        </Card>
      </div>
      <Card title="Hasil (CHIP)" :sub="`Seumur hidup ${rm(report.revenue.lifetimeCents)}. Tunggu bayaran balik: ${report.revenue.needsRefund}. Staf dan @ffdev.studio dikecualikan.`" flush>
        <DataTable :columns="cols('Pelan', 'Jenis', 'Bayaran', 'Kutipan')" :row-key="rowKey" :rows="rows(report.revenue.byPlan.map(c => [c.plan, c.kind, c.payments, rm(c.amountCents)]))" />
      </Card>

      <h2 class="eyebrow pt-2">Carian</h2>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card title="Google" :sub="report.search.google.impressions ? `${num(report.search.google.clicks)} klik, ${num(report.search.google.impressions)} paparan` : 'Belum disambung atau tiada data'" flush>
          <DataTable :columns="cols('Kata kunci sasaran', 'Klik', 'Paparan', 'Kedudukan')" :row-key="rowKey" :rows="rows(report.search.google.tracked.map(c => [c.query, c.clicks, c.impressions, c.position ?? 'tiada']))" />
        </Card>
        <Card title="Bing" :sub="report.search.bing.impressions ? `${num(report.search.bing.clicks)} klik, ${num(report.search.bing.impressions)} paparan` : 'Belum disambung atau tiada data'" flush>
          <DataTable :columns="cols('Kata kunci sasaran', 'Klik', 'Paparan', 'Kedudukan')" :row-key="rowKey" :rows="rows(report.search.bing.tracked.map(c => [c.query, c.clicks, c.impressions, c.position ?? 'tiada']))" />
        </Card>
      </div>

      <h2 class="eyebrow pt-2">Bot</h2>
      <Card title="Ikut perangkak" flush>
        <DataTable :columns="textCols('Ejen', 'Pemilik', 'Jenis', 'Tujuan', 'Pengesahan', 'Permintaan', 'Halaman')"
          :rows="rows(report.bots.agents.map(a => [a.agent, a.owner, a.class, a.purpose, a.verified, a.requests, a.pages]))" :row-key="rowKey" />
      </Card>
      <div class="grid gap-5 lg:grid-cols-2">
        <Card title="Peniru (mengaku perangkak, gagal disahkan)" :count="report.bots.impostors.length" flush>
          <DataTable :columns="cols('Mengaku', 'Permintaan', 'IP')" :row-key="rowKey" :rows="rows(report.bots.impostors.map(c => [c.claimed, c.requests, c.ips]))" />
        </Card>
        <Card title="Laluan pengimbas" flush>
          <DataTable :columns="cols('Laluan', 'Hit', 'IP')" :row-key="rowKey" :rows="rows(report.bots.scannerPaths.map(c => [c.path, c.hits, c.ips]))" />
        </Card>
      </div>
      <Card title="Apa yang dibaca perangkak carian dan AI" flush>
        <DataTable :columns="cols('Ejen', 'Laluan', 'Hit')" :row-key="rowKey" :rows="rows(report.bots.crawledPaths.slice(0, 40).map(c => [c.agent, c.path, c.hits]))" />
      </Card>
      <p class="text-[12px] text-ink-500">
        <Chip size="sm">Nota</Chip> Pelawat ialah hash IP dan penyemak imbas bergaram setiap hari; IP orang tidak disimpan. {{ report.ai.note }}
      </p>
    </template>
  </div>
</template>
