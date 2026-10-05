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

const UPDATED_MS = 'Dikemas kini 5 Oktober 2026';
const UPDATED_EN = 'Updated 5 October 2026';
const CONTACT_MS = 'Email hello@indahnya.my atau WhatsApp +60 13‑907 8719.';
const CONTACT_EN = 'Email hello@indahnya.my or WhatsApp +60 13‑907 8719.';

export const PRIVACY: Record<'ms' | 'en', LegalDoc> = {
  ms: {
    title: 'Notis Privasi',
    updated: UPDATED_MS,
    intro: 'Indahnya (indahnya.my) dikendalikan oleh FF Dev Studio, Malaysia — pengguna data di bawah Akta Perlindungan Data Peribadi 2010 (butiran syarikat di bawah). Notis ni terangkan data apa yang kami kumpul, kenapa, siapa boleh tengok, berapa lama kami simpan, dan hak korang.',
    sections: [
      { h: 'Data yang kami kumpul', ul: [
        'Tuan majlis: alamat email (wajib, untuk log masuk), nama (kalau log masuk dengan Google), dan butiran majlis yang korang isi — nama, tarikh, tempat.',
        'Kad jemputan: apa yang tuan majlis letak dalam kad — nama pengantin dan ibu bapa, aturcara, nombor telefon untuk dihubungi, gambar, lagu, dan untuk salam kaut, nombor akaun bank atau QR DuitNow. Semua ni boleh dilihat oleh sesiapa yang ada link majlis, jadi letak hanya apa yang korang setuju untuk kongsi.',
        'Tetamu — gambar dan video: fail yang diupload, nama yang tetamu pilih untuk isi, dan reaksi pada gambar.',
        'Tetamu — RSVP: nama, hadir atau tak, bilangan orang, pihak, pilihan makanan, nota, dan nombor telefon (pilihan sendiri). Tuan majlis juga boleh masukkan RSVP yang diterima melalui telefon.',
        'Tetamu — ucapan: ucapan bertulis, dan ucapan suara (rakaman suara tetamu sampai 60 saat).',
        'Tetamu tak perlu akaun atau email. Semua maklumat tetamu adalah pilihan — tak isi pun boleh tengok galeri dan upload gambar.',
        'Bayaran: status bayaran dan jumlah. Butiran kad, FPX dan GrabPay diproses terus oleh Stripe — kami tak nampak dan tak simpan.',
        'Teknikal: alamat IP (untuk keselamatan dan had cubaan), dan cookie yang perlu untuk sistem jalan — satu untuk log masuk tuan majlis, satu untuk kenal browser tetamu supaya "Gambar saya", RSVP dan padam gambar sendiri boleh berfungsi. Tak ada cookie iklan, analitik atau tracking pihak ketiga.',
      ] },
      { h: 'Maklumat dalam gambar dan video', p: [
        'Gambar dan video dari phone selalunya ada metadata, termasuk kadang-kadang lokasi GPS tempat ia diambil. Salinan yang dipaparkan dalam galeri, atas TV dan dalam kad dah dibuang semua metadata ni. Fail asal disimpan secara tertutup, dan hanya tuan majlis boleh download fail asal (contohnya dalam zip) — fail asal tu masih ada metadata asalnya.',
      ] },
      { h: 'Kenapa kami guna data ni', ul: [
        'Untuk jalankan galeri, slideshow, kad jemputan, RSVP, susunan tempat duduk dan ucapan untuk majlis korang.',
        'Untuk hantar link log masuk dan email penting — contohnya amaran sebelum gambar dipadam.',
        'Untuk proses bayaran dan simpan rekod transaksi.',
        'Untuk keselamatan: halang spam, penyalahgunaan dan cubaan log masuk berulang.',
      ], p: ['Kami tak jual data, tak guna gambar majlis untuk iklan, dan tak kongsi dengan pihak lain selain yang disenaraikan di bawah.'] },
      { h: 'Siapa boleh tengok', ul: [
        'Sesiapa yang ada link majlis boleh tengok kad, galeri dan ucapan yang dipaparkan. Link ni tak disenaraikan dalam Google atau enjin carian lain — tapi sesiapa yang dapat link boleh buka, jadi kongsi dengan orang yang korang percaya.',
        'Cari tempat duduk: kalau tuan majlis buka ciri ni, sesiapa yang ada link boleh taip sekurang-kurangnya 3 huruf nama dan nampak nama tetamu yang sepadan, bilangan orang dan nombor meja (paling banyak 5 nama sekali cari). Maklumat RSVP lain tak dipaparkan kepada tetamu.',
        'Gambar dan ucapan suara yang disembunyikan oleh tuan majlis, atau yang menunggu kelulusan, dipindahkan keluar dari akses awam. Link lama ke fail tu berhenti berfungsi (salinan cache dalam browser atau rangkaian mungkin kekal sehingga satu jam).',
        'Tuan majlis nampak semua gambar, RSVP (termasuk nombor telefon) dan ucapan majlis mereka, termasuk nama tetamu.',
        'Pembekal yang bantu kami jalankan Indahnya: Cloudflare (simpanan dan penghantaran gambar), penyedia server kami, Stripe (bayaran), penyedia email, dan Google (kalau korang pilih log masuk dengan Google). Mereka proses data hanya untuk tujuan tu.',
      ] },
      { h: 'Pemindahan ke luar Malaysia', p: [
        'Sesetengah pembekal di atas simpan atau proses data di luar Malaysia — contohnya pusat data Cloudflare di rantau Asia Pasifik, dan Stripe serta Google di Amerika Syarikat dan Eropah. Kami hanya guna pembekal yang terikat dengan kontrak dan polisi perlindungan data yang sekurang-kurangnya setara dengan perlindungan di bawah undang-undang Malaysia.',
      ] },
      { h: 'Berapa lama kami simpan', ul: [
        'Gambar, video dan ucapan disimpan ikut pakej: Percuma 30 hari selepas majlis, Indahnya 1 tahun, Indahnya Lengkap 2 tahun. Kami email tuan majlis 14 hari sebelum tamat, pada hari ia tamat, dan sekali lagi sekurang-kurangnya 7 hari sebelum dipadam.',
        'Selepas tempoh simpanan tamat, ada sekurang-kurangnya 30 hari lagi untuk download atau lanjutkan. Lepas tu semua gambar, video dan ucapan dipadam terus, bersama data tetamu (RSVP, nombor telefon, susunan meja) dan butiran peribadi dalam kad (nama ibu bapa, nombor telefon, akaun bank). Yang tinggal hanya tajuk dan tarikh majlis dalam senarai tuan majlis.',
        'Kalau tuan majlis padam majlis, ia terus hilang dari link tetamu, dan semua kandungannya dipadam terus selepas 7 hari (dalam tempoh tu tuan majlis boleh pulihkan).',
        'Tuan majlis boleh padam akaun bila-bila masa dari dashboard: semua majlis milik akaun tu dipadam terus serta-merta, dan email serta nama dibuang dari rekod kami.',
        'Tetamu boleh padam gambar dan ucapan sendiri dalam tempoh yang tuan majlis benarkan (biasanya 24 jam).',
        'Link log masuk tamat dalam 15 minit. Sesi log masuk tamat selepas 90 hari.',
        'Rekod bayaran disimpan selama yang diperlukan oleh undang-undang cukai dan perakaunan (biasanya 7 tahun), tanpa gambar atau data tetamu.',
      ] },
      { h: 'Hak korang', p: [
        'Korang boleh minta akses kepada data peribadi korang, minta salinannya dalam format yang biasa digunakan, minta ia dibetulkan, hadkan penggunaannya, tarik balik persetujuan, atau minta ia dipadam. Tuan majlis boleh buat kebanyakan ni sendiri dari dashboard. Tetamu yang nak gambar, ucapan atau RSVP diturunkan boleh minta tuan majlis, atau hubungi kami terus dengan link majlis dan butiran yang terlibat. Kami balas dalam 21 hari.',
      ] },
      { h: 'Keselamatan', p: [
        'Semua sambungan guna HTTPS. Fail asal dan fail tersembunyi disimpan dalam simpanan tertutup, bukan awam. Akses tuan majlis guna link sekali guna, bukan password yang boleh dicuri, dan token log masuk disimpan dalam bentuk yang tak boleh diguna semula kalau bocor. Tiada sistem yang 100% selamat, tapi kami ambil langkah yang munasabah untuk lindungi data korang. Kalau berlaku kebocoran data yang boleh menjejaskan korang, kami maklumkan korang dan Pesuruhjaya Perlindungan Data Peribadi seperti yang dikehendaki undang-undang.',
      ] },
      { h: 'Kanak-kanak', p: [
        'Majlis selalunya ada budak-budak dalam gambar. Tuan majlis bertanggungjawab siapa yang dapat link galeri, dan boleh sembunyi atau padam mana-mana gambar bila-bila masa.',
      ] },
      { h: 'Perubahan', p: ['Kalau kami ubah notis ni dengan ketara, kami kemas kini tarikh di atas dan maklumkan tuan majlis melalui email.'] },
      { h: 'Hubungi kami', p: [`${CONTACT_MS} Pertanyaan tentang data peribadi, termasuk kepada pegawai perlindungan data kami, boleh dihantar ke alamat yang sama. Jika ada percanggahan antara versi BM dan English, versi BM terpakai.`] },
    ],
    other: 'Read in English',
  },
  en: {
    title: 'Privacy Notice',
    updated: UPDATED_EN,
    intro: 'Indahnya (indahnya.my) is operated by FF Dev Studio, Malaysia — the data user under the Personal Data Protection Act 2010 (company details below). This notice explains what data we collect, why, who can see it, how long we keep it, and your rights.',
    sections: [
      { h: 'What we collect', ul: [
        'Hosts: email address (required, to sign in), name (if you sign in with Google), and the event details you enter — names, date, venue.',
        'The invitation (kad): whatever the host puts in it — the couple\'s and parents\' names, the programme, phone numbers to contact, photos, a song, and for salam kaut, a bank account number or DuitNow QR. All of it can be seen by anyone with the event link, so include only what you are happy to share.',
        'Guests — photos and videos: the files uploaded, a name the guest may choose to add, and reactions to photos.',
        'Guests — RSVP: name, attending or not, number of people, side, meal choice, a note, and a phone number (optional). Hosts can also enter replies they received by phone.',
        'Guests — wishes: written wishes, and voice wishes (a recording of the guest\'s voice, up to 60 seconds).',
        'Guests need no account or email. Everything a guest gives is optional — they can view the gallery and upload without giving anything.',
        'Payments: payment status and amount. Card, FPX and GrabPay details are handled by Stripe directly — we never see or store them.',
        'Technical: IP address (for security and rate limits), and the cookies the service needs to work — one keeps a host signed in, one recognises a guest\'s browser so "My photos", RSVP and deleting your own photo work. No advertising, analytics or third-party tracking cookies.',
      ] },
      { h: 'Information inside photos and videos', p: [
        'Photos and videos from phones usually carry metadata, sometimes including the GPS location where they were taken. The copies shown in the gallery, on the TV and in the invitation have all of that removed. Originals are stored privately, and only the host can download them (for example in the zip) — those originals keep their original metadata.',
      ] },
      { h: 'Why we use it', ul: [
        'To run your event\'s gallery, slideshow, invitation, RSVP, seating and wishes.',
        'To send sign-in links and important emails — for example warnings before photos are deleted.',
        'To process payments and keep transaction records.',
        'For security: to stop spam, abuse and repeated sign-in attempts.',
      ], p: ['We do not sell data, do not use event photos for advertising, and do not share them with anyone beyond the providers listed below.'] },
      { h: 'Who can see what', ul: [
        'Anyone with the event link can see the invitation, the gallery and the wishes on show. The link is not listed on Google or other search engines — but anyone who has it can open it, so share it with people you trust.',
        'Seat search: if the host turns it on, anyone with the link can type at least 3 letters of a name and see the matching guests\' names, party size and table number (at most 5 names per search). No other RSVP details are shown to guests.',
        'Photos and voice wishes the host hides, or that are awaiting approval, are moved out of public access. Old links to them stop working (a cached copy in a browser or network may last up to an hour).',
        'Hosts see every photo, RSVP (including phone numbers) and wish of their event, including guests\' names.',
        'Providers that help us run Indahnya: Cloudflare (photo storage and delivery), our server host, Stripe (payments), our email provider, and Google (if you choose Google sign-in). They process data only for those purposes.',
      ] },
      { h: 'Transfers outside Malaysia', p: [
        'Some of the providers above store or process data outside Malaysia — for example Cloudflare data centres in the Asia-Pacific region, and Stripe and Google in the United States and Europe. We only use providers bound by contracts and data protection policies at least equivalent to the protection under Malaysian law.',
      ] },
      { h: 'How long we keep it', ul: [
        'Photos, videos and wishes are kept according to the plan: Free for 30 days after the event, Indahnya for 1 year, Indahnya Lengkap for 2 years. We email the host 14 days before it ends, on the day it ends, and again at least 7 days before deletion.',
        'After storage ends there are at least 30 more days to download or extend. After that every photo, video and wish is permanently deleted, together with the guests\' data (RSVPs, phone numbers, seating) and the personal details in the invitation (parents\' names, phone numbers, bank account). Only the event\'s title and date remain in the host\'s list.',
        'If the host deletes the event, it disappears from the guests\' link at once, and everything in it is permanently deleted after 7 days (until then the host can restore it).',
        'A host can delete their account at any time from the dashboard: every event the account owns is deleted at once, and the email and name are removed from our records.',
        'Guests can delete their own photos and wishes within the window the host allows (24 hours by default).',
        'Sign-in links expire after 15 minutes. Sign-in sessions end after 90 days.',
        'Payment records are kept as long as tax and accounting law requires (usually 7 years), without photos or guest data.',
      ] },
      { h: 'Your rights', p: [
        'You may ask for access to your personal data, for a copy in a commonly used format, for it to be corrected, for its use to be limited, to withdraw consent, or for it to be deleted. Hosts can do most of this themselves from the dashboard. A guest who wants a photo, wish or RSVP taken down can ask the host, or contact us directly with the event link and the details. We reply within 21 days.',
      ] },
      { h: 'Security', p: [
        'Every connection uses HTTPS. Originals and hidden files live in private storage, not public. Hosts sign in with one-time links, not passwords that can be stolen, and sign-in tokens are stored in a form that cannot be reused if leaked. No system is 100% secure, but we take reasonable steps to protect your data. If a data breach could affect you, we will tell you and the Personal Data Protection Commissioner as the law requires.',
      ] },
      { h: 'Children', p: [
        'Events often have children in the photos. The host decides who gets the gallery link, and can hide or delete any photo at any time.',
      ] },
      { h: 'Changes', p: ['If we change this notice materially, we update the date above and let hosts know by email.'] },
      { h: 'Contact us', p: [`${CONTACT_EN} Questions about personal data, including to our data protection officer, can go to the same address. If the BM and English versions differ, the BM version prevails.`] },
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
      { h: 'Simpanan dan pemadaman', p: ['Download gambar korang sebelum tempoh simpanan tamat. Selepas tamat dan sekurang-kurangnya 30 hari tambahan, semua fail dipadam terus dan tak boleh dikembalikan. Kami email peringatan, tapi tanggungjawab untuk download adalah pada tuan majlis. Majlis yang korang padam sendiri boleh dipulihkan dalam 7 hari; lepas tu ia dipadam terus.'] },
      { h: 'Maklumat dalam kad', p: ['Tuan majlis bertanggungjawab atas maklumat yang diletak dalam kad jemputan, termasuk nombor telefon dan akaun bank orang lain — pastikan tuan punya maklumat tu setuju ia dikongsi dengan tetamu.'] },
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
      { h: 'Storage and deletion', p: ['Download your photos before storage ends. After it ends and at least 30 more days pass, every file is permanently deleted and cannot be recovered. We send reminders, but downloading is the host\'s responsibility. An event you delete yourself can be restored within 7 days; after that it is permanently deleted.'] },
      { h: 'Information in the invitation', p: ['The host is responsible for what goes into the invitation, including other people\'s phone numbers and bank accounts — make sure their owners agree to share them with guests.'] },
      { h: 'Availability', p: ['We work to keep Indahnya running, but venue wifi, mobile networks and third-party providers are outside our control. The service is provided "as is".'] },
      { h: 'Limit of liability', p: ['As far as the law allows, our liability for any claim about an event is limited to what you paid for that event. Nothing in these terms limits your rights as a consumer under the Consumer Protection Act 1999.'] },
      { h: 'Law', p: ['These terms are governed by the laws of Malaysia. If we change them, we update the date above; material changes are announced by email.'] },
      { h: 'Contact us', p: [`${CONTACT_EN} If the BM and English versions differ, the BM version prevails.`] },
    ],
    other: 'Baca dalam BM',
  },
};
