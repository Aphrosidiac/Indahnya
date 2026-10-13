import type { LandingLang } from './useLanding';

/**
 * Copy for /harga, BM and EN. The plan cards themselves come from the
 * landing's copy (LANDING.pricing) so both places always show the same
 * three plans; this file holds what only the pricing page says: the full
 * comparison, how paying works, and the money questions. Every number here
 * is in server/utils/plans.ts and retention.ts.
 *
 * A row's `v` is the three plans' cells in order (Percuma, RM59, RM99):
 * a string is shown as is, true is a tick, false is a dash.
 */
export type PricingRow = { label: string; hint?: string; v: [string | boolean, string | boolean, string | boolean] };

export const PRICING = {
  ms: {
    seoTitle: 'Harga Indahnya: RM0, RM59 atau RM99 sekali bayar',
    seoDesc: 'Harga galeri gambar majlis Indahnya. Percuma untuk 50 upload, RM59 atau RM99 sekali bayar untuk upload tanpa had. Tak ada subscription, tak ada caj per tetamu.',
    eyebrow: 'Harga',
    compare: {
      title: 'Banding semua pakej.',
      body: 'Semua ciri ada dalam setiap pakej. Yang berubah cuma berapa banyak gambar, berapa lama upload dibuka dan berapa lama gambar disimpan.',
      plans: ['Percuma', 'RM59', 'RM99'],
      groups: [
        {
          title: 'Gambar',
          rows: [
            { label: 'Upload', v: ['50', 'Tanpa had', 'Tanpa had'] },
            { label: 'Upload dibuka', hint: 'Kiraan bermula dari hari majlis', v: ['30 hari', '6 bulan', '12 bulan'] },
            { label: 'Gambar disimpan', hint: 'Kiraan bermula dari hari majlis', v: ['30 hari', '1 tahun', '2 tahun'] },
            { label: 'Video sampai 60 saat', v: [true, true, true] },
            { label: 'Download semua, kualiti asal', v: [true, true, true] },
            { label: 'On approval mode', v: [true, true, true] },
          ],
        },
        {
          title: 'Majlis',
          rows: [
            { label: 'Slideshow untuk TV dewan', v: [true, true, true] },
            { label: 'QR siap print', v: [true, true, true] },
            { label: 'E-kad jemputan, lima template', v: [true, true, true] },
            { label: 'RSVP dan carian nombor meja', v: [true, true, true] },
            { label: 'Ucapan tulis atau suara', v: [true, true, true] },
          ],
        },
        {
          title: 'Link dan kad',
          rows: [
            { label: 'Link sendiri', hint: 'indahnya.my/nama-korang', v: [false, true, true] },
            { label: 'Tanpa badge Indahnya pada kad', v: [false, false, true] },
          ],
        },
      ] as { title: string; rows: PricingRow[] }[],
    },
    how: {
      title: 'Macam mana bayaran jalan.',
      items: [
        { title: 'Bayar sekali je', body: 'Satu bayaran untuk satu majlis. Tak ada subscription, tak ada caj per tetamu, tak ada caj tersembunyi.' },
        { title: 'Upgrade bila-bila', body: 'Mula percuma, upgrade bila gambar dah banyak, sebelum atau masa majlis. Dari RM59 ke RM99, bayar beza RM40 je.' },
        { title: 'Nak simpan lebih lama', body: 'Kami email sebelum tempoh simpan tamat. Bayar sekali lagi untuk sambung, atau download semua dulu. Lepas tamat, galeri masih ada sebulan sebelum dipadam.' },
        { title: 'Jaminan hari majlis', body: 'Kalau galeri tak jalan pada hari majlis sebab masalah di pihak kami, hubungi kami dalam 14 hari selepas majlis untuk bayaran balik penuh.' },
      ],
      terms: 'Baca Terma Perkhidmatan',
    },
    faq: {
      title: 'Soalan pasal bayaran.',
      items: [
        { q: 'Kena bayar sebelum majlis ke?', a: 'Tak. Buat majlis percuma, print QR, guna terus. Upgrade bila-bila, termasuk masa majlis tengah jalan kalau 50 upload dah nak penuh.' },
        { q: 'Apa jadi bila 50 upload percuma dah penuh?', a: 'Upload baru berhenti sampai korang upgrade. Gambar yang dah masuk kekal dalam galeri. Lepas upgrade, tetamu terus boleh upload balik, tak payah print QR baru.' },
        { q: 'Boleh bayar guna apa?', a: 'Melalui CHIP: FPX online banking, kad debit atau kredit, dan e-wallet. Harga dalam Ringgit, resit dihantar ke email.' },
        { q: 'Kiraan 6 bulan atau setahun tu bermula bila?', a: 'Dari hari majlis, bukan hari korang buat akaun atau bayar. Buat awal pun tak rugi apa-apa.' },
        { q: 'Apa jadi bila tempoh simpan tamat?', a: 'Kami email dulu sebelum tamat. Korang boleh download semua gambar dalam satu zip, atau bayar sekali lagi untuk sambung. Lepas tamat, galeri masih ada 30 hari sebelum dipadam terus.' },
        { q: 'Ada caj per tetamu atau caj tersembunyi?', a: 'Tak ada. Berapa ramai tetamu pun, harga sama. Yang korang nampak kat page ni je yang korang bayar.' },
      ],
    },
  },
  en: {
    seoTitle: 'Indahnya pricing: RM0, RM59 or RM99, paid once',
    seoDesc: 'Indahnya event photo gallery pricing. Free for 50 uploads, RM59 or RM99 paid once for unlimited uploads. No subscription, no per-guest fees.',
    eyebrow: 'Pricing',
    compare: {
      title: 'Compare every plan.',
      body: 'Every feature is in every plan. What changes is how many photos, how long uploads stay open and how long the photos are kept.',
      plans: ['Free', 'RM59', 'RM99'],
      groups: [
        {
          title: 'Photos',
          rows: [
            { label: 'Uploads', v: ['50', 'Unlimited', 'Unlimited'] },
            { label: 'Uploads open for', hint: 'Counted from the day of the event', v: ['30 days', '6 months', '12 months'] },
            { label: 'Photos kept for', hint: 'Counted from the day of the event', v: ['30 days', '1 year', '2 years'] },
            { label: 'Videos up to 60 seconds', v: [true, true, true] },
            { label: 'Download all, original quality', v: [true, true, true] },
            { label: 'Approval mode', v: [true, true, true] },
          ],
        },
        {
          title: 'The event',
          rows: [
            { label: 'Slideshow for the venue screen', v: [true, true, true] },
            { label: 'Print-ready QR', v: [true, true, true] },
            { label: 'E-invitation, five templates', v: [true, true, true] },
            { label: 'RSVP and table finder', v: [true, true, true] },
            { label: 'Written or voice wishes', v: [true, true, true] },
          ],
        },
        {
          title: 'Link and card',
          rows: [
            { label: 'Your own link', hint: 'indahnya.my/your-names', v: [false, true, true] },
            { label: 'No Indahnya badge on the card', v: [false, false, true] },
          ],
        },
      ] as { title: string; rows: PricingRow[] }[],
    },
    how: {
      title: 'How paying works.',
      items: [
        { title: 'Pay once', body: 'One payment for one event. No subscription, no per-guest fee, nothing hidden.' },
        { title: 'Upgrade any time', body: 'Start free and upgrade when the photos pile up, before or during the event. From RM59 to RM99 you only pay the RM40 difference.' },
        { title: 'Keep it longer', body: 'We email before your storage ends. Pay again to extend, or download everything first. After it ends the gallery stays for a month before it is deleted.' },
        { title: 'The event-day promise', body: 'If the gallery fails on the day of your event because of a problem on our side, contact us within 14 days of the event for a full refund.' },
      ],
      terms: 'Read the Terms of Service',
    },
    faq: {
      title: 'Questions about paying.',
      items: [
        { q: 'Do I have to pay before the event?', a: 'No. Create the event for free, print the QR and use it. Upgrade any time, even in the middle of the event if the 50 free uploads are nearly used.' },
        { q: 'What happens when the 50 free uploads are used?', a: 'New uploads pause until you upgrade. Photos already in stay in the gallery. Once you upgrade, guests can upload again straight away with the same QR.' },
        { q: 'How can I pay?', a: 'Through CHIP: FPX online banking, debit or credit card, and e-wallets. Prices are in Ringgit and the receipt goes to your email.' },
        { q: 'When do the 6 months or one year start?', a: 'From the day of the event, not the day you sign up or pay. Setting up early costs you nothing.' },
        { q: 'What happens when storage ends?', a: 'We email you before it ends. You can download every photo in one zip, or pay again to extend. After it ends the gallery stays for 30 days before it is deleted for good.' },
        { q: 'Any per-guest or hidden fees?', a: 'None. However many guests come, the price is the same. What you see on this page is all you pay.' },
      ],
    },
  },
} satisfies Record<LandingLang, unknown>;

export type PricingCopy = typeof PRICING['ms'];
