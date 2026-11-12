import { MIRRORS, SITE_PATHS, langOfPath } from '~~/shared/utils/site-pages';

/**
 * One 301 to the clean address of a public page (docs/seo/ACCEPTANCE.md,
 * Gate A "Redirects"): no trailing slash, lowercase, and English on its own
 * /en path instead of the old `?lang=en`. Every fix is folded into a single
 * hop, and the rest of the query string (utm_*, gclid) is kept.
 *
 * Only GET/HEAD of page-shaped paths: never the API, Nuxt's assets (hashed
 * names have capitals), the beacon, media or any path with a file extension.
 */
const SKIP = /^\/(?:api|_nuxt|_e|_ipx|media|__nuxt)(?:\/|$)/;

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return;
  const raw = event.node.req.url ?? '/';
  const q = raw.indexOf('?');
  const path0 = q < 0 ? raw : raw.slice(0, q);
  if (SKIP.test(path0) || /\.[a-z0-9]+$/i.test(path0)) return;
  const params = new URLSearchParams(q < 0 ? '' : raw.slice(q + 1));

  let path = path0.length > 1 ? path0.replace(/\/+$/, '') || '/' : path0;
  // capitals: only for our own pages, so a guest's link is never second-guessed
  const lower = path.toLowerCase();
  if (lower !== path && (SITE_PATHS.has(lower) || MIRRORS[lower])) path = lower;
  // the old English address: /harga?lang=en → /en/pricing
  let dropLang = false;
  if (params.get('lang') === 'en' && (MIRRORS[path] || langOfPath(path) === 'en')) {
    path = MIRRORS[path] ?? path;
    dropLang = true;
  }
  if (path === path0 && !dropLang) return;
  // untouched queries pass through as they came; only a dropped `lang` re-encodes
  let rest = q < 0 ? '' : raw.slice(q + 1);
  if (dropLang) { params.delete('lang'); rest = params.toString(); }
  return sendRedirect(event, path + (rest ? `?${rest}` : ''), 301);
});
