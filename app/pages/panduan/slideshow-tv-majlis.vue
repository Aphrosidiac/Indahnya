<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

definePageMeta({ layout: 'bare' });

const faq = [
  { q: 'Slideshow boleh jalan tanpa internet di dewan?', a: 'Tak boleh. Laptop atau TV perlu internet untuk ambil gambar baru. Kalau line dewan lemah, sambung ke hotspot telefon. Kalau line terputus, slideshow terus pusing dengan gambar yang dah ada.' },
  { q: 'Perlu app untuk TV?', a: 'Tak perlu. Buka satu link di browser laptop atau TV, kemudian tekan skrin penuh.' },
  { q: 'Gambar tak sesuai boleh naik TV?', a: 'Hidupkan approval mode dulu. Gambar hanya naik di TV selepas tuan majlis luluskan. Gambar yang disembunyikan pun hilang dari skrin.' },
  { q: 'Nama tetamu ditunjuk?', a: 'Ya, nama yang tetamu beri semasa upload ditunjuk di bawah gambar. Tuan majlis boleh matikan paparan nama dalam tetapan slideshow.' },
];
</script>

<template>
  <LArticle
    title="Slideshow gambar tetamu live di TV dewan kahwin"
    description="Cara paparkan gambar tetamu live di TV dewan dengan Indahnya: satu link di laptop atau TV, perlu internet, ada hotspot, dan senarai uji sehari sebelum."
    h1="Slideshow gambar tetamu live di TV dewan"
    lead="Buka satu link Indahnya, galeri gambar majlis dengan QR, di browser laptop atau TV dewan. Gambar baru dari tetamu masuk sendiri dengan nama mereka, tanpa refresh. Dewan mesti ada internet, jadi sediakan hotspot telefon, dan hidupkan approval mode sebelum majlis."
    modified="2026-11-12"
    :crumbs="[{ name: 'Panduan', path: '/panduan' }, { name: 'Slideshow TV majlis', path: '/panduan/slideshow-tv-majlis' }]"
    :faq="faq"
  >
    <h2>Apa yang diperlukan</h2>
    <ul>
      <li>Laptop atau TV yang ada browser, disambung ke skrin dewan.</li>
      <li><strong>Internet di dewan.</strong> Slideshow ambil gambar baru melalui internet. Tak ada internet, tak ada gambar baru.</li>
      <li>Telefon dengan hotspot sebagai pelan B.</li>
      <li>Link TV daripada dashboard tuan majlis. Ia link khas, jadi jangan kongsi di tempat awam.</li>
    </ul>

    <h2>Langkah di hari majlis</h2>
    <ol>
      <li>Buka link TV di browser laptop atau TV. Ia cuba masuk skrin penuh.</li>
      <li>Tekan skrin penuh kalau perlu, dan sambungkan ke skrin dewan.</li>
      <li>Gambar naik satu demi satu, dengan nama tetamu di bawah. Gambar baru masuk sendiri.</li>
      <li>QR di penjuru skrin bawa tetamu terus ke halaman upload.</li>
    </ol>
    <p>Kalau link TV bocor, tuan majlis boleh tukar link. Skrin yang guna link lama jadi kosong.</p>

    <h2>Hidupkan approval mode dulu</h2>
    <p>Di majlis, tetamu upload apa saja. Dengan approval mode, gambar hanya naik di galeri dan TV selepas tuan majlis luluskan. Minta seorang ahli keluarga pegang telefon dan lulus gambar semasa majlis berjalan. Gambar yang disembunyikan atau dipadam turun dari skrin.</p>

    <h2>Internet di dewan</h2>
    <p>Line dewan selalu teruk bila ramai orang. Sediakan hotspot telefon untuk laptop dewan sahaja. Kalau line terputus sekejap, slideshow terus pusing dengan gambar yang dah ada, dan gambar baru menyusul bila line kembali. Tetamu yang tak dapat upload tak perlu risau: upload mereka sambung bila line kembali.</p>

    <h2>Uji sehari sebelum majlis</h2>
    <ul>
      <li>Buka link TV di laptop atau TV sebenar yang akan dipakai, di dewan kalau boleh.</li>
      <li>Upload satu dua gambar ujian dari telefon. Pastikan ia naik, dengan nama, lepas korang luluskan.</li>
      <li>Cuba skrin penuh dan pastikan QR di penjuru boleh discan dari jarak meja.</li>
      <li>Cuba hotspot telefon. Sambung laptop ke hotspot dan buka link semula.</li>
      <li>Padam gambar ujian dari galeri supaya tak keluar semasa majlis.</li>
      <li>Simpan link TV di telefon dan minta nombor orang yang pegang laptop dewan.</li>
    </ul>

    <h2>Apa yang tak ada</h2>
    <ul>
      <li>Tak ada mod tanpa internet. Slideshow perlukan sambungan.</li>
      <li>Tak ada app TV. Ia berjalan di browser.</li>
      <li>Tuan majlis sign in untuk dapatkan link TV dan lulus gambar. Tetamu tak perlu.</li>
    </ul>
    <p>Lihat <a href="/contoh">majlis contoh</a> (rekaan) untuk skrin tetamu. Cara kumpul semua gambar tetamu ada dalam <a href="/panduan/kumpul-gambar-tetamu">panduan kumpul gambar</a>, dan cara jawapan RSVP dalam <a href="/panduan/rsvp-dan-susun-meja">panduan RSVP</a>.</p>
  </LArticle>
</template>
