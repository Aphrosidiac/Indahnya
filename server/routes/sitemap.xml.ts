/**
 * Only the public pages. A couple's majlis pages are never listed — they
 * are personal and `noindex` (see useGuestEvent).
 */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl;
  // `mod`: the date the page's visible "Dikemas kini" line carries (never the build time); none where the page shows none
  const pages: { loc: string; mod?: string }[] = [
    { loc: '/' },
    { loc: '/tentang', mod: '2026-10-04' },
    { loc: '/privasi', mod: '2026-09-24' },
    { loc: '/terma', mod: '2026-09-24' },
  ];
  // each language is its own URL, listed with the full reciprocal set
  const alts = (loc: string) => `    <xhtml:link rel="alternate" hreflang="ms-MY" href="${site}${loc}"/>
    <xhtml:link rel="alternate" hreflang="en-MY" href="${site}${loc}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${loc}"/>`;
  const url = (p: typeof pages[number], en: boolean) => `  <url>
    <loc>${site}${p.loc}${en ? '?lang=en' : ''}</loc>
${alts(p.loc)}${p.mod ? `\n    <lastmod>${p.mod}</lastmod>` : ''}
  </url>`;
  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=86400');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.flatMap(p => [url(p, false), url(p, true)]).join('\n')}
</urlset>
`;
});
