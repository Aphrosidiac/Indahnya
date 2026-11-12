/**
 * The public, indexable pages: one list for the sitemap, the redirects
 * (server/middleware/00.seo-redirects.ts), hreflang and the language switch.
 *
 * BM lives at the root, English under /en (docs/seo/strike-plan.md, decided
 * 12 Nov 2026). A page with a twin in the other language is a "mirror" and
 * carries reciprocal hreflang; a page in one language only carries none.
 * `mod` is the date the page's visible "Dikemas kini" line carries, never the
 * build time; the sitemap prints it as lastmod.
 */
export type Lang = 'ms' | 'en';

/** BM path → its English twin. */
export const MIRRORS: Record<string, string> = {
  '/': '/en',
  '/harga': '/en/pricing',
  '/tentang': '/en/about',
  '/privasi': '/en/privacy',
  '/terma': '/en/terms',
  '/bayaran-balik': '/en/refunds',
  '/penghantaran': '/en/delivery',
};
const EN_TO_BM: Record<string, string> = Object.fromEntries(Object.entries(MIRRORS).map(([bm, en]) => [en, bm]));

export const langOfPath = (path: string): Lang => (path === '/en' || path.startsWith('/en/') ? 'en' : 'ms');

/** The same page in `lang`, or null when it has no twin. */
export function pathIn(path: string, lang: Lang): string | null {
  if (langOfPath(path) === lang) return path;
  return (lang === 'en' ? MIRRORS[path] : EN_TO_BM[path]) ?? null;
}

/** For a link: the page in `lang` when it has a twin, else the page itself. */
export const linkIn = (path: string, lang: Lang) => pathIn(path, lang) ?? path;

export interface SitePage { path: string; mod?: string }

/** Every indexable page, both languages. Add a page here when it ships. */
export const SITE_PAGES: SitePage[] = [
  { path: '/', mod: '2026-11-12' },
  { path: '/en', mod: '2026-11-12' },
  { path: '/harga', mod: '2026-11-12' },
  { path: '/en/pricing', mod: '2026-11-12' },
  { path: '/tentang', mod: '2026-11-12' },
  { path: '/en/about', mod: '2026-11-12' },
  { path: '/privasi', mod: '2026-11-12' },
  { path: '/en/privacy', mod: '2026-11-12' },
  { path: '/terma', mod: '2026-10-05' },
  { path: '/en/terms', mod: '2026-10-05' },
  { path: '/bayaran-balik', mod: '2026-10-14' },
  { path: '/en/refunds', mod: '2026-10-14' },
  { path: '/penghantaran', mod: '2026-10-14' },
  { path: '/en/delivery', mod: '2026-10-14' },
  // BM only (docs/seo/strike-plan.md §3.2)
  { path: '/e-kad', mod: '2026-11-12' },
  { path: '/contoh', mod: '2026-11-12' },
  { path: '/buku-tetamu-digital', mod: '2026-11-12' },
  { path: '/panduan', mod: '2026-11-12' },
  { path: '/panduan/kumpul-gambar-tetamu', mod: '2026-11-12' },
  { path: '/panduan/rsvp-dan-susun-meja', mod: '2026-11-12' },
  { path: '/panduan/cara-buat-qr-code-gambar-majlis', mod: '2026-11-12' },
  { path: '/panduan/slideshow-tv-majlis', mod: '2026-11-12' },
  { path: '/banding', mod: '2026-11-12' },
  { path: '/banding/whatsapp-google-drive', mod: '2026-11-12' },
  { path: '/banding/alternatif-wedibox-malaysia', mod: '2026-11-12' },
  // English only (§3.3)
  { path: '/en/wedding-photo-sharing-malaysia', mod: '2026-11-12' },
  { path: '/en/guides/collect-guest-photos-malaysia', mod: '2026-11-12' },
  { path: '/en/digital-wedding-invitation-malaysia', mod: '2026-11-12' },
];

export const SITE_PATHS = new Set(SITE_PAGES.map(p => p.path));

/** hreflang code for a language. */
export const hreflang = (lang: Lang) => (lang === 'en' ? 'en-MY' : 'ms-MY');
