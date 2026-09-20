<script setup lang="ts">
import { MonitorPlay, Copy, Check, ExternalLink, RotateCcw } from 'lucide-vue-next';
import { PageHead, Btn, Card, Field, Toggle, Alert, Sk, useUi } from '~/ui';

definePageMeta({ layout: 'app', middleware: 'auth' });
const { ev, id, refresh } = useCurrentEvent();
const ui = useUi();

const tvUrl = computed(() => ev.value ? `${siteUrl()}/tv/${ev.value.slug}?token=${ev.value.tvToken}` : '');
const copied = ref(false);
async function copy() { if (await copyText(tvUrl.value)) { copied.value = true; setTimeout(() => { copied.value = false; }, 1500); } }

const form = reactive({ intervalSec: 7, showNames: true, shuffle: false });
watch(ev, (e) => { if (e) Object.assign(form, e.settings.slideshow); }, { immediate: true });
const dirty = computed(() => !!ev.value && (form.intervalSec !== ev.value.settings.slideshow.intervalSec || form.showNames !== ev.value.settings.slideshow.showNames || form.shuffle !== ev.value.settings.slideshow.shuffle));
const busy = ref(false);
async function save() {
  busy.value = true;
  try { await $fetch(`/api/events/${id.value}`, { method: 'PATCH', body: { settings: { slideshow: { ...form } } } }); await refresh(); ui.ok('Slideshow dah update'); }
  catch (e) { ui.error('Tak jadi', apiError(e)); }
  finally { busy.value = false; }
}
async function rotate() {
  if (!confirm('Tukar link TV? Link lama akan terus mati.')) return;
  await $fetch(`/api/events/${id.value}/tv-token`, { method: 'POST' });
  await refresh();
  ui.ok('Link TV baru dah sedia');
}
</script>

<template>
  <Teleport defer to="#page-head">
    <PageHead title="Slideshow" sub="Gambar tetamu naik live kat skrin dewan">
      <a v-if="ev" :href="tvUrl" target="_blank" rel="noopener"><Btn variant="primary" size="sm"><MonitorPlay class="size-4" :stroke-width="1.75" aria-hidden="true" />Buka slideshow</Btn></a>
    </PageHead>
  </Teleport>

  <div class="px-4 pb-8 pt-2 lg:px-7 lg:pb-10">
    <div v-if="!ev" class="grid grid-cols-1 items-start gap-4 xl:grid-cols-3"><div class="card p-5 xl:col-span-2"><Sk w="50%" h="15px" /><Sk h="36px" class="mt-4" /></div><div class="card p-5"><Sk w="40%" h="15px" /></div></div>
    <div v-else class="reveal grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
      <div class="space-y-4 xl:col-span-2">
        <Card title="Link untuk TV / projektor" :icon="MonitorPlay" sub="Buka kat laptop yang sambung ke skrin, tekan F11 untuk fullscreen">
          <div class="flex gap-2">
            <input :value="tvUrl" readonly class="field flex-1 font-mono text-[12px]" aria-label="Link TV" @focus="($event.target as HTMLInputElement).select()" />
            <Btn variant="secondary" @click="copy"><component :is="copied ? Check : Copy" class="size-4" :stroke-width="1.75" aria-hidden="true" /></Btn>
            <a :href="tvUrl" target="_blank" rel="noopener"><Btn variant="secondary" aria-label="Buka"><ExternalLink class="size-4" :stroke-width="1.75" /></Btn></a>
          </div>
          <p class="mt-3 text-[13px] leading-[18px] text-ink-500">Link ni ada kod rahsia — sesiapa yang ada boleh tengok slideshow. Kalau terbocor, tukar link.</p>
          <template #footer>
            <button type="button" class="inline-flex items-center gap-1.5 text-[13px] text-ink-600 transition-colors hover:text-ink-900" @click="rotate"><RotateCcw class="size-4" :stroke-width="1.75" aria-hidden="true" />Tukar link TV</button>
          </template>
        </Card>

        <Card title="Tetapan" divided>
          <div class="space-y-4">
            <Field v-slot="{ id: fid }" label="Tukar gambar setiap" suffix="saat" hint="7 saat sesuai untuk dewan; 4 untuk parti">
              <input :id="fid" v-model.number="form.intervalSec" type="number" min="3" max="60" class="num" />
            </Field>
            <Toggle v-model="form.showNames" label="Tunjuk nama tetamu" hint="Nama yang tetamu isi masa upload" />
            <Toggle v-model="form.shuffle" label="Shuffle" hint="Off: gambar terbaru dulu, yang lama berulang" />
          </div>
          <template #footer>
            <div class="flex justify-end"><Btn variant="primary" :disabled="!dirty" :loading="busy" @click="save">Simpan</Btn></div>
          </template>
        </Card>
      </div>

      <div class="space-y-4">
        <Card title="Macam mana nak pasang" flush>
          <ol class="divide-y divide-line-100 text-[13px] leading-[18px] text-ink-600">
            <li class="flex gap-3 px-5 py-3"><span class="num shrink-0 font-semibold text-ink-900">1</span>Sambung laptop ke TV atau projektor dengan HDMI.</li>
            <li class="flex gap-3 px-5 py-3"><span class="num shrink-0 font-semibold text-ink-900">2</span>Buka link TV kat Chrome, tekan <kbd class="rounded-[5px] bg-sand px-1.5 py-0.5 text-[11px]">F11</kbd> untuk fullscreen.</li>
            <li class="flex gap-3 px-5 py-3"><span class="num shrink-0 font-semibold text-ink-900">3</span>Biar je — gambar baru masuk sendiri setiap beberapa saat.</li>
            <li class="flex gap-3 px-5 py-3"><span class="num shrink-0 font-semibold text-ink-900">4</span>Kalau internet dewan lemah, guna hotspot phone. Slideshow tetap jalan dengan gambar yang dah ada bila offline.</li>
          </ol>
        </Card>
        <Alert tone="info" title="Approval mode">Kalau on, gambar tetamu hanya naik ke TV selepas korang approve dari tab Gambar. Set kat <NuxtLink :to="`/app/${ev.id}/tetapan`" class="font-medium underline-offset-2 hover:underline">Tetapan</NuxtLink>.</Alert>
      </div>
    </div>
  </div>
</template>
