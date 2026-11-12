<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

definePageMeta({ layout: 'bare' });

const guides = [
  { to: '/panduan/kumpul-gambar-tetamu', t: 'Cara kumpul gambar tetamu kahwin', d: 'WhatsApp group, album Google, atau galeri QR: bila setiap satu cukup, dan langkah untuk galeri QR.' },
  { to: '/panduan/rsvp-dan-susun-meja', t: 'Cara buat RSVP dan susun meja', d: 'Kumpul jawapan hadir, kira bilangan untuk katering, tetapkan meja dan bagi tetamu cari meja sendiri.' },
  { to: '/panduan/cara-buat-qr-code-gambar-majlis', t: 'Cara buat QR code gambar majlis', d: 'Buat QR untuk album bersama, atau guna galeri yang ada QR sendiri, dan di mana nak letak di dewan.' },
  { to: '/panduan/slideshow-tv-majlis', t: 'Slideshow gambar tetamu di TV dewan', d: 'Satu link di laptop atau TV dewan, perlu internet, dan apa nak uji sehari sebelum majlis.' },
];
</script>

<template>
  <LArticle
    title="Panduan majlis: gambar tetamu, RSVP, TV dewan"
    description="Panduan ringkas Indahnya, galeri gambar majlis dengan QR: kumpul gambar tetamu, buat RSVP dan susun meja, buat QR code dan slideshow gambar di TV dewan."
    h1="Panduan untuk tuan majlis"
    lead="Empat panduan dari Indahnya, galeri gambar majlis dengan QR, untuk urusan yang selalu tersangkut sebelum majlis: kumpul gambar tetamu, RSVP dan meja, QR code, dan slideshow di TV dewan. Setiap panduan jujur tentang bila cara lain pun cukup."
    modified="2026-11-12"
    type="CollectionPage"
    :crumbs="[{ name: 'Panduan', path: '/panduan' }]"
  >
    <ul class="not-prose !m-0 !list-none !p-0">
      <li v-for="g in guides" :key="g.to" class="!m-0 border-b border-[#1a1a1a]/10 py-5 first:pt-0">
        <h2 class="!m-0 !text-[22px]"><a :href="g.to" class="!no-underline hover:!underline">{{ g.t }}</a></h2>
        <p class="!mt-1">{{ g.d }}</p>
      </li>
    </ul>
    <p>Nak tengok semua ni berjalan dulu? Buka <a href="/contoh">majlis contoh</a>. Untuk kad dan RSVP dalam satu link, baca tentang <a href="/e-kad">e-kad</a>.</p>
  </LArticle>
</template>
