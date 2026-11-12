<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

definePageMeta({ layout: 'bare' });

const faq = [
  { q: 'Satu tetamu boleh hantar RSVP banyak kali?', a: 'Satu jawapan untuk satu browser. Kalau tetamu nak ubah, tuan majlis boleh edit jawapannya. Jawapan yang dapat melalui telefon, tuan majlis tambah sendiri.' },
  { q: 'Perlu Google Form kalau dah ada RSVP dalam kad?', a: 'Tak perlu. RSVP dalam link kad dah tanya hadir, bilangan orang, pihak dan pilihan makanan. Google Form pun cukup kalau korang tak guna kad digital.' },
  { q: 'Macam mana tetamu tahu meja dia?', a: 'Pada hari majlis, tetamu buka link kad, pergi ke cari meja dan taip nama. Dia dapat nama meja, selagi dia hadir dan tuan majlis dah tetapkan mejanya.' },
  { q: 'Bila nak beri bilangan kepada katering?', a: 'Tanya katering tarikh akhir mereka, dan letak tarikh RSVP lebih awal dalam kad. Pada tarikh tu, muat turun CSV, tambah jawapan melalui telefon, dan beri jumlah.' },
];
</script>

<template>
  <LArticle
    title="Cara buat RSVP kad kahwin dan susun meja"
    description="Cara buat RSVP kad kahwin: tanya hadir, bilangan orang dan pihak, tutup bilangan untuk katering, tetapkan meja dan bagi tetamu cari meja sendiri."
    h1="Cara buat RSVP kad kahwin dan susun meja"
    lead="Letak borang RSVP dalam link kad supaya tetamu isi nama, nombor telefon, hadir atau tidak, bilangan orang dan pihak. Dengan Indahnya, galeri gambar majlis dengan QR, jawapan masuk senarai tuan majlis, boleh dimuat turun sebagai CSV, dan tetamu cari meja sendiri. Google Form pun boleh, ikut keperluan."
    modified="2026-11-12"
    :crumbs="[{ name: 'Panduan', path: '/panduan' }, { name: 'RSVP dan susun meja', path: '/panduan/rsvp-dan-susun-meja' }]"
    :faq="faq"
  >
    <h2>Apa nak tanya dalam RSVP</h2>
    <p>Tanya yang katering dan pelamin betul-betul perlu. Lebih panjang borang, lebih ramai tak siap.</p>
    <p>RSVP dalam <a href="/e-kad">e-kad Indahnya</a> tanya:</p>
    <ul>
      <li>nama dan nombor telefon</li>
      <li>hadir atau tidak</li>
      <li>bilangan orang (pax)</li>
      <li>pihak: lelaki, perempuan, rakan atau lain</li>
      <li>pilihan makanan</li>
      <li>nota (alahan, kerusi roda, anak kecil)</li>
    </ul>
    <p>Satu browser, satu jawapan. Tetamu yang jawab di telefon atau WhatsApp pula, tuan majlis tambah sendiri dalam senarai. Semua jawapan duduk di satu tempat. Skrin tetamu ada di <a href="/contoh#rsvp">majlis contoh</a> (rekaan).</p>

    <h2>Google Form atau RSVP dalam kad</h2>
    <p>Google Form percuma dan boleh tanya apa saja. Kalau korang hanya perlukan hadir atau tidak dan jumlah, ia cukup.</p>
    <p>RSVP dalam kad lebih sesuai bila tetamu dah terima satu link yang sama untuk kad, lokasi, ucapan dan gambar. Jawapan terus bersambung dengan senarai meja. Dengan Google Form, korang sambung sendiri ke senarai meja.</p>

    <h2>Kumpul jawapan, langkah demi langkah</h2>
    <ol>
      <li>Hantar link kad di WhatsApp, dengan tarikh akhir RSVP yang jelas.</li>
      <li>Semak senarai jawapan. Tetamu yang senyap, telefon atau mesej mereka.</li>
      <li>Tambah jawapan yang korang dapat melalui telefon.</li>
      <li>Muat turun CSV bila perlu angka tepat, atau untuk simpan salinan.</li>
    </ol>

    <h2>Bila tutup bilangan untuk katering</h2>
    <p>Tanya katering tarikh akhir mereka untuk bilangan muktamad, biasanya beberapa hari sebelum majlis. Letak tarikh RSVP dalam kad lebih awal sikit. Bila tarikh tu sampai, kira jumlah pax hadir dan beri kepada katering. Indahnya tak tutup bilangan untuk korang, jadi tarikh tu keputusan tuan majlis.</p>

    <h2>Tetapkan meja</h2>
    <p>Tuan majlis buat senarai meja dengan nama dan kapasiti, kemudian letak tetamu yang hadir ke meja. Jawapan yang tak hadir tak boleh diberi meja.</p>
    <ul>
      <li>Kapasiti ialah panduan. Meja yang melebihi muatan ditanda merah, tapi korang yang putuskan, sebab keluarga enam orang di meja lima orang kadang-kadang memang kena.</li>
      <li>Alih tetamu antara meja bila senarai berubah.</li>
      <li>Indahnya tak susun meja sendiri. Tuan majlis yang tetapkan setiap tetamu.</li>
    </ul>

    <h2>Tetamu cari meja sendiri</h2>
    <p>Di pintu dewan, tetamu buka link kad dan taip nama di bahagian cari meja. Mereka nampak nama meja.</p>
    <ul>
      <li>Perlu sekurang-kurangnya tiga huruf, dipadankan dari permulaan nama.</li>
      <li>Hanya nama dan meja yang dipaparkan, tak ada nombor telefon, bilangan orang atau nota.</li>
      <li>Hanya tetamu yang hadir dan dah diberi meja yang keluar.</li>
    </ul>
    <p>Cuba di <a href="/aina-hakim/tempat">cari meja contoh</a> (majlis rekaan, nama rekaan).</p>

    <h2>Apa yang tak ada</h2>
    <ul>
      <li>Tak ada app untuk tetamu, tapi tuan majlis sign in.</li>
      <li>Satu majlis ialah satu tarikh dan satu tempat, jadi RSVP belah perempuan dan belah lelaki di tarikh lain ialah dua majlis.</li>
      <li>Tuan majlis yang hubungi tetamu yang belum jawab. Indahnya tak hantar mesej bagi pihak korang.</li>
    </ul>
    <p>Harga: e-kad dan RSVP ada dalam semua pakej termasuk Percuma. Lihat <a href="/harga">halaman harga</a>. Panduan seterusnya: <a href="/panduan/slideshow-tv-majlis">slideshow gambar di TV dewan</a>.</p>
  </LArticle>
</template>
