/**
 * robots.txt, from the runtime site URL so the Sitemap line is right on every
 * host (one origin, NUXT_PUBLIC_SITE_URL). Everyone, AI search and assistant
 * bots included, may read the public pages; the dashboard, sign-in, the API
 * and the TV are apps, not documents (they also send X-Robots-Tag noindex).
 * Training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended) are allowed by
 * default here; whether to keep that is the owner's decision (docs/geo/owner-todo.md).
 */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl;
  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=86400');
  return `User-agent: *
Disallow: /app
Disallow: /api/
Disallow: /tv/
Disallow: /masuk
Allow: /

Sitemap: ${site}/sitemap.xml
`;
});
