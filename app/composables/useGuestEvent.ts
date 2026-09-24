export interface GuestEvent {
  id: string; slug: string; type: string; title: string; names: { a: string; b?: string; short?: string };
  date: string | null; venue: { name?: string; address?: string; waze?: string; gmaps?: string };
  plan: string; badge: boolean; demo: boolean;
  settings: { locale: 'ms' | 'en'; modules: { gambar: boolean; ucapan: boolean; rsvp: boolean; tempat: boolean; kad: boolean }; approvalMode: boolean; guestDeleteHours: number };
  uploadsOpen: boolean; uploadWindowEndsAt: string; storageEndsAt: string; purged: boolean;
}
export interface GuestInfo { event: GuestEvent; me: { id: string; name: string | null } | null; ready: number }

/**
 * The guest pages share one fetch of the event, server-rendered so the first
 * paint (and the WhatsApp preview) carries the names. Cached per slug.
 *
 * A couple's page is not for search engines: names, a date and a venue are
 * personal data, and the link is shared by hand. Every guest page is
 * `noindex` (the WhatsApp/Telegram preview does not care).
 */
export async function useGuestEvent() {
  const route = useRoute();
  const slug = computed(() => String(route.params.slug).toLowerCase());
  /**
   * Head composables need the Nuxt instance, which is gone after the await
   * below (a top-level await in a composable, not in <script setup>). So the
   * meta is registered FIRST, reading from a ref the page fills in later.
   */
  const meta = ref<{ title: string; description?: string; image?: string | null }>({ title: 'Indahnya' });
  const req = useFetch<GuestInfo>(() => `/api/g/${slug.value}`, { key: `g:${slug.value}` });
  const { data, error, refresh } = req;
  const site = useRuntimeConfig().public.siteUrl;
  useHead({ htmlAttrs: { lang: () => data.value?.event.settings.locale ?? 'ms' } });
  useSeoMeta({
    title: () => meta.value.title, ogTitle: () => meta.value.title,
    description: () => meta.value.description, ogDescription: () => meta.value.description,
    ogType: 'website', ogSiteName: 'Indahnya', ogUrl: () => `${site}${route.path}`,
    ogImage: () => meta.value.image || `${site}/og.jpg`, ogImageWidth: 1200, ogImageHeight: 630, twitterCard: 'summary_large_image',
    robots: 'noindex, nofollow',
  });
  await req;
  if (error.value) throw createError({ statusCode: error.value.statusCode ?? 404, statusMessage: 'Majlis tak jumpa', fatal: import.meta.client });
  const ev = computed(() => data.value!.event);
  const me = computed(() => data.value?.me ?? null);
  const lang = computed(() => ev.value.settings.locale);
  const t = useT(() => lang.value);
  const displayName = computed(() => ev.value.names.b ? `${ev.value.names.a} & ${ev.value.names.b}` : ev.value.title);
  return {
    slug, ev, me, lang, ready: computed(() => data.value?.ready ?? 0), t, displayName, refresh,
    setMeta(m: { title: string; description?: string; image?: string | null }) { meta.value = m; },
    setMe(m: { id: string; name: string | null }) { if (data.value) data.value.me = m; },
  };
}
