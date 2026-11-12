<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

/**
 * /banding/whatsapp-google-drive: the real competitor is free. A decision
 * rule, not a sales page: when a WhatsApp group, a Drive folder or a Google
 * Photos album is enough, and when a QR gallery helps. Facts about WhatsApp
 * and Google come only from their own help pages, read 12 Nov 2026
 * (docs/seo/research/competitors/do-nothing-alternatives.md). Whether a
 * signed-out guest can upload to a Drive folder is not stated by Google, so
 * the page tells hosts to test it rather than claiming either way.
 */
definePageMeta({ layout: 'bare' });
const WA = 'https://faq.whatsapp.com/759301289012856/';
const DRIVE = 'https://support.google.com/drive/answer/2494822?hl=en';
const PHOTOS = 'https://support.google.com/photos/answer/9789702?hl=en';
</script>

<template>
  <LArticle
    title="Gambar majlis: galeri QR, group WhatsApp atau Google Drive?"
    description="Bila group WhatsApp cukup, bila Google Drive atau Google Photos sesuai, dan bila galeri QR membantu untuk gambar tetamu majlis kahwin. Dengan sumber rasmi."
    h1="Galeri QR, group WhatsApp atau Google Drive untuk gambar majlis?"
    lead="Untuk majlis kecil yang semua tetamu dah ada dalam satu group, WhatsApp selalunya cukup. Untuk majlis besar dengan tetamu yang tak kenal satu sama lain, galeri QR seperti Indahnya, galeri gambar majlis dengan QR, lagi senang: tetamu scan QR atas meja dan upload terus, tanpa join group atau log masuk. Ni cara pilih, dengan kelemahan setiap satu."
    modified="2026-11-12"
    kicker="Perbandingan"
    :crumbs="[{ name: 'Banding', path: '/banding' }, { name: 'WhatsApp dan Google Drive', path: '/banding/whatsapp-google-drive' }]"
    :faq="[
      { q: 'Kenapa gambar WhatsApp nampak pecah?', a: 'WhatsApp ada dua kualiti hantar: Standard dan HD. Kalau tetamu hantar dalam Standard, gambar yang sampai kurang jelas. Gambar yang dah dihantar tak boleh dinaikkan ke HD; kena hantar semula dalam HD.' },
      { q: 'Tetamu boleh upload ke Google Drive tanpa akaun Google?', a: 'Halaman bantuan Google kata sesiapa dengan link boleh buka fail tanpa log masuk, tapi tak sebut sama ada mereka boleh tambah fail. Cuba sendiri dalam browser incognito sebelum majlis.' },
      { q: 'Boleh guna dua-dua sekali?', a: 'Boleh. Contohnya, download semua gambar dari galeri, kemudian simpan dalam Google Photos. Indahnya bagi satu zip, kualiti asal, susun ikut masa.' },
    ]"
  >
    <p><strong>Pendedahan:</strong> laman ni ditulis oleh Indahnya, salah satu pilihan di bawah. Fakta tentang WhatsApp dan Google diambil dari halaman bantuan mereka sendiri, disemak 12 November 2026.</p>

    <h2>Jawapan ringkas</h2>
    <div class="l-table">
      <table>
        <thead><tr><th scope="col">Pilihan</th><th scope="col">Sesuai bila</th><th scope="col">Kelemahan utama</th></tr></thead>
        <tbody>
          <tr><th scope="row">Group WhatsApp</th><td>Majlis kecil, semua tetamu dah dalam satu group</td><td>Gambar bercampur dengan chat; kualiti ikut setting setiap tetamu</td></tr>
          <tr><th scope="row">Folder Google Drive</th><td>Keluarga yang biasa guna Google, dan korang ada ruang storan</td><td>Susah nak terang link kepada tetamu tua; tiada slideshow</td></tr>
          <tr><th scope="row">Album Google Photos</th><td>Simpan jangka panjang, kongsi dengan keluarga</td><td>Tiada kad, RSVP atau cari meja; tetamu perlu faham cara tambah gambar</td></tr>
          <tr><th scope="row">Galeri QR (contohnya Indahnya)</th><td>Majlis sederhana dan besar, tetamu ramai yang tak kenal satu sama lain</td><td>Kos (Indahnya: percuma untuk 50 upload, kemudian RM59 atau RM99 sekali bayar); perlu print QR</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Group WhatsApp</h2>
    <p>Semua orang ada WhatsApp, jadi tak ada benda baru nak terang. Untuk kenduri kecil atau majlis keluarga, ni pilihan yang paling mudah.</p>
    <p>Masalahnya datang bila tetamu ramai:</p>
    <ul>
      <li><strong>Kualiti ikut tetamu.</strong> WhatsApp bagi pilihan Standard atau HD setiap kali hantar, dan HD boleh dijadikan default dalam Settings, Storage and data, Media upload quality. Gambar yang dah dihantar tak boleh dinaikkan ke HD. Sumber: <a :href="WA" target="_blank" rel="noopener nofollow">bantuan WhatsApp tentang gambar HD</a>.</li>
      <li><strong>Bercampur dengan chat.</strong> Gambar, ucapan, sticker dan voice note semua dalam satu aliran.</li>
      <li><strong>Kena join group dulu.</strong> Tetamu dari pihak lain, kawan opis dan makcik saudara jauh bukan semua dalam group yang sama.</li>
      <li><strong>"Nanti aku send."</strong> Ada yang niat nak hantar lepas majlis, tapi lupa.</li>
    </ul>

    <h2>Folder Google Drive</h2>
    <p>Korang buat satu folder, kongsi dengan link, dan minta tetamu letak gambar dalam folder tu.</p>
    <ul>
      <li><strong>Buka tanpa log masuk:</strong> bantuan Google kata, bila link ditetapkan "Anyone with the link", sesiapa yang ada link boleh buka fail tanpa log masuk akaun Google. Sumber: <a :href="DRIVE" target="_blank" rel="noopener nofollow">bantuan Google Drive tentang perkongsian</a>.</li>
      <li><strong>Tambah fail:</strong> halaman yang sama tak sebut sama ada tetamu tanpa akaun boleh upload ke folder. Cuba sendiri dalam browser incognito, dengan phone yang tak log masuk Google, sebelum print link tu.</li>
      <li><strong>Storan korang sendiri:</strong> setiap gambar dan video tetamu guna ruang akaun korang.</li>
    </ul>

    <h2>Album Google Photos</h2>
    <p>Google Photos bagus untuk simpan lama. Pemilik album pilih sama ada orang lain boleh tambah gambar, komen dan like, dan album boleh dikongsi dengan link. Sumber: <a :href="PHOTOS" target="_blank" rel="noopener nofollow">bantuan Google Photos tentang album kongsi</a>.</p>
    <p>Yang tak ada: kad jemputan, RSVP, cari nombor meja, ucapan, dan slideshow live untuk dewan.</p>

    <h2>Galeri QR</h2>
    <p>Korang letak QR atas setiap meja. Tetamu scan, pilih sampai 30 gambar sekali gus, dan upload dari browser phone. Tak payah app, tak payah login, tak payah join group. Semua masuk satu galeri dengan nama siapa yang snap, dan boleh naik atas TV dewan masa majlis.</p>
    <p>Dengan Indahnya, link yang sama juga bawa e-kad, RSVP, cari meja dan ucapan suara. Lepas majlis, korang download semua gambar dalam satu zip, kualiti asal. Pakej RM59 simpan setahun dari hari majlis.</p>
    <p>Yang Indahnya tak buat: ia tak ganti jurugambar, tak cetak album, dan slideshow perlukan internet di dewan. Satu majlis ialah satu tarikh dan satu tempat; kalau ada dua majlis, buat dua.</p>

    <h2>Macam mana nak pilih</h2>
    <ol>
      <li><strong>Semua tetamu dah dalam satu group?</strong> Guna WhatsApp, dan minta semua hantar dalam HD.</li>
      <li><strong>Nak simpan lama dan kongsi dengan keluarga?</strong> Google Photos, atau download semua dari galeri dan simpan dalam Google Photos.</li>
      <li><strong>Tetamu ramai, tak kenal satu sama lain, dan nak tengok gambar atas TV masa majlis?</strong> Galeri QR. Baca <NuxtLink to="/panduan/kumpul-gambar-tetamu">cara kumpul gambar tetamu</NuxtLink>, atau tengok <NuxtLink to="/harga">harga Indahnya</NuxtLink>.</li>
    </ol>
    <p>Galeri QR lain di Malaysia, dengan harga dan tempoh simpanan, ada di <NuxtLink to="/banding">perbandingan galeri QR majlis</NuxtLink>.</p>
  </LArticle>
</template>
