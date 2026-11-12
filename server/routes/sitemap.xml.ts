import { SITE_PAGES, langOfPath, pathIn } from '~~/shared/utils/site-pages';

/**
 * Only the public pages (shared/utils/site-pages.ts). A couple's majlis pages
 * are never listed: they are personal and `noindex` (see useGuestEvent).
 * A page with a twin in the other language lists the reciprocal set; a page in
 * one language lists none. `lastmod` is the page's visible updated date.
 */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl;
  const abs = (p: string) => (p === '/' ? `${site}/` : `${site}${p}`);
  const url = (p: typeof SITE_PAGES[number]) => {
    const twin = pathIn(p.path, langOfPath(p.path) === 'en' ? 'ms' : 'en');
    const bm = langOfPath(p.path) === 'ms' ? p.path : twin;
    const en = langOfPath(p.path) === 'en' ? p.path : twin;
    const alts = twin && bm && en ? `
    <xhtml:link rel="alternate" hreflang="ms-MY" href="${abs(bm)}"/>
    <xhtml:link rel="alternate" hreflang="en-MY" href="${abs(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(bm)}"/>` : '';
    return `  <url>
    <loc>${abs(p.path)}</loc>${alts}${p.mod ? `\n    <lastmod>${p.mod}</lastmod>` : ''}
  </url>`;
  };
  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${SITE_PAGES.map(url).join('\n')}
</urlset>
`;
});
