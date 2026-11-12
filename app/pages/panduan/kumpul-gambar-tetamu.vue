<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';

/**
 * /panduan/kumpul-gambar-tetamu: the core job ("cara kumpul gambar tetamu
 * kahwin"), prompts p002 to p004. Honest about the free ways first; every
 * Indahnya fact from docs/seo/research/indahnya-truth.md.
 */
definePageMeta({ layout: 'bare' });
</script>

<template>
  <LArticle
    title="Cara kumpul gambar tetamu majlis kahwin: 3 cara"
    description="Cara kumpul semua gambar tetamu masa majlis kahwin: group WhatsApp, Google Drive atau galeri QR atas meja. Langkah, kelebihan dan kekurangan setiap cara."
    h1="Cara kumpul gambar tetamu majlis kahwin"
    lead="Cara paling senang: letak QR atas setiap meja. Tetamu scan, pilih gambar dari phone dan upload. Semua masuk satu galeri, dan tuan majlis download semua dalam satu zip. Indahnya, galeri gambar majlis dengan QR, buat tepat macam ni. Kalau majlis kecil dan semua tetamu dah ada dalam satu group, WhatsApp pun boleh."
    modified="2026-11-12"
    kicker="Panduan"
    :crumbs="[{ name: 'Panduan', path: '/panduan' }, { name: 'Kumpul gambar tetamu', path: '/panduan/kumpul-gambar-tetamu' }]"
    :faq="[
      { q: 'Tetamu kena download app ke?', a: 'Dengan galeri QR Indahnya, tak. Tetamu scan QR dan galeri buka dalam browser phone. Tak payah app, tak payah buat akaun.' },
      { q: 'Boleh tapis gambar sebelum orang lain nampak?', a: 'Boleh. On approval mode, dan gambar hanya muncul dalam galeri dan atas TV lepas korang tengok. Korang juga boleh sembunyi atau padam gambar.' },
      { q: 'Kualiti gambar macam mana?', a: 'Tetamu upload fail asal dari phone. Bila korang download semua dalam zip, korang dapat kualiti asal. Gambar yang dipaparkan dalam galeri ialah salinan yang lebih ringan supaya laju dibuka.' },
      { q: 'Berapa lama gambar disimpan?', a: 'Percuma: 30 hari selepas majlis. RM59: setahun. RM99: dua tahun. Kiraan bermula dari hari majlis, bukan hari korang buat akaun.' },
    ]"
  >
    <h2>Tiga cara biasa, dan bila setiap satu sesuai</h2>
    <ul>
      <li><strong>Group WhatsApp.</strong> Sesuai untuk majlis kecil yang semua tetamu dah dalam satu group. Kelemahan: gambar bercampur dengan chat, dan kualiti ikut setting setiap tetamu.</li>
      <li><strong>Folder Google Drive atau album Google Photos.</strong> Sesuai kalau keluarga biasa guna Google. Kelemahan: link panjang susah nak terang kepada tetamu tua, dan tiada slideshow untuk dewan.</li>
      <li><strong>Galeri QR atas meja.</strong> Sesuai untuk majlis sederhana dan besar, bila tetamu ramai yang tak kenal satu sama lain. Kelemahan: ada kos untuk majlis besar, dan korang kena print QR.</li>
    </ul>
    <p>Perbandingan penuh, dengan fakta dari WhatsApp dan Google sendiri, ada di <NuxtLink to="/banding/whatsapp-google-drive">galeri QR, group WhatsApp atau Google Drive</NuxtLink>.</p>

    <h2>Langkah demi langkah dengan galeri QR</h2>
    <ol>
      <li><strong>Buat galeri untuk majlis.</strong> Isi nama pasangan, tarikh dan tempat. Satu majlis ialah satu tarikh dan satu tempat; kalau ada majlis belah perempuan dan belah lelaki pada hari berbeza, buat dua.</li>
      <li><strong>Print QR.</strong> Indahnya sediakan poster A5, poster A4 dan kad meja lipat dua, siap dengan nama korang dan template kad yang sama. BM atau English.</li>
      <li><strong>Letak QR di tempat orang tunggu.</strong> Atas setiap meja makan, di pintu masuk, dan dekat meja buku tetamu.</li>
      <li><strong>Masukkan link dalam kad jemputan.</strong> Tetamu yang tak sempat scan boleh buka link yang sama dari kad. Kalau kad dah buat di tempat lain, guna link "gambar sahaja".</li>
      <li><strong>Tetamu scan dan upload.</strong> Galeri buka dalam browser. Tetamu pilih sampai 30 gambar sekali gus, atau snap terus. Video boleh, sampai 60 saat setiap satu. Kalau line dewan putus, upload sambung sendiri bila line kembali.</li>
      <li><strong>Tayang atas TV dewan</strong> kalau nak. Satu link untuk laptop atau smart TV; gambar baru masuk sendiri dengan nama tetamu. Perlu internet di dewan. Lihat <NuxtLink to="/panduan/slideshow-tv-majlis">panduan slideshow TV majlis</NuxtLink>.</li>
      <li><strong>Download semua lepas majlis.</strong> Satu zip, susun ikut masa, kualiti asal. HEIC iPhone ditukar, video ditukar supaya main kat semua phone.</li>
    </ol>

    <h2>Tips supaya tetamu betul-betul upload</h2>
    <ul>
      <li><strong>Sebut masa majlis.</strong> MC boleh umum sekali: "Ada QR atas meja, scan dan upload gambar korang."</li>
      <li><strong>Tayang atas TV.</strong> Bila tetamu nampak gambar mereka naik atas skrin, ramai yang ikut upload.</li>
      <li><strong>Tetamu tua:</strong> minta anak saudara tolong scan untuk mereka, atau kongsi link dalam group keluarga lepas majlis.</li>
      <li><strong>On approval mode</strong> kalau risau gambar yang tak sesuai naik atas TV.</li>
      <li><strong>Hantar link sekali lagi</strong> sehari dua lepas majlis. Ramai yang baru buka phone masa tu.</li>
    </ul>

    <h2>Berapa kos</h2>
    <p>Indahnya percuma untuk mula: 50 upload, semua ciri termasuk kad dan slideshow, simpan 30 hari selepas majlis. Untuk majlis yang lebih besar, RM59 sekali bayar untuk upload tanpa had dan simpan setahun, atau RM99 untuk simpan dua tahun. Tak ada subscription, tak ada caj per tetamu. Butiran di <NuxtLink to="/harga">halaman harga</NuxtLink>.</p>

    <h2>Yang galeri QR tak buat</h2>
    <ul>
      <li>Ia tak ganti jurugambar. Ia kumpul gambar dari sudut yang jurugambar tak sempat.</li>
      <li>Ia tak cetak album. Korang download dan cetak sendiri kalau nak.</li>
      <li>Tuan majlis perlu log masuk untuk urus galeri. Hanya tetamu yang tak perlu.</li>
    </ul>
    <p>Nak cara buat QR sendiri dengan alat percuma? Baca <NuxtLink to="/panduan/cara-buat-qr-code-gambar-majlis">cara buat QR code untuk gambar majlis</NuxtLink>.</p>
  </LArticle>
</template>
