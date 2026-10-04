/**
 * The privacy notice and the terms, in BM and English (the PDPA 2010 wants a
 * notice in both). Written against what the code actually does — the two
 * buckets, the EXIF strip, the retention sweep, the guest cookie — so a
 * change to any of those is a change here too.
 *
 * Plain paragraphs only: each section is a heading and a list of paragraphs
 * or bullet lists. No HTML is rendered from these strings.
 */
export interface LegalSection { h: string; p?: string[]; ul?: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[]; other: string }

const UPDATED_MS = 'Dikemas kini 24 September 2026';
const UPDATED_EN = 'Updated 24 September 2026';
const CONTACT_MS = 'Email hello@indahnya.my atau WhatsApp +60 13-907 8719.';
const CONTACT_EN = 'Email hello@indahnya.my or WhatsApp +60 13-907 8719.';

export const PRIVACY: Record<'ms' | 'en', LegalDoc> = {
  ms: {
    title: 'Notis Privasi',
    updated: UPDATED_MS,
    intro: 'Indahnya (indahnya.my) dikendalikan oleh FF Dev Studio, Malaysia. Notis ni terangkan data apa yang kami kumpul, kenapa, siapa boleh tengok, berapa lama kami simpan, dan hak korang di bawah Akta Perlindungan Data Peribadi 2010.',
    sections: [
      { h: 'Data yang kami kumpul', ul: [
        'Tuan majlis: alamat email, nama (kalau log masuk dengan Google), dan butiran majlis yang korang isi — nama, tarikh, tempat.',
        'Tetamu: gambar dan video yang diupload, nama yang tetamu pilih untuk isi (tak wajib), dan reaksi pada gambar. Tetamu tak perlu akaun, email atau nombor telefon.',
        'Bayaran: status bayaran dan jumlah. Butiran kad, FPX dan GrabPay diproses terus oleh Stripe — kami tak nampak dan tak simpan.',
        'Teknikal: alamat IP (untuk keselamatan dan had cubaan), dan cookie yang perlu untuk sistem jalan — satu untuk log masuk tuan majlis, satu untuk kenal browser tetamu supaya "Gambar saya" dan padam gambar sendiri boleh berfungsi. Tak ada cookie iklan atau tracking pihak ketiga.',
      ] },
      { h: 'Maklumat dalam gambar', p: [
        'Gambar dari phone selalunya ada metadata (EXIF), termasuk kadang-kadang lokasi GPS. Salinan yang dipaparkan dalam galeri dan atas TV dah dibuang semua metadata ni. Fail asal disimpan secara tertutup, dan hanya tuan majlis boleh download fail asal (contohnya dalam zip).',
      ] },
      { h: 'Kenapa kami guna data ni', ul: [
        'Untuk jalankan galeri, slideshow dan kad jemputan majlis korang.',
        'Untuk hantar link log masuk dan email penting — contohnya amaran sebelum tempoh simpanan tamat.',
        'Untuk proses bayaran dan simpan rekod transaksi.',
        'Untuk keselamatan: halang spam, penyalahgunaan dan cubaan log masuk berulang.',
      ], p: ['Kami tak jual data, tak guna gambar majlis untuk iklan, dan tak kongsi dengan pihak lain selain yang disenaraikan di bawah.'] },
      { h: 'Siapa boleh tengok', ul: [
        'Sesiapa yang ada link majlis boleh tengok gambar dalam galeri. Link ni tak disenaraikan dalam Google atau enjin carian lain — tapi sesiapa yang dapat link boleh buka, jadi kongsi dengan orang yang korang percaya.',
        'Gambar yang disembunyikan oleh tuan majlis, atau yang menunggu kelulusan, dipindahkan keluar dari akses awam. Link lama ke gambar tu terus tak berfungsi.',
        'Tuan majlis (dan co-host) nampak semua gambar majlis mereka, termasuk nama tetamu yang upload.',
        'Pembekal yang bantu kami jalankan Indahnya: Cloudflare (simpanan gambar), penyedia server kami, Stripe (bayaran), penyedia email, dan Google (kalau korang pilih log masuk dengan Google). Sesetengah pembekal ni simpan data di luar Malaysia.',
      ] },
      { h: 'Berapa lama kami simpan', ul: [
        'Gambar dan video disimpan ikut pakej: Percuma 30 hari selepas majlis, Indahnya 1 tahun, Indahnya Lengkap 2 tahun. Kami email tuan majlis sebelum tamat.',
        'Selepas tempoh simpanan tamat, ada 30 hari lagi untuk download atau lanjutkan. Lepas tu semua gambar dan video dipadam terus, dan tak boleh dikembalikan.',
        'Kalau tuan majlis padam majlis, semua gambar dan video dipadam serta-merta.',
        'Tetamu boleh padam gambar sendiri dalam tempoh yang tuan majlis benarkan (biasanya 24 jam).',
        'Link log masuk tamat dalam 15 minit. Sesi log masuk tamat selepas 90 hari.',
        'Rekod bayaran disimpan selama yang diperlukan oleh undang-undang cukai dan perakaunan.',
      ] },
      { h: 'Hak korang', p: [
        'Korang boleh minta akses kepada data peribadi korang, minta ia dibetulkan, tarik balik persetujuan, atau minta ia dipadam. Tetamu yang nak gambar diturunkan boleh minta tuan majlis, atau hubungi kami terus dengan link majlis dan gambar yang terlibat. Kami balas dalam 21 hari.',
      ] },
      { h: 'Keselamatan', p: [
        'Semua sambungan guna HTTPS. Fail asal dan gambar tersembunyi disimpan dalam simpanan tertutup, bukan awam. Akses tuan majlis guna link sekali guna, bukan password yang boleh dicuri. Tiada sistem yang 100% selamat, tapi kami ambil langkah yang munasabah untuk lindungi data korang.',
      ] },
      { h: 'Kanak-kanak', p: [
        'Majlis selalunya ada budak-budak dalam gambar. Tuan majlis bertanggungjawab siapa yang dapat link galeri, dan boleh sembunyi atau padam mana-mana gambar bila-bila masa.',
      ] },
      { h: 'Perubahan', p: ['Kalau kami ubah notis ni dengan ketara, kami kemas kini tarikh di atas dan maklumkan tuan majlis melalui email.'] },
      { h: 'Hubungi kami', p: [`${CONTACT_MS} Jika ada percanggahan antara versi BM dan English, versi BM terpakai.`] },
    ],
    other: 'Read in English',
  },
  en: {
    title: 'Privacy Notice',
    updated: UPDATED_EN,
    intro: 'Indahnya (indahnya.my) is operated by FF Dev Studio, Malaysia. This notice explains what data we collect, why, who can see it, how long we keep it, and your rights under the Personal Data Protection Act 2010.',
    sections: [
      { h: 'What we collect', ul: [
        'Hosts: email address, name (if you sign in with Google), and the event details you enter — names, date, venue.',
        'Guests: the photos and videos they upload, a name they may choose to add (optional), and reactions to photos. Guests need no account, email or phone number.',
        'Payments: payment status and amount. Card, FPX and GrabPay details are handled by Stripe directly — we never see or store them.',
        'Technical: IP address (for security and rate limits), and the cookies the service needs to work — one keeps a host signed in, one recognises a guest\'s browser so "My photos" and deleting your own photo work. No advertising or third-party tracking cookies.',
      ] },
      { h: 'Information inside photos', p: [
        'Photos from phones usually carry metadata (EXIF), sometimes including GPS location. The copies shown in the gallery and on the TV have all of that removed. Originals are stored privately, and only the host can download them (for example in the zip).',
      ] },
      { h: 'Why we use it', ul: [
        'To run your event\'s gallery, slideshow and invitation.',
        'To send sign-in links and important emails — for example a warning before storage ends.',
        'To process payments and keep transaction records.',
        'For security: to stop spam, abuse and repeated sign-in attempts.',
      ], p: ['We do not sell data, do not use event photos for advertising, and do not share them with anyone beyond the providers listed below.'] },
      { h: 'Who can see what', ul: [
        'Anyone with the event link can view the gallery. The link is not listed on Google or other search engines — but anyone who has it can open it, so share it with people you trust.',
        'Photos the host hides, or that are awaiting approval, are moved out of public access. Old links to them stop working.',
        'Hosts (and co-hosts) see every photo of their event, including the name of the guest who uploaded it.',
        'Providers that help us run Indahnya: Cloudflare (photo storage), our server host, Stripe (payments), our email provider, and Google (if you choose Google sign-in). Some of them store data outside Malaysia.',
      ] },
      { h: 'How long we keep it', ul: [
        'Photos and videos are kept according to the plan: Free for 30 days after the event, Indahnya for 1 year, Indahnya Lengkap for 2 years. We email the host before it ends.',
        'After storage ends there are 30 more days to download or extend. After that every photo and video is permanently deleted and cannot be recovered.',
        'If the host deletes the event, all photos and videos are deleted at once.',
        'Guests can delete their own photo within the window the host allows (24 hours by default).',
        'Sign-in links expire after 15 minutes. Sign-in sessions end after 90 days.',
        'Payment records are kept as long as tax and accounting law requires.',
      ] },
      { h: 'Your rights', p: [
        'You may ask for access to your personal data, ask for it to be corrected, withdraw consent, or ask for it to be deleted. A guest who wants a photo taken down can ask the host, or contact us directly with the event link and the photo in question. We reply within 21 days.',
      ] },
      { h: 'Security', p: [
        'Every connection uses HTTPS. Originals and hidden photos live in private storage, not public. Hosts sign in with one-time links, not passwords that can be stolen. No system is 100% secure, but we take reasonable steps to protect your data.',
      ] },
      { h: 'Children', p: [
        'Events often have children in the photos. The host decides who gets the gallery link, and can hide or delete any photo at any time.',
      ] },
      { h: 'Changes', p: ['If we change this notice materially, we update the date above and let hosts know by email.'] },
      { h: 'Contact us', p: [`${CONTACT_EN} If the BM and English versions differ, the BM version prevails.`] },
    ],
    other: 'Baca dalam BM',
  },
};

export const TERMS: Record<'ms' | 'en', LegalDoc> = {
  ms: {
    title: 'Terma Perkhidmatan',
    updated: UPDATED_MS,
    intro: 'Terma ni terpakai bila korang guna Indahnya (indahnya.my), perkhidmatan oleh FF Dev Studio, Malaysia. Dengan buat majlis atau upload gambar, korang setuju dengan terma ni dan Notis Privasi kami.',
    sections: [
      { h: 'Perkhidmatan', p: ['Indahnya bagi setiap majlis satu link dan QR untuk tetamu upload gambar dan video ke satu galeri, dengan slideshow untuk skrin dewan dan dashboard untuk tuan majlis. Tetamu tak perlu akaun.'] },
      { h: 'Akaun tuan majlis', p: ['Tuan majlis log masuk dengan email atau Google. Jaga akses email korang — sesiapa yang boleh buka email tu boleh log masuk. Korang bertanggungjawab atas apa yang berlaku dalam majlis korang, termasuk siapa yang korang bagi link.'] },
      { h: 'Pakej dan bayaran', ul: [
        'Pakej Percuma, Indahnya (RM59) dan Indahnya Lengkap (RM99) adalah bayaran sekali untuk satu majlis. Tiada langganan, tiada caj automatik.',
        'Tempoh upload dan simpanan dikira dari tarikh majlis atau tarikh bayar, yang mana lebih lewat.',
        'Naik taraf dari Indahnya ke Indahnya Lengkap hanya caj bezanya. Lanjutan simpanan dibuka dalam 30 hari terakhir tempoh simpanan dan dalam 30 hari selepas ia tamat.',
        'Bayaran diproses oleh Stripe dalam Ringgit Malaysia. Resit dihantar ke email.',
        'Kalau galeri gagal berfungsi pada hari majlis disebabkan masalah di pihak kami, hubungi kami dalam 14 hari selepas majlis untuk bayaran balik penuh.',
      ] },
      { h: 'Kandungan yang diupload', ul: [
        'Gambar dan video kekal hak milik orang yang ambil. Korang bagi kami kebenaran terhad untuk simpan, proses dan paparkan kandungan tu semata-mata untuk jalankan perkhidmatan untuk majlis korang.',
        'Upload hanya kandungan yang korang ada hak untuk kongsi. Jangan upload kandungan lucah, ganas, berunsur kebencian, yang melanggar privasi orang lain, atau yang menyalahi undang-undang Malaysia.',
        'Tuan majlis boleh sembunyi atau padam mana-mana gambar. Kami boleh turunkan kandungan yang menyalahi terma ni atau undang-undang, dan tutup majlis yang disalahgunakan.',
        'Kami tak guna gambar majlis korang untuk promosi tanpa kebenaran bertulis.',
      ] },
      { h: 'Simpanan dan pemadaman', p: ['Download gambar korang sebelum tempoh simpanan tamat. Selepas tamat dan 30 hari tambahan, semua fail dipadam terus dan tak boleh dikembalikan. Kami email peringatan, tapi tanggungjawab untuk download adalah pada tuan majlis.'] },
      { h: 'Ketersediaan', p: ['Kami usahakan Indahnya sentiasa berjalan, tapi internet dewan, rangkaian telefon dan pembekal pihak ketiga di luar kawalan kami. Perkhidmatan disediakan "seadanya".'] },
      { h: 'Had tanggungan', p: ['Setakat yang dibenarkan undang-undang, tanggungan kami untuk apa-apa tuntutan berkaitan satu majlis terhad kepada jumlah yang korang bayar untuk majlis tu. Tiada apa dalam terma ni yang menghadkan hak pengguna di bawah Akta Perlindungan Pengguna 1999.'] },
      { h: 'Undang-undang', p: ['Terma ni tertakluk kepada undang-undang Malaysia. Kalau kami ubah terma ni, kami kemas kini tarikh di atas; perubahan ketara dimaklumkan melalui email.'] },
      { h: 'Hubungi kami', p: [`${CONTACT_MS} Jika ada percanggahan antara versi BM dan English, versi BM terpakai.`] },
    ],
    other: 'Read in English',
  },
  en: {
    title: 'Terms of Service',
    updated: UPDATED_EN,
    intro: 'These terms apply when you use Indahnya (indahnya.my), a service by FF Dev Studio, Malaysia. By creating an event or uploading a photo you agree to these terms and our Privacy Notice.',
    sections: [
      { h: 'The service', p: ['Indahnya gives each event one link and QR for guests to upload photos and videos into one gallery, with a slideshow for the venue screen and a dashboard for the host. Guests need no account.'] },
      { h: 'Host accounts', p: ['Hosts sign in with email or Google. Keep your email secure — anyone who can open it can sign in. You are responsible for what happens in your event, including who you give the link to.'] },
      { h: 'Plans and payment', ul: [
        'Free, Indahnya (RM59) and Indahnya Lengkap (RM99) are one-time payments for one event. No subscription, no automatic charges.',
        'Upload and storage windows run from the event date or the payment date, whichever is later.',
        'Upgrading from Indahnya to Indahnya Lengkap charges only the difference. Extending storage opens in the last 30 days of storage and for 30 days after it ends.',
        'Payments are processed by Stripe in Malaysian Ringgit. A receipt is emailed to you.',
        'If the gallery fails to work on the day of the event because of a problem on our side, contact us within 14 days of the event for a full refund.',
      ] },
      { h: 'Uploaded content', ul: [
        'Photos and videos remain the property of whoever took them. You give us a limited permission to store, process and display that content solely to run the service for your event.',
        'Only upload content you have the right to share. Do not upload content that is sexual, violent, hateful, invades someone else\'s privacy, or is unlawful in Malaysia.',
        'Hosts can hide or delete any photo. We may remove content that breaks these terms or the law, and close events that are abused.',
        'We do not use your event photos for promotion without written permission.',
      ] },
      { h: 'Storage and deletion', p: ['Download your photos before storage ends. After it ends and 30 more days pass, every file is permanently deleted and cannot be recovered. We send reminders, but downloading is the host\'s responsibility.'] },
      { h: 'Availability', p: ['We work to keep Indahnya running, but venue wifi, mobile networks and third-party providers are outside our control. The service is provided "as is".'] },
      { h: 'Limit of liability', p: ['As far as the law allows, our liability for any claim about an event is limited to what you paid for that event. Nothing in these terms limits your rights as a consumer under the Consumer Protection Act 1999.'] },
      { h: 'Law', p: ['These terms are governed by the laws of Malaysia. If we change them, we update the date above; material changes are announced by email.'] },
      { h: 'Contact us', p: [`${CONTACT_EN} If the BM and English versions differ, the BM version prevails.`] },
    ],
    other: 'Baca dalam BM',
  },
};
