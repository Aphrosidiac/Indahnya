<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

definePageMeta({ layout: 'bare' });

const faq = [
  { q: 'Berapa lama boleh rakam ucapan suara?', a: 'Sampai 60 saat satu ucapan, direkod terus dari browser phone. Saiz fail sampai 10 MB.' },
  { q: 'Tetamu kena download app untuk tulis ucapan?', a: 'Tak payah. Mereka buka link kad atau scan QR, tulis atau rakam, hantar. Tak ada app dan tak ada login.' },
  { q: 'Macam mana nak simpan semua ucapan?', a: 'Tuan majlis muat turun semuanya dalam satu zip: satu fail teks dengan semua ucapan bertulis, dan fail audio (m4a) untuk setiap ucapan suara.' },
  { q: 'Boleh tapis ucapan sebelum tetamu lain nampak?', a: 'Boleh. Hidupkan approval mode dan ucapan hanya naik selepas tuan majlis luluskan. Ucapan juga boleh disembunyikan kemudian.' },
];
</script>

<template>
  <LArticle
    title="Buku tetamu digital kahwin, tulis dan suara | Indahnya"
    description="Buku tetamu digital Indahnya: tetamu tulis ucapan atau rakam suara sampai 60 saat dari link kad, tanpa app. Tuan majlis muat turun semua ucapan dalam satu zip."
    h1="Buku tetamu digital: ucapan tulis dan suara"
    lead="Buku tetamu digital dari Indahnya, galeri gambar majlis dengan QR, bagi tetamu tulis ucapan atau rakam suara sehingga 60 saat dari telefon sendiri, tanpa app. Ucapan ada dalam link kad yang sama. Lepas majlis, tuan majlis muat turun semua ucapan dalam satu zip."
    modified="2026-11-12"
    :crumbs="[{ name: 'Buku tetamu digital', path: '/buku-tetamu-digital' }]"
    kicker="Ucapan tetamu"
    :faq="faq"
  >
    <h2>Macam mana tetamu tinggalkan ucapan</h2>
    <ol>
      <li>Tetamu buka link <a href="/e-kad">e-kad</a> atau scan QR di meja, kemudian tap butang ucapan.</li>
      <li>Taip nama (cth. Makcik Ros) dan pilih <strong>Tulis</strong> atau <strong>Suara</strong>.</li>
      <li>Untuk suara, benarkan mikrofon, tekan mula rakam, berhenti bila siap. Boleh rakam semula sebelum hantar.</li>
      <li>Hantar. Ucapan naik di dinding ucapan, yang tetamu lain boleh baca dan dengar.</li>
    </ol>
    <p>Kalau browser tetamu tak boleh rakam, dia nampak mesej dan boleh tulis ucapan sahaja. Tetamu boleh padam ucapannya sendiri dalam tempoh (jam) yang tuan majlis tetapkan.</p>

    <h2>Apa tuan majlis dapat</h2>
    <ul>
      <li><strong>Satu zip untuk semua ucapan.</strong> Ada fail <code>ucapan.txt</code> dengan semua ucapan bertulis (nama, masa, isi), dan folder suara dengan fail m4a, dinamakan ikut masa dan nama tetamu.</li>
      <li><strong>Approval mode.</strong> Ucapan menunggu kelulusan sebelum tetamu lain nampak.</li>
      <li><strong>Sembunyi.</strong> Ucapan yang disembunyikan tak naik di dinding, tapi masih ada dalam zip dengan tanda disembunyikan.</li>
    </ul>
    <p>Ucapan ialah satu bahagian daripada link yang sama dengan RSVP, cari meja dan galeri gambar. Tak ada harga berasingan. Lihat <a href="/harga">halaman harga</a>.</p>

    <h2>Tengok sendiri</h2>
    <p>Tengok <a href="/aina-hakim/ucapan">dinding ucapan majlis contoh</a>, dan semua langkah tetamu ada di <a href="/contoh">halaman contoh</a>. Contoh rekaan. Nama dan ucapan semua rekaan. Jangan hantar ucapan ke majlis contoh.</p>

    <h2>Apa yang tak ada</h2>
    <ul>
      <li>Ucapan suara sampai 60 saat sahaja. Ucapan hanya tulisan atau suara, bukan video.</li>
      <li>Tak ada buku tetamu bercetak. Zip tu fail digital untuk korang simpan atau cetak sendiri.</li>
      <li>Tuan majlis sign in untuk uruskan ucapan. Tetamu tak perlu.</li>
    </ul>
  </LArticle>
</template>
