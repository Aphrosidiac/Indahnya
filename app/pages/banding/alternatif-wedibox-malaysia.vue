<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { RIVALS, longDate, rival } from '~/data/rivals';

/**
 * /banding/alternatif-wedibox-malaysia: Wedibox is the name people search
 * for; this answers it for a Malaysian majlis, honestly, with dated facts
 * from wedibox.com (app/data/rivals.ts) and where Wedibox is the better buy.
 */
definePageMeta({ layout: 'bare' });
const w = rival('wedibox');
const checked = longDate(w.checked, 'ms');
const local = RIVALS.filter(r => r.origin === 'MY');
</script>

<template>
  <LArticle
    title="Alternatif Wedibox untuk majlis di Malaysia"
    description="Wedibox ialah galeri QR untuk majlis kahwin dari luar negara, dalam USD dan Bahasa Inggeris. Ni pilihan Malaysia dalam Ringgit, dan bila Wedibox lebih sesuai."
    h1="Alternatif Wedibox untuk majlis di Malaysia"
    :lead="`Indahnya, galeri gambar majlis dengan QR untuk Malaysia, ialah satu alternatif kepada Wedibox. Wedibox bagus dan matang, tapi harganya dalam USD dan bahasanya Inggeris dan Perancis. Kalau majlis korang di Malaysia, ada beberapa pilihan tempatan dalam Ringgit. Fakta Wedibox di bawah disemak dari laman Wedibox sendiri pada ${checked}.`"
    modified="2026-11-12"
    kicker="Perbandingan"
    :crumbs="[{ name: 'Banding', path: '/banding' }, { name: 'Alternatif Wedibox', path: '/banding/alternatif-wedibox-malaysia' }]"
    :faq="[
      { q: 'Wedibox boleh guna di Malaysia?', a: 'Boleh. Tetamu scan QR dan upload dari browser, sama macam galeri lain. Bayar dalam USD, dan laman dalam Bahasa Inggeris atau Perancis.' },
      { q: 'Indahnya sama macam Wedibox?', a: 'Banyak yang serupa: QR untuk gambar tetamu, tak payah app, slideshow, ucapan suara, cari meja. Bezanya Indahnya dalam BM dan Ringgit, ada e-kad gaya Malaysia dengan salam kaut DuitNow dan Waze, dan RSVP serta cari meja termasuk dalam semua pakej.' },
      { q: 'Mana lebih murah, Wedibox atau Indahnya?', a: 'Kami tak tukar USD ke Ringgit sebab kadarnya berubah. Wedibox ' + w.paid + '. Indahnya RM59 atau RM99 sekali bayar. Bandingkan pada hari korang bayar.' },
    ]"
  >
    <p><strong>Pendedahan:</strong> laman ni ditulis oleh Indahnya. Kami cuba adil: bahagian "Bila Wedibox lebih sesuai" ada di bawah.</p>

    <h2>Apa Wedibox tawarkan</h2>
    <ul>
      <li v-for="f in w.facts" :key="f.ms">{{ f.ms }}</li>
    </ul>
    <p class="l-note">Sumber: <a :href="w.url" target="_blank" rel="noopener nofollow">laman harga Wedibox</a>, disemak {{ checked }}.</p>

    <h2>Apa yang majlis di Malaysia biasanya perlukan</h2>
    <ul>
      <li><strong>Bayar dalam Ringgit</strong>, dengan FPX online banking.</li>
      <li><strong>Kad jemputan gaya Malaysia:</strong> dua pihak keluarga, aturcara, doa, Waze, salam kaut DuitNow.</li>
      <li><strong>RSVP ikut pihak</strong> (lelaki, perempuan, rakan) dan bilangan pax, untuk katering.</li>
      <li><strong>Tetamu yang tak kenal satu sama lain</strong>, ramai dari generasi makcik dan pakcik. QR atas meja lagi senang dari join group.</li>
    </ul>

    <h2>Wedibox dan Indahnya, sebelah-menyebelah</h2>
    <div class="l-table">
      <table>
        <thead><tr><th scope="col"></th><th scope="col">Wedibox</th><th scope="col">Indahnya</th></tr></thead>
        <tbody>
          <tr><th scope="row">Percuma</th><td>{{ w.free }}</td><td>50 upload, simpan 30 hari, semua ciri</td></tr>
          <tr><th scope="row">Berbayar</th><td>{{ w.paid }}</td><td>RM59 atau RM99, sekali bayar</td></tr>
          <tr><th scope="row">Simpan</th><td>{{ w.retention }}</td><td>RM59: upload 6 bulan, simpan setahun. RM99: upload 12 bulan, simpan dua tahun</td></tr>
          <tr><th scope="row">RSVP dan cari meja</th><td>Pakej $79</td><td>Semua pakej, termasuk Percuma</td></tr>
          <tr><th scope="row">Ucapan suara</th><td>{{ w.voice }}</td><td>Ya, sampai 60 saat</td></tr>
          <tr><th scope="row">Kad jemputan</th><td>{{ w.ekad }}</td><td>E-kad, 5 template, salam kaut DuitNow, Waze</td></tr>
          <tr><th scope="row">Bahasa</th><td>{{ w.languages }}</td><td>BM, EN</td></tr>
        </tbody>
      </table>
    </div>
    <p class="l-note">Lajur Wedibox disemak {{ checked }} dari <a :href="w.url" target="_blank" rel="noopener nofollow">wedibox.com/pricing</a>. Harga USD tidak ditukar.</p>

    <h2>Bila Wedibox lebih sesuai</h2>
    <p>{{ w.wins.ms }} Wedibox juga ada laman web perkahwinan dan widget untuk letak galeri dalam laman lain. Kalau majlis korang di luar negara, atau tetamu kebanyakannya bukan dari Malaysia, Wedibox pilihan yang kukuh.</p>

    <h2>Pilihan tempatan lain</h2>
    <p>Ada beberapa galeri QR lain di Malaysia. Ni yang kami semak:</p>
    <ul>
      <li v-for="r in local" :key="r.id"><a :href="r.url" target="_blank" rel="noopener nofollow">{{ r.name }}</a>: {{ r.paid }}. Simpan {{ r.retention }}.</li>
    </ul>
    <p>Jadual penuh dengan apa yang termasuk ada di <NuxtLink to="/banding">perbandingan galeri QR majlis di Malaysia</NuxtLink>. Harga Indahnya penuh di <NuxtLink to="/harga">halaman harga</NuxtLink>.</p>
  </LArticle>
</template>
