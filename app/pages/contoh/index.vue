<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

/**
 * /contoh: the indexable, labelled-fictional sample. Every screen is the
 * real guest page of the sample majlis (Aina & Hakim) in a phone frame,
 * view only (inert), each with a link to the live page. The live pages stay
 * noindex; this one carries the words.
 */
definePageMeta({ layout: 'bare' });

const steps = [
  {
    id: 'kad', title: '1. Kad: apa tetamu buka dulu',
    p: 'Tetamu terima satu link di WhatsApp. Kad terbuka dengan nama, tarikh, tempat, kira detik, aturcara, doa, tema pakaian dan salam kaut. Di bawah ada butang ke RSVP, ucapan, cari meja dan galeri.',
    src: '/contoh/kad?cover=1', title2: 'Kad jemputan contoh', live: '/contoh/kad', liveText: 'Buka kad contoh', more: ['/e-kad', 'Semua tentang e-kad'],
  },
  {
    id: 'gambar', title: '2. Gambar: tetamu upload, semua masuk satu galeri',
    p: 'Tetamu scan QR di meja atau tap butang dalam kad. Pilih sampai 30 gambar sekali, beri nama, upload. Tak ada app, tak ada login. Gambar yang ditunjuk ialah salinan untuk dilihat, dan tuan majlis muat turun kualiti asal dalam satu zip.',
    src: '/aina-hakim/gambar', title2: 'Galeri gambar contoh', live: '/aina-hakim/gambar', liveText: 'Buka galeri contoh', more: ['/panduan/slideshow-tv-majlis', 'Gambar atas TV dewan'],
  },
  {
    id: 'ucapan', title: '3. Ucapan: tulis atau rakam suara',
    p: 'Tetamu tinggalkan ucapan bertulis, atau rakam suara sampai 60 saat terus dari browser. Semua ucapan di sini rekaan.',
    src: '/aina-hakim/ucapan', title2: 'Ucapan contoh', live: '/aina-hakim/ucapan', liveText: 'Buka ucapan contoh', more: ['/buku-tetamu-digital', 'Buku tetamu digital'],
  },
  {
    id: 'rsvp', title: '4. RSVP: hadir atau tidak, berapa orang',
    p: 'Tetamu isi nama, nombor telefon, hadir atau tidak, bilangan orang, pihak, pilihan makanan dan nota. Tuan majlis nampak jumlah dan boleh muat turun CSV. Jangan hantar borang contoh ni, ia majlis rekaan.',
    src: '/aina-hakim/rsvp', title2: 'RSVP contoh', live: '/aina-hakim/rsvp', liveText: 'Buka RSVP contoh', more: ['/panduan/rsvp-dan-susun-meja', 'Panduan RSVP dan susun meja'],
  },
  {
    id: 'tempat', title: '5. Tempat: cari nombor meja',
    p: 'Pada hari majlis, tetamu taip nama dan dapat nombor meja. Tuan majlis yang tetapkan meja untuk setiap jawapan RSVP.',
    src: '/aina-hakim/tempat', title2: 'Cari meja contoh', live: '/aina-hakim/tempat', liveText: 'Buka cari meja contoh', more: ['/panduan/rsvp-dan-susun-meja', 'Cara susun meja'],
  },
];

const PHONE_W = 390;
let first: HTMLElement | null = null;
const setScreen = (el: HTMLElement | null, i: number) => { if (i === 0 && el) first = el; };
const fit = reactive({ s: 1, h: 0 });
let ro: ResizeObserver | undefined;
onMounted(() => {
  ro = new ResizeObserver(([e]) => {
    const r = e?.contentRect; if (!r?.width) return;
    fit.s = r.width / PHONE_W; fit.h = r.height / fit.s;
  });
  if (first) ro.observe(first);
});
onBeforeUnmount(() => ro?.disconnect());

const faq = [
  { q: 'Majlis contoh ni betul ke?', a: 'Rekaan. Aina, Hakim, tetamu dan semua ucapan dibuat untuk contoh. Tak ada data sebenar sesiapa di sini.' },
  { q: 'Boleh saya cuba upload atau hantar RSVP di contoh?', a: 'Skrin di halaman ni untuk dilihat sahaja. Jangan hantar apa-apa ke majlis contoh, sebab semua orang kongsi satu contoh.' },
  { q: 'Kad saya akan nampak macam ni?', a: 'Strukturnya sama: bahagian, butang dan cara tetamu guna. Nama, tarikh, tempat, template dan gambar ikut majlis korang. Ada lima template, lihat halaman e-kad.' },
];
</script>

<template>
  <LArticle
    title="Contoh e-kad kahwin dan galeri gambar | Indahnya"
    description="Lihat contoh e-kad kahwin dengan RSVP, galeri gambar, ucapan suara dan cari meja dari Indahnya. Majlis rekaan, setiap skrin ialah halaman tetamu sebenar."
    h1="Contoh e-kad kahwin, langkah demi langkah"
    lead="Ini majlis contoh Aina dan Hakim di Indahnya, galeri gambar majlis dengan QR. Ikut apa tetamu nampak: kad, gambar, ucapan, RSVP dan cari meja. Setiap skrin ialah halaman sebenar yang tetamu guna, bukan gambar tangkap layar."
    modified="2026-11-12"
    :crumbs="[{ name: 'Contoh', path: '/contoh' }]"
    kicker="Contoh rekaan"
    :faq="faq"
  >
    <div class="l-callout"><strong>Contoh rekaan. Nama dan ucapan semua rekaan.</strong> Aina, Hakim dan tetamu mereka tak wujud. Ini tak mewakili pelanggan sesiapa.</div>

    <p>Bawah ni lima langkah yang tetamu lalui. Setiap satu ada skrin sebenar (hanya untuk dilihat) dan link ke halaman hidup. Nak harga? Ada di <a href="/harga">halaman harga</a>.</p>

    <section v-for="(s, i) in steps" :id="s.id" :key="s.id" class="scroll-mt-24">
      <h2>{{ s.title }}</h2>
      <p>{{ s.p }}</p>
      <div class="not-prose my-6 flex justify-center rounded-[28px] bg-[#e6f3e1] px-4 py-10">
        <div class="l-phone relative aspect-[9/19.5] h-[min(720px,78vh)] max-w-full">
          <div :ref="(el: any) => setScreen(el, i)" class="l-phone-screen" style="background:#fff">
            <iframe
              :src="s.src" :title="`${s.title2}, majlis rekaan Aina dan Hakim`" loading="lazy" inert scrolling="no"
              class="pointer-events-none absolute left-0 top-0 block origin-top-left border-0"
              :style="fit.h ? { width: `${PHONE_W}px`, height: `${fit.h}px`, transform: `scale(${fit.s})` } : { width: '100%', height: '100%' }"
            />
          </div>
          <span class="l-phone-island" />
        </div>
      </div>
      <p>
        <a :href="s.live">{{ s.liveText }}</a> ·
        <a :href="s.more[0]">{{ s.more[1] }}</a>
      </p>
    </section>

    <h2>Apa yang contoh ni tak tunjuk</h2>
    <ul>
      <li>Skrin tuan majlis (dashboard) tak ada di sini. Tuan majlis sign in untuk uruskan majlis.</li>
      <li>Slideshow TV perlukan internet di dewan. Baca <a href="/panduan/slideshow-tv-majlis">panduan slideshow TV</a>.</li>
      <li>Satu majlis ialah satu tarikh dan satu tempat.</li>
    </ul>
    <p>Soalan? <a href="https://wa.me/60139078719" target="_blank" rel="noopener">WhatsApp kami</a>, orang yang bina Indahnya yang balas.</p>
  </LArticle>
</template>
