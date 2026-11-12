import { hreflang, langOfPath, linkIn, pathIn, type Lang } from '~~/shared/utils/site-pages';

/** The page's language, from its address: BM at the root, English under /en. */
export function useLang() {
  const route = useRoute();
  return computed<Lang>(() => langOfPath(route.path));
}

export interface Crumb { name: string; path: string }

/**
 * The head of every public page in one place (docs/seo/ACCEPTANCE.md, Gate A):
 * one self-canonical, hreflang only when the page has a twin in the other
 * language (shared/utils/site-pages.ts), Open Graph, and one JSON-LD graph of
 * the site entities, this page, and its BreadcrumbList.
 *
 * `modified` is the date the page shows as "Dikemas kini"; the sitemap and
 * `dateModified` carry the same day. No FAQPage: FAQ rich results are gone and
 * the visible FAQ is what engines read.
 */
export function usePublicSeo(o: {
  title: () => string;
  description: () => string;
  ogTitle?: () => string;
  ogImageAlt?: string;
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'Article';
  modified?: string;
  /** The trail after Home; the last crumb is this page. None on the home page. */
  crumbs?: () => Crumb[];
  /** Include the site-wide Organization, WebSite and product entities. */
  graph?: boolean;
  extra?: (url: string) => Record<string, unknown>[];
}) {
  const route = useRoute();
  const lang = useLang();
  const site = useRuntimeConfig().public.siteUrl;
  const abs = (p: string) => (p === '/' ? `${site}/` : `${site}${p}`);
  const path = computed(() => (route.path.length > 1 ? route.path.replace(/\/+$/, '') : '/'));
  const url = computed(() => abs(path.value));
  const twin = computed(() => pathIn(path.value, lang.value === 'en' ? 'ms' : 'en'));

  /** hreflang alternates: only when the page has a twin in the other language. */
  const alternates = computed(() => {
    if (!twin.value) return [];
    const bm = lang.value === 'ms' ? path.value : twin.value;
    const en = lang.value === 'en' ? path.value : twin.value;
    return [['ms-MY', abs(bm)], ['en-MY', abs(en)], ['x-default', abs(bm)]] as const;
  });

  const ld = () => {
    const en = lang.value === 'en';
    const page: Record<string, unknown> = {
      '@type': o.type ?? 'WebPage', '@id': `${url.value}#webpage`, url: url.value, name: o.title(), description: o.description(),
      inLanguage: hreflang(lang.value), isPartOf: { '@id': `${site}/#website` }, about: { '@id': `${site}/#app` }, publisher: { '@id': `${site}/#org` },
    };
    if (o.modified) page.dateModified = `${o.modified}T00:00:00+08:00`;
    const graph: Record<string, unknown>[] = [...(o.graph ? siteGraph(site, lang.value) : []), page];
    const crumbs = o.crumbs?.() ?? [];
    if (crumbs.length) {
      const trail = [{ name: en ? 'Home' : 'Laman utama', path: linkIn('/', lang.value) }, ...crumbs];
      graph.push({
        '@type': 'BreadcrumbList', '@id': `${url.value}#breadcrumb`,
        itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
      });
      page.breadcrumb = { '@id': `${url.value}#breadcrumb` };
    }
    return ldJson([...graph, ...(o.extra?.(url.value) ?? [])]);
  };

  useHead(() => ({
    htmlAttrs: { lang: hreflang(lang.value) },
    link: [{ rel: 'canonical', href: url.value }, ...alternates.value.map(([hl, href]) => ({ rel: 'alternate' as const, hreflang: hl, href }))],
    script: [{ type: 'application/ld+json', innerHTML: ld() }],
  }));
  useSeoMeta({
    title: o.title,
    description: o.description,
    ogTitle: o.ogTitle ?? o.title,
    ogDescription: o.description,
    ogUrl: url,
    ogType: 'website',
    ogSiteName: 'Indahnya',
    ogLocale: () => (lang.value === 'en' ? 'en_MY' : 'ms_MY'),
    ogImage: `${site}/og.jpg`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: o.ogImageAlt ?? 'Indahnya: galeri gambar majlis dengan QR',
    twitterCard: 'summary_large_image',
  });
  return { lang, url, path, twin, site };
}
