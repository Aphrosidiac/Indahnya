/**
 * Only the public pages. A couple's majlis pages are never listed — they
 * are personal and `noindex` (see useGuestEvent).
 */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl;
  const pages = [
    { loc: '/', alt: true, pri: '1.0' },
    { loc: '/privasi', alt: true, pri: '0.3' },
    { loc: '/terma', alt: true, pri: '0.3' },
  ];
  const url = (p: typeof pages[number]) => `  <url>
    <loc>${site}${p.loc}</loc>
    <xhtml:link rel="alternate" hreflang="ms" href="${site}${p.loc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${site}${p.loc}?lang=en"/>
    <priority>${p.pri}</priority>
  </url>`;
  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=86400');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(url).join('\n')}
</urlset>
`;
});
