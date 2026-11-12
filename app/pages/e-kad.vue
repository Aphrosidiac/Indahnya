<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { KAD_TEMPLATES, KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';

/**
 * /e-kad: the e-kad as one link. The phone is /contoh/kad (the guest
 * component itself, on the fictional Aina & Hakim sample) framed like
 * LKad.vue; the chips re-dress it by postMessage, same origin only.
 */
definePageMeta({ layout: 'bare' });

const template = ref<KadTemplate>('garden');
const frame = ref<HTMLIFrameElement>();
const screen = ref<HTMLElement>();
const ready = ref(false);
const PHONE_W = 390;
const fit = reactive({ s: 1, h: 0 });
const theme = computed(() => KAD_THEMES[template.value]);
const swatch = (t: KadTemplate) => ({ background: `linear-gradient(135deg, ${KAD_THEMES[t].bg} 0 50%, ${KAD_THEMES[t].accent} 50% 100%)` });

function send() {
  frame.value?.contentWindow?.postMessage({ type: 'kad-demo', template: template.value, names: { a: '', b: '' }, cover: true }, location.origin);
}
watch(template, send);
function onMessage(e: MessageEvent) {
  if (e.origin === location.origin && e.data?.type === 'kad-demo-ready' && e.source === frame.value?.contentWindow) { ready.value = true; send(); }
}
let ro: ResizeObserver | undefined;
onMounted(() => {
  addEventListener('message', onMessage);
  // the iframe may have hydrated before this listener existed: ask again a few times, the message is idempotent
  for (const ms of [400, 1200, 2500, 5000]) setTimeout(send, ms);
  ro = new ResizeObserver(([e]) => {
    const r = e?.contentRect; if (!r?.width) return;
    fit.s = r.width / PHONE_W; fit.h = r.height / fit.s;
  });
  if (screen.value) ro.observe(screen.value);
});
onBeforeUnmount(() => { removeEventListener('message', onMessage); ro?.disconnect(); });

const faq = [
  { q: 'Berapa harga e-kad Indahnya?', a: 'Tak ada harga berasingan untuk kad. E-kad masuk dalam pakej majlis, termasuk pakej Percuma (50 upload). Harga penuh ada di halaman harga.' },
  { q: 'Tetamu kena download app untuk buka kad?', a: 'Tak payah. Kad dibuka di browser phone melalui satu link, tanpa app dan tanpa login. Tuan majlis sahaja yang sign in untuk uruskan kad.' },
  { q: 'Boleh guna e-kad dari tempat lain dan Indahnya untuk gambar sahaja?', a: 'Boleh. Indahnya bagi QR dan link "gambar sahaja" yang korang letak dalam kad sedia ada atau hantar melalui WhatsApp.' },
  { q: 'Satu kad untuk dua majlis, belah perempuan dan belah lelaki?', a: 'Belum. Satu majlis ialah satu tarikh dan satu tempat. Kalau ada dua majlis, buat dua majlis, masing-masing dengan pakejnya sendiri.' },
];
</script>

<template>
  <LArticle
    title="E-kad kahwin digital dengan RSVP | Indahnya"
    description="E-kad Indahnya ialah satu link dengan RSVP, Waze, kira detik, salam kaut DuitNow, ucapan, cari meja dan galeri gambar. Lima template, masuk dalam pakej Percuma."
    h1="Kad kahwin digital dengan RSVP, satu link"
    lead="E-kad dari Indahnya, galeri gambar majlis dengan QR, ialah satu link yang bawa RSVP, peta Waze dan Google Maps, kira detik, aturcara, salam kaut DuitNow, ucapan, cari meja dan butang ke galeri gambar. Ada lima template. E-kad ni masuk dalam pakej Percuma, jadi tak ada harga berasingan untuk kad."
    modified="2026-11-12"
    :crumbs="[{ name: 'E-kad', path: '/e-kad' }]"
    kicker="E-kad jemputan"
    :faq="faq"
  >
    <h2>Apa tetamu nampak dalam satu link</h2>
    <p>Tetamu terima satu link di WhatsApp. Tap, kad terbuka di browser phone. Tak payah app, tak payah login.</p>
    <ul>
      <li><strong>Nama keluarga, tarikh, masa dan tempat</strong>, dengan butang ke Waze dan Google Maps.</li>
      <li><strong>Kira detik</strong> ke hari majlis dan butang <strong>Simpan tarikh</strong> (Google Calendar atau fail .ics).</li>
      <li><strong>Aturcara majlis</strong>, <strong>doa</strong> dan <strong>tema pakaian</strong>.</li>
      <li><strong>RSVP</strong>: nama, nombor telefon, hadir atau tidak, bilangan orang, pihak, pilihan makanan dan nota.</li>
      <li><strong>Salam kaut</strong> dengan DuitNow QR, scan dengan mana-mana app bank.</li>
      <li><strong>Ucapan</strong> tulis atau suara, lihat <a href="/buku-tetamu-digital">buku tetamu digital</a>.</li>
      <li><strong>Cari meja</strong>: tetamu taip nama, dapat nombor meja.</li>
      <li><strong>Lagu latar</strong>, nombor untuk hubungi (WhatsApp atau call), dan gambar pasangan.</li>
      <li><strong>Butang ke galeri gambar majlis</strong>, tempat tetamu upload dan tengok gambar.</li>
    </ul>

    <h2>Lima template, kad yang sama</h2>
    <p>Pilih satu, tukar bila-bila. Kandungan kad tak berubah, hanya rupa. Yang di bawah kad sebenar dalam majlis contoh. <strong>Contoh rekaan. Nama dan ucapan semua rekaan.</strong></p>
    <div class="not-prose my-8 overflow-hidden rounded-[28px] px-4 py-10 transition-colors duration-500" :style="{ background: theme.band }">
      <div class="flex justify-center">
        <div class="l-phone relative aspect-[9/19.5] h-[min(620px,72vh)] max-w-full">
          <div ref="screen" class="l-phone-screen" :style="{ background: theme.bg }">
            <iframe
              ref="frame" src="/contoh/kad?cover=1" title="Kad jemputan contoh, majlis rekaan Aina dan Hakim" loading="lazy" inert scrolling="no"
              class="pointer-events-none absolute left-0 top-0 block origin-top-left border-0"
              :style="fit.h ? { width: `${PHONE_W}px`, height: `${fit.h}px`, transform: `scale(${fit.s})` } : { width: '100%', height: '100%' }"
            />
          </div>
          <span class="l-phone-island" />
        </div>
      </div>
      <div class="mt-8 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Pilih template kad">
        <button
          v-for="t in KAD_TEMPLATES" :key="t" type="button" role="radio" :aria-checked="template === t"
          class="inline-flex h-11 items-center gap-2.5 rounded-full bg-white/70 pl-1.5 pr-4 text-[15px] font-semibold text-[#1a1a1a] transition"
          :class="template === t ? 'shadow-[0_0_0_2px_#1a1a1a]' : 'hover:bg-white'"
          @click="template = t"
        >
          <span class="size-8 rounded-full shadow-[inset_0_0_0_1px_rgba(26,26,26,.12)]" :style="swatch(t)" />{{ KAD_THEMES[t].label }}
        </button>
      </div>
    </div>
    <ul>
      <li v-for="t in KAD_TEMPLATES" :key="t"><strong>{{ KAD_THEMES[t].label }}</strong>: {{ KAD_THEMES[t].blurb.toLowerCase() }}.</li>
    </ul>
    <p>Lima je, sengaja. Tak ada katalog beratus. Kalau korang nak lihat kad penuh dengan RSVP dan galeri, buka <a href="/contoh">majlis contoh</a>.</p>

    <h2>Berapa harga kad?</h2>
    <p>E-kad masuk dalam pakej majlis. Pakej Percuma ada semua ciri, dihadkan pada 50 upload dan 30 hari. RM59 dan RM99 sekali bayar untuk upload tanpa had. Tak ada subscription, tak ada caj per tetamu. Semua nombor ada di <a href="/harga">halaman harga</a>.</p>

    <h2>Kalau kad dah buat kat tempat lain</h2>
    <p>Tak semua orang nak tukar kad. Kalau korang dah ada kad digital (atau kad cetak), guna Indahnya untuk gambar sahaja.</p>
    <ul>
      <li>Buat majlis, dan ambil QR serta link <strong>gambar sahaja</strong>.</li>
      <li>Letak link tu dalam kad sedia ada, atau hantar di WhatsApp.</li>
      <li>Cetak QR untuk meja. Tetamu scan, upload, semua masuk satu galeri.</li>
    </ul>

    <h2>Apa yang tak ada</h2>
    <ul>
      <li>Tetamu tak perlu app. Tapi tuan majlis sign in untuk edit kad.</li>
      <li>Satu majlis ialah satu tarikh dan satu tempat. Dua majlis, dua link.</li>
      <li>Tak ada album bercetak.</li>
    </ul>

    <h2>Lepas kad, apa lagi</h2>
    <p>Cara kumpul jawapan RSVP, tutup bilangan untuk katering dan susun meja ada dalam panduan <a href="/panduan/rsvp-dan-susun-meja">RSVP dan susun meja</a>.</p>
  </LArticle>
</template>
