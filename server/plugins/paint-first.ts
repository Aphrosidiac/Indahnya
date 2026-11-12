import { SITE_PATHS } from '~~/shared/utils/site-pages';

/**
 * Public pages paint before they hydrate (docs/seo/ACCEPTANCE.md, Gate B).
 *
 * Nuxt puts ~25 `<link rel="modulepreload">` tags and the entry script in the head, so ~150 KB of JavaScript is
 * fetched at high priority in the same breath as the HTML and the fonts, and on a phone on 4G it shares the line
 * with what the first paint needs. These pages are complete in their HTML (the answer, tables and links do not
 * need JavaScript, Gate C rule 4), so on them the entry and its preloads are started from a tiny inline script once
 * the browser reports its first contentful paint, or 300 ms after `load` where no paint entry comes (some embedded
 * browsers have none; `load` alone can come before the first paint), and 3 s at the latest.
 * Hydration then runs as usual: menus, the language switch and the beacon work a moment later, and nothing on
 * screen changes.
 *
 * Only the sitemap pages (shared/utils/site-pages.ts). A couple's pages, the host app and the TV keep Nuxt's
 * default, since they are apps first.
 */
const PRELOAD_RE = /<link rel="modulepreload" as="script" crossorigin href="(\/_nuxt\/[^"]+\.js)">/g;
const ENTRY_RE = /<script type="module" src="(\/_nuxt\/[^"]+\.js)" crossorigin><\/script>/;

export default defineNitroPlugin((nitro) => {
  if (import.meta.dev) return;
  nitro.hooks.hook('render:html', (html, { event }) => {
    const path = event.path.split('?')[0]!.replace(/\/+$/, '') || '/';
    if (!SITE_PATHS.has(path)) return;
    let entry = '';
    const preloads: string[] = [];
    html.head = html.head.map((h) => h
      .replace(PRELOAD_RE, (_t, src: string) => { preloads.push(src); return ''; })
      .replace(ENTRY_RE, (_t, src: string) => { entry = src; return ''; }));
    if (!entry) return;
    const list = JSON.stringify(preloads.filter((s) => s !== entry));
    html.bodyAppend.push(`<script>(function(){var d=document;function go(){${list}.forEach(function(u){var l=d.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=u;d.head.appendChild(l)});var s=d.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entry)};d.head.appendChild(s)}var done=0;function once(){if(!done){done=1;setTimeout(go,0)}}try{new PerformanceObserver(function(l){if(l.getEntriesByName('first-contentful-paint').length)once()}).observe({type:'paint',buffered:true})}catch(e){}addEventListener('load',function(){setTimeout(once,300)});setTimeout(once,3000)})()</script>`);
  });
});
