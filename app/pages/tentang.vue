<script setup lang="ts">
import { ABOUT } from '~/composables/useLegal';

definePageMeta({ layout: 'bare' });
/** About: the facts page engines and people check Indahnya against. */
const site = useRuntimeConfig().public.siteUrl; // read in setup: the graph runs later, inside the head resolver
const graph = (lang: 'ms' | 'en', url: string) => {
  return [
    ...siteGraph(site, lang),
    {
      '@type': 'AboutPage', '@id': `${url}#webpage`, url, name: ABOUT[lang].title, description: ABOUT[lang].intro,
      inLanguage: lang === 'en' ? 'en-MY' : 'ms-MY', isPartOf: { '@id': `${site}/#website` }, about: { '@id': `${site}/#app` },
      dateModified: '2026-10-04T00:00:00+08:00',
    },
  ];
};
</script>

<template><LegalPage :doc="ABOUT" path="/tentang" :graph="graph" /></template>
