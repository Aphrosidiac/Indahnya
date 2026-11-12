/**
 * What a request is: its host, its kind (page, beacon, file, api, asset) and its group (the part of the site it
 * belongs to). Pure, no network.
 *
 * Indahnya is one origin, so the groups come from the path:
 *   marketing  the public pages (/, /harga, /en/…, guides): people here are confirmed by the beacon
 *   couple     a majlis' own pages, /<slug> and below: the guests; no beacon is sent there
 *   app / tv / embed / api   the host dashboard, the TV page, the gallery widget, the API
 * A path is a couple page when its first segment is not one the app owns (RESERVED slugs are exactly the
 * words a majlis can never take, so every marketing page is among them).
 */
import { RESERVED } from '../slug';

export type Group = 'marketing' | 'couple' | 'app' | 'tv' | 'embed' | 'api' | 'file' | 'beacon' | 'asset' | 'other';
export type Kind = 'page' | 'beacon' | 'file' | 'api' | 'asset';

/** Reserved words that are not public pages. */
const NOT_MARKETING = new Set(['app', 'api', 'masuk', 'keluar', 'tv', 'embed', 'g', 'e', 'assets', '_nuxt', 'static', 'media', 'auth', 'stripe', 'chip', 'login', 'logout', 'health', 'sitemap', 'robots', 'favicon', 'admin', 'internal', 'metrics', 'cuba']);

export function siteHost(siteUrl: string) {
  try { return new URL(siteUrl).hostname.replace(/^www\./, ''); } catch { return 'indahnya.my'; }
}

export function hostKind(h: string, siteUrl: string) {
  const d = siteHost(siteUrl);
  const host = (h ?? '').toLowerCase();
  if (host === d) return 'site';
  if (host === `www.${d}`) return 'www';
  return 'other';
}

/** "/harga/", "/harga?x=1" and "/harga" are one page; the root stays "/". */
export const normPath = (p: string) => { const s = (p || '/').split('?')[0]!.split('#')[0]!; return s.length > 1 ? s.replace(/\/+$/, '') || '/' : '/'; };

const ASSET = /^\/(_nuxt|landing|fonts|images|brand|assets|media)\/|\.(css|js|mjs|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|mp4|webm|mp3|m4a|pdf|webmanifest)$/i;
const FILE = /^\/(robots\.txt|sitemap[\w-]*\.xml|llms(-full)?\.txt|\.well-known\/.*)$/i;

export function kindOf(path: string): Kind {
  if (path === '/_e') return 'beacon';
  if (FILE.test(path)) return 'file';
  if (path.startsWith('/api/')) return 'api';
  if (ASSET.test(path)) return 'asset';
  return 'page';
}

export function groupOf(path: string, kind: Kind = kindOf(path)): Group {
  if (kind === 'beacon' || kind === 'file' || kind === 'api' || kind === 'asset') return kind;
  if (path === '/') return 'marketing';
  const first = path.split('/')[1] ?? '';
  if (first === 'app') return 'app';
  if (first === 'masuk') return 'app';
  if (first === 'tv') return 'tv';
  if (first === 'embed') return 'embed';
  if (RESERVED.has(first) && !NOT_MARKETING.has(first)) return 'marketing';
  if (RESERVED.has(first)) return 'other';
  return 'couple';
}
