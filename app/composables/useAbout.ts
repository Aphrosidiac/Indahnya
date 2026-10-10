/**
 * About (/tentang): who and what Indahnya is, in facts a reader or an answer
 * engine can check against the rest of the site. Every line is true today and
 * matches the landing, the pricing and the privacy notice (docs/geo/facts.md);
 * change them together. Founder name and SSM number are the owner's call
 * (docs/geo/owner-todo.md). No em dashes (landing copy rule).
 */
export interface AboutCopy {
  eyebrow: string; title: string; seoTitle: string; updated: string; intro: string;
  factsTitle: string; facts: [string, string][];
  why: { h: string; lead: string; p: string };
  how: { h: string; steps: { t: string; b: string }[] };
  privacy: { h: string; items: string[]; more: string };
  who: { h: string; p: string; wa: string; email: string };
}

export const ABOUT: Record<'ms' | 'en', AboutCopy> = {
  ms: {
    eyebrow: 'Tentang kami',
    title: 'Tentang Indahnya',
    seoTitle: 'Tentang Indahnya: galeri gambar majlis dengan QR',
    updated: 'Dikemas kini 4 Oktober 2026',
    intro: 'Indahnya ialah galeri gambar majlis dengan QR untuk Malaysia. Tetamu scan QR atas meja, upload gambar terus dari browser phone tanpa app atau login, dan semua gambar masuk satu galeri yang boleh naik atas TV dewan. Indahnya juga ada e-kad jemputan, RSVP, carian nombor meja dan ucapan. Dibina oleh FF Dev Studio, Malaysia.',
    factsTitle: 'Fakta ringkas',
    facts: [
      ['Nama', 'Indahnya'],
      ['Laman', 'indahnya.my'],
      ['Apa', 'Galeri gambar majlis dengan QR, e-kad jemputan, RSVP, carian tempat duduk, dan ucapan bertulis atau suara'],
      ['Untuk', 'Majlis kahwin, aqiqah, hari jadi, graduasi, majlis syarikat dan majlis lain di Malaysia'],
      ['Bahasa', 'Bahasa Melayu dan English'],
      ['Harga', 'Percuma, RM0 (50 upload, simpan 30 hari selepas majlis); RM59 sekali bayar (upload tanpa had, simpan setahun); RM99 sekali bayar (upload tanpa had, simpan dua tahun)'],
      ['Bayaran', 'Melalui CHIP: FPX, kad atau e-wallet, dalam Ringgit'],
      ['Dibina oleh', 'FF Dev Studio, Malaysia'],
      ['Hubungi', 'hello@ffdev.studio · WhatsApp +60\u00a013\u2011907\u00a08719'],
    ],
    why: {
      h: 'Kenapa Indahnya wujud',
      lead: 'Gambar paling jujur dari majlis korang ada dalam phone tetamu.',
      p: 'Lepas majlis, gambar tetamu biasanya tersebar dalam berpuluh chat WhatsApp, selalunya dimampatkan, dan banyak yang tak pernah sampai ke tuan majlis. Indahnya kumpul semuanya dalam satu galeri, dengan nama siapa yang snap, dan tuan majlis boleh download semua sekali gus.',
    },
    how: {
      h: 'Macam mana Indahnya berfungsi',
      steps: [
        { t: 'Print QR', b: 'Tuan majlis buat majlis dan print QR: poster A5, A4 atau kad meja yang dilipat.' },
        { t: 'Tetamu scan', b: 'Scan dengan kamera phone. Galeri terus buka dalam browser. Tak payah download app, tak payah buat akaun.' },
        { t: 'Upload', b: 'Pilih sampai 30 gambar sekali gus, atau snap terus. Video sampai 60 saat setiap satu.' },
        { t: 'Naik TV', b: 'Gambar masuk galeri dalam beberapa saat, dan boleh dipaparkan atas TV atau skrin dewan sebagai slideshow.' },
      ],
    },
    privacy: {
      h: 'Privasi tetamu',
      items: [
        'Laman majlis setiap pasangan tak diindeks oleh enjin carian.',
        'Metadata gambar (EXIF, termasuk lokasi GPS) dibuang dari salinan yang dipaparkan.',
        'Tuan majlis boleh sembunyi gambar, atau on approval mode supaya gambar hanya naik selepas disemak.',
      ],
      more: 'Baca Notis Privasi (Akta Perlindungan Data Peribadi 2010)',
    },
    who: {
      h: 'Siapa di belakang Indahnya',
      p: 'Indahnya dibina dan dijalankan oleh FF Dev Studio, studio kecil di Malaysia. Kalau ada masalah, WhatsApp kami. Orang yang bina Indahnya yang jawab.',
      wa: 'WhatsApp kami', email: 'hello@ffdev.studio',
    },
  },
  en: {
    eyebrow: 'About us',
    title: 'About Indahnya',
    seoTitle: 'About Indahnya: QR photo gallery for Malaysian events',
    updated: 'Updated 4 October 2026',
    intro: 'Indahnya is a QR photo gallery for Malaysian events. Guests scan a QR code on the table, upload photos straight from their phone browser with no app or sign-up, and every photo lands in one gallery that can play on the venue screen. Indahnya also has e-invitation cards, RSVP, table finder and guest wishes. Built by FF Dev Studio, Malaysia.',
    factsTitle: 'Quick facts',
    facts: [
      ['Name', 'Indahnya'],
      ['Website', 'indahnya.my'],
      ['What', 'QR photo gallery for events, e-invitation card, RSVP, seating finder, and written or voice wishes'],
      ['For', 'Weddings, aqiqah, birthdays, graduations, company events and other events in Malaysia'],
      ['Languages', 'Bahasa Melayu and English'],
      ['Pricing', 'Free, RM0 (50 uploads, kept 30 days after the event); RM59 one-time (unlimited uploads, kept one year); RM99 one-time (unlimited uploads, kept two years)'],
      ['Payment', 'Through CHIP: FPX, card or e-wallet, in Ringgit'],
      ['Built by', 'FF Dev Studio, Malaysia'],
      ['Contact', 'hello@ffdev.studio · WhatsApp +60\u00a013\u2011907\u00a08719'],
    ],
    why: {
      h: 'Why Indahnya exists',
      lead: 'The most honest photos of your day are on your guests\' phones.',
      p: 'After an event, guests\' photos usually end up scattered across dozens of WhatsApp chats, often compressed, and many never reach the hosts. Indahnya gathers them in one gallery, with the name of whoever took each one, and the hosts can download everything at once.',
    },
    how: {
      h: 'How Indahnya works',
      steps: [
        { t: 'Print the QR', b: 'The hosts create the event and print the QR: an A5 or A4 poster, or a folded table card.' },
        { t: 'Guests scan', b: 'With the phone camera. The gallery opens in the browser. No app to download, no account to make.' },
        { t: 'Upload', b: 'Up to 30 photos at a time, or snap one there and then. Videos up to 60 seconds each.' },
        { t: 'On the screen', b: 'Photos reach the gallery within seconds and can play on the venue TV or screen as a slideshow.' },
      ],
    },
    privacy: {
      h: 'Guest privacy',
      items: [
        'Each couple\'s event pages are not indexed by search engines.',
        'Photo metadata (EXIF, including GPS location) is removed from the copies shown.',
        'Hosts can hide photos, or turn on approval mode so photos appear only after review.',
      ],
      more: 'Read the Privacy Notice (Personal Data Protection Act 2010)',
    },
    who: {
      h: 'Who is behind Indahnya',
      p: 'Indahnya is built and run by FF Dev Studio, a small studio in Malaysia. If something goes wrong, WhatsApp us. The people who built Indahnya are the ones who answer.',
      wa: 'WhatsApp us', email: 'hello@ffdev.studio',
    },
  },
};
