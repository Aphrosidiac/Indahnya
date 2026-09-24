/**
 * The five e-kad templates. One page structure — the genre's: a cover you
 * tap open, the invitation, the day, the aturcara, the photos, the doa,
 * the gift, and a bottom bar for Hubungi · Lokasi · Muzik · Hadiah ·
 * Gambar — dressed five ways. Every colour is used on its own ground at a
 * contrast that reads on a phone in a bright dewan (ink ≥ 7:1, muted ≥ 4.5:1).
 *
 * The same record drives the page (CSS variables) and the WhatsApp preview
 * image (server/utils/kad-og.ts), so the two always match.
 */
export const KAD_TEMPLATES = ['garden', 'klasik', 'moden', 'emas', 'minimal'] as const;
export type KadTemplate = typeof KAD_TEMPLATES[number];

export interface KadTheme {
  label: string;
  blurb: string;
  /** page ground, a second ground for bands, text, muted text, accent (rules, icons), accent's text */
  bg: string; band: string; ink: string; muted: string; accent: string; onAccent: string;
  /** CSS font stacks: names (the display face), headings, body */
  names: string; heading: string; body: string;
  /** names in CAPS (Cinzel) or as written (script/serif) */
  namesCaps: boolean;
  /** OG renderer font files (server/assets/fonts) */
  og: { names: string; text: string; textBold: string };
  ornament: 'sprig' | 'filigree' | 'none' | 'deco' | 'rule';
}

export const KAD_THEMES: Record<KadTemplate, KadTheme> = {
  garden: {
    label: 'Garden', blurb: 'Hijau sage, daun, tulisan tangan',
    bg: '#f5f2ea', band: '#e9eee2', ink: '#26332a', muted: '#5b6b5e', accent: '#506c45', onAccent: '#ffffff',
    names: '"Great Vibes", cursive', heading: '"Cormorant Garamond", Georgia, serif', body: '"Cormorant Garamond", Georgia, serif',
    namesCaps: false,
    og: { names: 'great-vibes-latin-400-normal.woff', text: 'cormorant-garamond-latin-500-normal.woff', textBold: 'cormorant-garamond-latin-600-normal.woff' },
    ornament: 'sprig',
  },
  klasik: {
    label: 'Klasik', blurb: 'Krim dan maroon, bingkai klasik',
    bg: '#fbf6ee', band: '#f3e7dc', ink: '#3b1e22', muted: '#6e4a4f', accent: '#842f3d', onAccent: '#ffffff',
    names: '"Playfair Display", Georgia, serif', heading: '"Playfair Display", Georgia, serif', body: '"Cormorant Garamond", Georgia, serif',
    namesCaps: false,
    og: { names: 'playfair-display-latin-400-italic.woff', text: 'cormorant-garamond-latin-500-normal.woff', textBold: 'playfair-display-latin-500-normal.woff' },
    ornament: 'filigree',
  },
  moden: {
    label: 'Moden', blurb: 'Hitam putih, gambar besar, tulisan tegas',
    bg: '#ffffff', band: '#f2f2f0', ink: '#141414', muted: '#5a5a5a', accent: '#141414', onAccent: '#ffffff',
    names: 'Inter, "Helvetica Neue", Arial, sans-serif', heading: 'Inter, "Helvetica Neue", Arial, sans-serif', body: 'Inter, "Helvetica Neue", Arial, sans-serif',
    namesCaps: false,
    og: { names: 'inter-latin-700-normal.woff', text: 'inter-latin-500-normal.woff', textBold: 'inter-latin-700-normal.woff' },
    ornament: 'none',
  },
  emas: {
    label: 'Emas', blurb: 'Biru malam dan emas, art deco',
    bg: '#101b2c', band: '#16243a', ink: '#f4ecdc', muted: '#c9bfa9', accent: '#d2ae62', onAccent: '#101b2c',
    names: 'Cinzel, "Times New Roman", serif', heading: 'Cinzel, "Times New Roman", serif', body: '"Cormorant Garamond", Georgia, serif',
    namesCaps: true,
    og: { names: 'cinzel-latin-500-normal.woff', text: 'cormorant-garamond-latin-500-normal.woff', textBold: 'cinzel-latin-700-normal.woff' },
    ornament: 'deco',
  },
  minimal: {
    label: 'Minimal', blurb: 'Putih tulang, ruang lapang, garis halus',
    bg: '#fafaf7', band: '#f1f0ec', ink: '#1f1f1f', muted: '#5f5f5f', accent: '#1f1f1f', onAccent: '#ffffff',
    names: '"Cormorant Garamond", Georgia, serif', heading: 'Inter, "Helvetica Neue", Arial, sans-serif', body: '"Cormorant Garamond", Georgia, serif',
    namesCaps: false,
    og: { names: 'cormorant-garamond-latin-500-normal.woff', text: 'inter-latin-500-normal.woff', textBold: 'inter-latin-500-normal.woff' },
    ornament: 'rule',
  },
};

export const isKadTemplate = (v: unknown): v is KadTemplate => typeof v === 'string' && (KAD_TEMPLATES as readonly string[]).includes(v);

/** `012-345 6789` / `+6012…` / `6012…` → `60123456789` for wa.me and tel:. */
export function msisdn(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('60')) return d;
  if (d.startsWith('0')) return `6${d}`;
  return d;
}

/**
 * `14:00` → `2.00 petang` (BM, the way a kad writes it) or `2:00 PM`.
 * pagi until 11:59, tengah hari 12–13:59, petang 14–18:59, malam after.
 */
export function kadTime(hhmm: string, lang: 'ms' | 'en' = 'ms') {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return '';
  const h = Number(m[1]), min = m[2]!;
  const h12 = h % 12 || 12;
  if (lang === 'en') return `${h12}:${min} ${h < 12 ? 'AM' : 'PM'}`;
  const part = h < 12 ? 'pagi' : h < 14 ? 'tengah hari' : h < 19 ? 'petang' : 'malam';
  return `${h12}.${min} ${part}`;
}

/** The majlis day in Malaysia's calendar, e.g. "Sabtu, 14 November 2026". */
export function kadDate(d: string | Date, lang: 'ms' | 'en' = 'ms', opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Date(d).toLocaleDateString(lang === 'en' ? 'en-MY' : 'ms-MY', { timeZone: 'Asia/Kuala_Lumpur', ...opts });
}
