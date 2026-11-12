/**
 * Finishes what `features.inlineStyles` starts (nuxt.config.ts). Nuxt inlines a component's CSS into the HTML,
 * but CSS that Rolldown puts in a SHARED chunk (landing.css, the @fontsource faces, QrStand's styles) is still
 * linked as a stylesheet, and a linked stylesheet holds the first paint: ~450 ms per page on Lighthouse mobile
 * (docs/seo/ACCEPTANCE.md, Gate B). Some of those files are already inline in full, some only in part.
 *
 * So every `<link rel="stylesheet" href="/_nuxt/…css">` in a server-rendered page becomes a `<style>` with only the
 * rules that are not inline yet (nothing, when all are), in the same place, so the cascade order is unchanged.
 * The CSS comes from the client build, bundled as server assets (`client-css`, registered in nuxt.config.ts).
 * Relative `url(./font.woff2)` references are made absolute, since the page is not in /_nuxt/. After hydration
 * Vite still loads these files for its chunks the usual way; the rules are the same, so nothing changes on screen.
 */
const LINK_RE = /<link rel="stylesheet" href="\/_nuxt\/([^"?#]+\.css)"[^>]*>/g;
const STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;
const URL_RE = /url\(\s*(['"]?)(?!\/|data:|https?:|#)(?:\.\/)?([^'")]+)\1\s*\)/g;

/** Top-level rules, by brace depth (the build's CSS is minified and has no braces inside strings). */
function rules(css: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { out.push(css.slice(start, i + 1)); start = i + 1; }
  }
  return out;
}

export default defineNitroPlugin((nitro) => {
  if (import.meta.dev) return;
  let files: Promise<Map<string, string[]>> | null = null;
  const load = async () => {
    const store = useStorage('assets:client-css');
    const map = new Map<string, string[]>();
    for (const key of await store.getKeys()) {
      const raw = await store.getItemRaw(key);
      const css = typeof raw === 'string' ? raw : Buffer.from(raw as ArrayBuffer).toString('utf8');
      map.set(key.replace(/^.*:/, ''), rules(css.replace(URL_RE, (_m, q: string, p: string) => `url(${q}/_nuxt/${p}${q})`)));
    }
    return map;
  };

  nitro.hooks.hook('render:html', async (html) => {
    if (!html.head.some((h) => h.includes('rel="stylesheet"'))) return;
    const css = await (files ??= load());
    if (!css.size) return;
    const present = [...html.head.join('').matchAll(STYLE_RE)].map((m) => m[1]).join('\n');
    html.head = html.head.map((h) => h.replace(LINK_RE, (tag, file: string) => {
      const list = css.get(file);
      if (!list) return tag;
      const missing = list.filter((r) => !present.includes(r)).join('');
      return missing ? `<style>${missing}</style>` : '';
    }));
  });
});
