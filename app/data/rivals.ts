/**
 * Every fact about another product that a public page shows, in one place
 * (docs/seo/strike-plan.md §3.0 rule 3). Each vendor's cells come from its OWN
 * page (`url`), read on `checked`; a page prints "Disemak <tarikh>" beside
 * them and links the URL. Research: docs/seo/competitors.md §2.
 *
 * "tidak dinyatakan" / "not stated" means the vendor's page did not say;
 * it never means the feature is missing. USD stays in USD (no conversion).
 * Re-read a vendor's page on the day a page using it ships, and whenever a
 * price moves; `staleRivals()` names any vendor older than 30 days.
 */
export interface Rival {
  id: string;
  name: string;
  url: string;
  /** YYYY-MM-DD the vendor's page was read. */
  checked: string;
  origin: 'MY' | 'global';
  currency: 'MYR' | 'USD';
  free: string;
  paid: string;
  retention: string;
  cap: string;
  ekad: string;
  rsvp: string;
  voice: string;
  tv: string;
  languages: string;
  /** Where this vendor is the better buy, in one honest line (BM, EN). */
  wins: { ms: string; en: string };
  /** Longer facts a dedicated comparison page needs, each from `url` on `checked`. */
  facts?: { ms: string; en: string }[];
}

const NS = 'tidak dinyatakan';

export const RIVALS: Rival[] = [
  {
    id: 'kenangan', name: 'Kenangan', url: 'https://kenanganmajlis.com/harga', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: 'tiada', paid: 'RM35 galeri; +RM10 video; +RM30 e-kad dan RSVP; +RM5 sebulan tambahan', retention: '2 bulan aktif', cap: 'tanpa had (guna berpatutan)',
    ekad: '+RM30', rsvp: '+RM30', voice: 'tiada (jadual Kenangan sendiri)', tv: 'ya', languages: 'BM, EN',
    wins: { ms: 'Galeri sahaja pada RM35 kalau tak perlu kad atau RSVP, dan lebih banyak panduan.', en: 'A RM35 gallery on its own if you need no kad or RSVP, and more guides.' },
  },
  {
    id: 'kenang', name: 'Kenang', url: 'https://kenang.my/', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: 'tiada', paid: 'RM99 (harga asal RM149); RM148 untuk dua majlis', retention: '3 bulan selepas majlis', cap: '20 snap setiap tetamu',
    ekad: NS, rsvp: NS, voice: 'ya (30 saat)', tv: NS, languages: 'BM, EN',
    wins: { ms: 'Pakej dua majlis dalam satu harga, dan gaya kamera filem.', en: 'A two-majlis price, and a film-camera style.' },
  },
  {
    id: 'momenspace', name: 'momenspace', url: 'https://momenspace.my/pricing', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: '50 gambar, upload 1 hari, galeri 7 hari', paid: 'RM39 (150 fail, 14 hari); RM99 (tanpa had, 30 hari)', retention: '7 hingga 30 hari', cap: '50 / 150 / tanpa had',
    ekad: NS, rsvp: NS, voice: NS, tv: 'Live Wall semua pakej', languages: 'BM, EN',
    wins: { ms: 'Pakej berbayar lebih murah (RM39) untuk majlis kecil.', en: 'A cheaper paid tier (RM39) for a small event.' },
  },
  {
    id: 'povkita', name: 'povkita', url: 'https://www.povkita.com/', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: 'tiada', paid: 'RM15 promo (biasa RM20): 30 gambar; RM25 promo (biasa RM40): 500 gambar dan video', retention: '1 bulan / 6 bulan', cap: '30 / 500',
    ekad: NS, rsvp: NS, voice: NS, tv: NS, languages: 'BM, EN',
    wins: { ms: 'Harga paling rendah yang kami jumpa, untuk majlis kecil.', en: 'The lowest price we found, for a small event.' },
  },
  {
    id: 'gathrly', name: 'Gathrly', url: 'https://gathrly.my/pricing', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: '100 gambar, 7 hari', paid: 'RM49 (1,000, 30 hari); RM149 (5,000, 60 hari); RM299 (10,000, 60 hari)', retention: '7 hingga 60 hari', cap: '100 hingga 10,000',
    ekad: NS, rsvp: NS, voice: NS, tv: 'Live Wall', languages: 'BM, EN',
    wins: { ms: 'Ada app iOS, dan pakej RM49.', en: 'An iOS app, and a RM49 tier.' },
  },
  {
    id: 'jomgambar', name: 'JomGambar', url: 'https://www.jomgambar.my/', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: '20 gambar, 7 hari (cubaan)', paid: 'RM49 (1,000, 60 hari); RM99 (4,000, 90 hari)', retention: '7 hingga 90 hari', cap: '20 hingga 4,000',
    ekad: NS, rsvp: NS, voice: NS, tv: 'tayangan live', languages: 'BM',
    wins: { ms: 'Pakej RM49, dan photobook PDF.', en: 'A RM49 tier, and a photobook PDF.' },
  },
  {
    id: 'neekahkita', name: 'Neekah Kita', url: 'https://neekahkita.com/guest-gallery', checked: '2026-11-12', origin: 'MY', currency: 'MYR',
    free: '50 gambar, 7 hari', paid: 'Galeri RM99 (500 gambar, video, 90 hari); e-kad RM29 / RM49', retention: '7 hingga 90 hari', cap: '50 / 500',
    ekad: 'ya (RM29, RM49)', rsvp: 'ya', voice: NS, tv: 'Live Wall', languages: 'BM, EN',
    wins: { ms: 'E-kad sahaja lebih murah (RM29), dan kad bercetak.', en: 'A cheaper e-kad on its own (RM29), and printed cards.' },
  },
  {
    id: 'wedibox', name: 'Wedibox', url: 'https://www.wedibox.com/pricing', checked: '2026-11-12', origin: 'global', currency: 'USD',
    free: '$0: 50 upload', paid: '$29 (embed); $49; $79 (USD)', retention: '$49: upload 6 bulan, simpan 1 tahun. $79: upload 1 tahun, simpan 2 tahun', cap: 'tanpa had',
    ekad: 'laman web perkahwinan, bukan e-kad Melayu', rsvp: '$79', voice: 'ya', tv: 'ya', languages: 'EN, FR',
    wins: { ms: 'Lebih matang dan lebih banyak alat, untuk majlis di luar Malaysia.', en: 'More mature, with more tools, for a wedding outside Malaysia.' },
    facts: [
      { ms: 'Harga dalam USD sahaja. Pilihan mata wang di laman harga tak termasuk Ringgit (MYR).', en: 'Priced in USD only. The currency switcher on the pricing page has no Ringgit (MYR).' },
      { ms: 'Pakej Free: 50 upload dan kod QR.', en: 'Free plan: 50 uploads and a QR code.' },
      { ms: 'Pakej Wedding, $49 sekali bayar: upload tanpa had, laman web perkahwinan, buku tetamu audio, slideshow live, upload 6 bulan, simpan setahun.', en: 'Wedding plan, $49 one time: unlimited uploads, a wedding website, audio guestbook, live slideshow, 6-month upload window, 1 year of storage.' },
      { ms: 'Pakej All-In-One, $79 sekali bayar: tambah RSVP dengan pilihan makanan, carta tempat duduk dan pautan hadiah; upload setahun, simpan dua tahun.', en: 'All-In-One plan, $79 one time: adds RSVP with meal choices, a seating chart and registry links; 1-year upload window, 2 years of storage.' },
      { ms: 'Bahasa: Inggeris dan Perancis.', en: 'Languages: English and French.' },
    ],
  },
];

export const rival = (id: string) => RIVALS.find(r => r.id === id)!;

/** Vendors whose facts are older than `days` (default 30): re-read them or take the cells down. */
export function staleRivals(now = new Date(), days = 30) {
  return RIVALS.filter(r => now.getTime() - new Date(`${r.checked}T00:00:00+08:00`).getTime() > days * 86_400_000).map(r => r.id);
}

/** "12 November 2026" for a YYYY-MM-DD, in BM or English month names. */
export function longDate(iso: string, lang: 'ms' | 'en') {
  const [y, m, d] = iso.split('-').map(Number);
  const ms = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${(lang === 'en' ? en : ms)[m! - 1]} ${y}`;
}
