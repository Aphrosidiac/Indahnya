<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

/**
 * /panduan/cara-buat-qr-code-gambar-majlis: the searcher often wants any QR
 * code, so the free, generic way comes first; then why a majlis gallery with a
 * printed card is easier. Print layouts from app/components/print/QrStand.vue.
 */
definePageMeta({ layout: 'bare' });
</script>

<template>
  <LArticle
    title="Cara buat QR code untuk gambar majlis (percuma)"
    description="Cara buat QR code untuk kumpul gambar majlis: dengan link album Google dan penjana QR percuma, atau dengan galeri QR yang siap dengan kad meja untuk print."
    h1="Cara buat QR code untuk gambar majlis"
    lead="Ada dua cara. Cara percuma: buat album atau folder, salin link, dan tukar jadi QR dengan mana-mana penjana QR. Cara siap: guna galeri QR majlis seperti Indahnya, galeri gambar majlis dengan QR, yang bagi QR dan kad meja siap untuk print, dan tetamu boleh upload tanpa app atau log masuk."
    modified="2026-11-12"
    kicker="Panduan"
    :crumbs="[{ name: 'Panduan', path: '/panduan' }, { name: 'Buat QR code gambar majlis', path: '/panduan/cara-buat-qr-code-gambar-majlis' }]"
    :faq="[
      { q: 'QR code percuma tamat tempoh ke?', a: 'QR biasa cuma simpan link. Selagi link tu hidup, QR jalan. Tapi sesetengah penjana QR guna QR dinamik yang lalu melalui server mereka; kalau langganan tamat, QR tu boleh mati. Pilih QR statik kalau guna penjana percuma.' },
      { q: 'Berapa besar QR atas kad meja?', a: 'Cadangan kami: sekurang-kurangnya 3 cm lebar untuk scan dari kerusi, dan lebih besar untuk poster di pintu masuk. Cuba scan dari jarak duduk sebelum print banyak.' },
      { q: 'Boleh guna QR yang sama untuk kad jemputan?', a: 'Dengan Indahnya, ya. Link galeri yang sama ada dalam e-kad, dan butang dari kad terus ke galeri.' },
    ]"
  >
    <h2>Cara 1: percuma, dengan link album dan penjana QR</h2>
    <ol>
      <li><strong>Buat tempat simpan gambar.</strong> Contohnya album Google Photos atau folder Google Drive. Tetapkan supaya orang lain boleh tambah gambar.</li>
      <li><strong>Uji dengan phone lain.</strong> Buka link dalam browser incognito, dari phone yang tak log masuk akaun korang. Pastikan tetamu boleh tambah gambar tanpa masalah.</li>
      <li><strong>Salin link perkongsian.</strong></li>
      <li><strong>Tukar jadi QR.</strong> Tampal link dalam mana-mana penjana QR, dan pilih QR statik. Download dalam PNG atau SVG.</li>
      <li><strong>Reka kad meja.</strong> Letak QR, satu ayat ringkas ("Scan dan upload gambar majlis kami") dan link pendek untuk yang tak boleh scan.</li>
      <li><strong>Scan semula selepas print</strong>, sebelum print banyak.</li>
    </ol>
    <p class="l-callout"><strong>Perhatian:</strong> kalau tetamu perlu log masuk akaun Google untuk upload, ramai akan berhenti di situ. Sebab tu langkah 2 penting.</p>

    <h2>Cara 2: galeri QR yang siap untuk majlis</h2>
    <p>Dengan Indahnya, QR dibuat sendiri bila korang buat majlis. Yang korang dapat:</p>
    <ul>
      <li><strong>Tiga layout untuk print:</strong> poster A5, poster A4, dan kad meja lipat dua. Nama korang dan QR dah tersusun, dalam template kad yang sama dengan e-kad.</li>
      <li><strong>BM atau English</strong>, ikut tetamu.</li>
      <li><strong>Tetamu tak perlu app atau log masuk.</strong> Scan, pilih sampai 30 gambar, upload.</li>
      <li><strong>Link yang sama</strong> dalam e-kad, untuk tetamu yang tak sempat scan.</li>
      <li><strong>Slideshow untuk TV dewan</strong> dan satu zip untuk download semua, kualiti asal.</li>
    </ul>
    <p>Percuma untuk 50 upload. Majlis besar: RM59 atau RM99 sekali bayar, lihat <NuxtLink to="/harga">harga</NuxtLink>.</p>

    <h2>Mana nak letak QR</h2>
    <ul>
      <li>Atas setiap meja makan, menghadap kerusi.</li>
      <li>Di pintu masuk dan meja buku tetamu, dalam saiz poster.</li>
      <li>Atas skrin TV dewan, kalau slideshow berjalan.</li>
      <li>Dalam kad jemputan, sebagai butang atau link.</li>
    </ul>
    <p>Langkah penuh dari sebelum majlis sampai download ada di <NuxtLink to="/panduan/kumpul-gambar-tetamu">cara kumpul gambar tetamu majlis kahwin</NuxtLink>. Nak tengok dulu? Buka <NuxtLink to="/contoh">majlis contoh (rekaan)</NuxtLink>, atau balik ke <NuxtLink to="/">galeri gambar majlis dengan QR</NuxtLink>.</p>
  </LArticle>
</template>
