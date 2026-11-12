<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { RIVALS, longDate, rival } from '~/data/rivals';

/**
 * /banding: a neutral, dated table of the QR guest galleries a Malaysian
 * couple will find (approved 12 Nov 2026, docs/seo/strike-plan.md §8).
 * No ranking. Every rival cell comes from app/data/rivals.ts with its source
 * and date; the Indahnya row comes from the truth file (server/utils/plans.ts).
 */
definePageMeta({ layout: 'bare' });
const rows = RIVALS;
const checked = longDate(RIVALS[0]!.checked, 'ms');
const low = rival('povkita');
</script>

<template>
  <LArticle
    title="Banding galeri QR majlis di Malaysia: harga dan simpanan"
    description="Jadual galeri gambar tetamu dengan QR di Malaysia: harga, berapa lama gambar disimpan, had upload, e-kad dan RSVP. Disemak 12 November 2026, dengan sumber."
    h1="Banding galeri QR majlis di Malaysia"
    lead="Indahnya, galeri gambar majlis dengan QR, ialah salah satu daripada beberapa pilihan di Malaysia. Jadual ni letak semuanya sebelah-menyebelah: harga sekali bayar, berapa lama gambar disimpan, had upload, dan sama ada e-kad dan RSVP termasuk. Setiap angka datang dari laman vendor sendiri, dengan tarikh disemak."
    modified="2026-11-12"
    kicker="Perbandingan"
    type="CollectionPage"
    :crumbs="[{ name: 'Banding', path: '/banding' }]"
    :faq="[
      { q: 'Galeri QR mana yang harganya paling rendah?', a: 'Antara laman yang kami semak pada ' + checked + ', harga berbayar paling rendah ialah ' + low.name + ' (' + low.paid + '). Harga promosi berubah cepat, jadi semak laman vendor sebelum bayar.' },
      { q: 'Berapa lama gambar disimpan?', a: 'Kebanyakan galeri yang kami semak simpan gambar antara 7 hingga 90 hari. Indahnya simpan setahun (RM59) atau dua tahun (RM99), dikira dari hari majlis. Pakej Percuma Indahnya simpan 30 hari.' },
      { q: 'Kenapa Indahnya masuk dalam jadual sendiri?', a: 'Sebab ni laman Indahnya. Kami tulis baris kami dari kod kami sendiri, dan baris vendor lain dari laman mereka, dengan pautan. Kalau ada angka yang dah berubah, WhatsApp kami dan kami betulkan.' },
    ]"
  >
    <p><strong>Pendedahan:</strong> laman ni ditulis oleh Indahnya, yang juga salah satu pilihan dalam jadual. Kami tak susun ikut ranking. Setiap vendor ada barisnya sendiri, dan baris terakhir bagi setiap satu cerita bila vendor tu pilihan yang lebih baik.</p>

    <h2>Harga dan simpanan gambar</h2>
    <p>"Tidak dinyatakan" bermaksud laman vendor tak sebut, bukan bermaksud ciri tu tak ada. Harga dalam USD dikekalkan dalam USD.</p>
    <div class="l-table">
      <table>
        <thead>
          <tr><th scope="col">Galeri</th><th scope="col">Percuma</th><th scope="col">Berbayar (sekali bayar)</th><th scope="col">Simpan berapa lama</th><th scope="col">Had gambar</th></tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Indahnya</th>
            <td>50 upload, simpan 30 hari</td>
            <td>RM59 atau RM99</td>
            <td>RM59: setahun. RM99: dua tahun. Dikira dari hari majlis</td>
            <td>Tiada had pada pakej berbayar</td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <th scope="row"><a :href="r.url" target="_blank" rel="noopener nofollow">{{ r.name }}</a></th>
            <td>{{ r.free }}</td>
            <td>{{ r.paid }}</td>
            <td>{{ r.retention }}</td>
            <td>{{ r.cap }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="l-note">Disemak {{ checked }} dari laman setiap vendor (pautan pada nama). Baris Indahnya dari <NuxtLink to="/harga">halaman harga Indahnya</NuxtLink>.</p>

    <h2>Apa yang termasuk selain gambar</h2>
    <div class="l-table">
      <table>
        <thead>
          <tr><th scope="col">Galeri</th><th scope="col">E-kad</th><th scope="col">RSVP</th><th scope="col">Ucapan suara</th><th scope="col">Tayang atas TV</th><th scope="col">Bahasa</th></tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Indahnya</th>
            <td>Ya, 5 template, termasuk</td>
            <td>Ya, termasuk</td>
            <td>Ya, sampai 60 saat</td>
            <td>Ya, perlu internet di dewan</td>
            <td>BM, EN</td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <th scope="row">{{ r.name }}</th>
            <td>{{ r.ekad }}</td>
            <td>{{ r.rsvp }}</td>
            <td>{{ r.voice }}</td>
            <td>{{ r.tv }}</td>
            <td>{{ r.languages }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="l-note">Disemak {{ checked }}.</p>

    <h2>Bila pilihan lain lebih sesuai</h2>
    <ul>
      <li v-for="r in rows" :key="r.id"><strong>{{ r.name }}:</strong> {{ r.wins.ms }}</li>
      <li><strong>Indahnya:</strong> bila korang nak kad, RSVP, cari meja, ucapan suara dan galeri dalam satu link, dan nak gambar kekal setahun atau dua.</li>
    </ul>

    <h2>Macam mana nak pilih</h2>
    <ol>
      <li><strong>Kira tetamu.</strong> Majlis kecil yang semua orang dah ada dalam satu group WhatsApp mungkin tak perlu galeri pun. Baca <NuxtLink to="/banding/whatsapp-google-drive">galeri QR atau group WhatsApp dan Google Drive</NuxtLink>.</li>
      <li><strong>Tengok berapa lama gambar disimpan.</strong> Gambar tetamu biasanya sampai berminggu-minggu lepas majlis. Pastikan galeri masih buka masa tu, dan korang sempat download semua.</li>
      <li><strong>Kira semua sekali.</strong> Kalau kad, RSVP dan galeri dibeli asing-asing, campur harganya.</li>
      <li><strong>Cuba dulu.</strong> Beberapa galeri ada pakej percuma atau contoh. Indahnya ada <NuxtLink to="/contoh">majlis contoh (rekaan)</NuxtLink>.</li>
    </ol>

    <h2>Perbandingan lain</h2>
    <ul>
      <li><NuxtLink to="/banding/whatsapp-google-drive">Galeri QR, group WhatsApp atau Google Drive untuk gambar majlis</NuxtLink></li>
      <li><NuxtLink to="/banding/alternatif-wedibox-malaysia">Alternatif Wedibox untuk majlis di Malaysia</NuxtLink></li>
    </ul>
  </LArticle>
</template>
