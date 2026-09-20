/**
 * Two languages, one file. BM is colloquial Malaysian — the words people use
 * at a majlis, with the English trade words left in English (download,
 * upload, link, QR, slideshow). Not bahasa baku, not Indonesian.
 */
const dict = {
  ms: {
    'gallery.title': 'Gambar majlis',
    'gallery.upload': 'Upload gambar',
    'gallery.upload.sub': 'Pilih dari galeri phone atau snap terus',
    'gallery.uploading': 'Tengah upload…',
    'gallery.processing': 'Tengah proses…',
    'gallery.empty': 'Belum ada gambar lagi',
    'gallery.empty.sub': 'Jadi orang pertama — upload gambar korang!',
    'gallery.mine': 'Gambar saya',
    'gallery.all': 'Semua',
    'gallery.closed': 'Tempoh upload dah tamat',
    'gallery.closed.sub': 'Gambar masih boleh ditengok dan didownload.',
    'gallery.full': 'Galeri ni dah penuh',
    'gallery.by': 'oleh',
    'gallery.anon': 'Tetamu',
    'gallery.delete': 'Padam gambar saya',
    'gallery.delete.confirm': 'Padam gambar ni? Tak boleh undo.',
    'gallery.download': 'Download',
    'gallery.more': 'Tunjuk lagi',
    'gallery.name.title': 'Nama korang?',
    'gallery.name.sub': 'Supaya pengantin tahu siapa yang snap. Boleh skip.',
    'gallery.name.placeholder': 'cth. Aina, Makcik Ros, Team Office',
    'gallery.name.skip': 'Skip',
    'gallery.name.save': 'Simpan',
    'gallery.done': 'Siap! {n} gambar dah masuk galeri',
    'gallery.failed': '{n} gambar tak jadi',
    'gallery.limit.video': 'Video max 60 saat, 100 MB',
    'tabs.kad': 'Kad',
    'tabs.gambar': 'Gambar',
    'tabs.ucapan': 'Ucapan',
    'tabs.rsvp': 'RSVP',
    'tabs.tempat': 'Tempat duduk',
    'hub.soon': 'Akan datang',
    'badge': 'Dibuat dengan Indahnya',
    'react.love': 'Sayang',
    'react.party': 'Meriah',
    'react.cry': 'Terharu',
    'video': 'Video',
  },
  en: {
    'gallery.title': 'Event photos',
    'gallery.upload': 'Upload photos',
    'gallery.upload.sub': 'Pick from your camera roll or snap one now',
    'gallery.uploading': 'Uploading…',
    'gallery.processing': 'Processing…',
    'gallery.empty': 'No photos yet',
    'gallery.empty.sub': 'Be the first — upload yours!',
    'gallery.mine': 'My photos',
    'gallery.all': 'All',
    'gallery.closed': 'Uploads have closed',
    'gallery.closed.sub': 'Photos can still be viewed and downloaded.',
    'gallery.full': 'This gallery is full',
    'gallery.by': 'by',
    'gallery.anon': 'Guest',
    'gallery.delete': 'Delete my photo',
    'gallery.delete.confirm': 'Delete this photo? This cannot be undone.',
    'gallery.download': 'Download',
    'gallery.more': 'Show more',
    'gallery.name.title': 'Your name?',
    'gallery.name.sub': 'So the couple knows who took it. You can skip this.',
    'gallery.name.placeholder': 'e.g. Aina, Aunty Ros, Team Office',
    'gallery.name.skip': 'Skip',
    'gallery.name.save': 'Save',
    'gallery.done': 'Done! {n} photos are in the gallery',
    'gallery.failed': '{n} photos failed',
    'gallery.limit.video': 'Videos up to 60 s, 100 MB',
    'tabs.kad': 'Card',
    'tabs.gambar': 'Photos',
    'tabs.ucapan': 'Wishes',
    'tabs.rsvp': 'RSVP',
    'tabs.tempat': 'Seating',
    'hub.soon': 'Coming soon',
    'badge': 'Made with Indahnya',
    'react.love': 'Love',
    'react.party': 'Party',
    'react.cry': 'Touched',
    'video': 'Video',
  },
} as const;

export type Locale = keyof typeof dict;
type Key = keyof typeof dict.ms;

export function useT(locale: () => Locale) {
  return (k: Key, vars?: Record<string, string | number>) => {
    let s: string = dict[locale()][k] ?? dict.ms[k] ?? k;
    for (const [n, v] of Object.entries(vars ?? {})) s = s.replace(`{${n}}`, String(v));
    return s;
  };
}
