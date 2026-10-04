<script setup lang="ts">
import { Mail, Images, MessageSquareHeart, Users, Armchair } from 'lucide-vue-next';
import { Logo } from '~/ui';
import type { GuestEvent } from '~/composables/useGuestEvent';
import DemoGuide from '~/components/guest/DemoGuide.vue';
import { KAD_THEMES, isKadTemplate } from '~~/shared/utils/kad-templates';
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/cinzel/latin-400.css';

/**
 * What every guest page sits in: the couple's names up top, the module tabs
 * (bottom bar on a phone, a segment strip on a desk), and the Indahnya line
 * at the foot unless the plan removed it. The same ground and card language
 * as the dashboard, one size warmer.
 *
 * With a kad, the chrome wears it: the header is the kad's paper with the
 * names in its face, and the active tab is its accent, so the gallery, the
 * wishes and the RSVP read as rooms of the same majlis as the card. The
 * content keeps the app's cards (a dark kad does not darken a form).
 */
const props = defineProps<{ ev: GuestEvent; title: string; t: (k: never, v?: Record<string, string | number>) => string }>();
const route = useRoute();
const base = computed(() => `/${props.ev.slug}`);
const tabs = computed(() => {
  const m = props.ev.settings.modules;
  const all = [
    { key: 'kad', to: base.value, label: props.t('tabs.kad' as never), icon: Mail, on: m.kad },
    { key: 'gambar', to: `${base.value}/gambar`, label: props.t('tabs.gambar' as never), icon: Images, on: m.gambar },
    { key: 'ucapan', to: `${base.value}/ucapan`, label: props.t('tabs.ucapan' as never), icon: MessageSquareHeart, on: m.ucapan },
    { key: 'rsvp', to: `${base.value}/rsvp`, label: props.t('tabs.rsvp' as never), icon: Users, on: m.rsvp },
    { key: 'tempat', to: `${base.value}/tempat`, label: props.t('tabs.tempat' as never), short: props.t('tabs.tempat.short' as never), icon: Armchair, on: m.tempat },
  ];
  // a module the host switched on but that is not built yet (Phase B) gets no tab
  return all.filter(t => t.on && isBuilt(t.key));
});
const theme = computed(() => (isKadTemplate(props.ev.kadTemplate) ? KAD_THEMES[props.ev.kadTemplate] : null));
const vars = computed(() => {
  const k = theme.value;
  if (!k) return {};
  const dark = props.ev.kadTemplate === 'emas';
  return {
    '--g-paper': k.bg, '--g-ink': k.ink, '--g-muted': k.muted, '--g-accent': k.accent, '--g-on-accent': k.onAccent, '--g-names': k.names, '--g-heading': k.heading,
    '--g-ground': dark ? 'var(--color-surface-50)' : `color-mix(in srgb, ${k.band} 55%, #fff)`,
  };
});
const active = (to: string) => route.path === to || (to !== base.value && route.path.startsWith(`${to}/`));
</script>

<template>
  <div class="gshell flex min-h-screen flex-col" :class="theme && 'is-themed'" :style="vars">
    <template v-if="ev.demo"><DemoGuide :ev="ev" /><div class="h-[var(--demo-h)] shrink-0" aria-hidden="true" /></template>
    <header class="ghead sticky top-[var(--demo-h,0px)] z-20 backdrop-blur-md">
      <div class="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-3 px-4" :class="theme && 'sm:h-16'">
        <NuxtLink :to="base" class="min-w-0">
          <span class="gnames block truncate text-[16px] font-semibold leading-5 tracking-[-0.015em] text-ink-900" :class="theme?.namesCaps && 'is-caps'">{{ title }}</span>
          <span v-if="ev.date" class="gdate block truncate text-[12px] leading-4 text-ink-500">{{ fmtDate(ev.date, undefined, ev.settings.locale) }}</span>
        </NuxtLink>
        <nav v-if="tabs.length > 1" class="gtabs hidden items-center gap-0.5 rounded-[11px] bg-sand p-[3px] sm:inline-flex" :aria-label="ev.settings.locale === 'en' ? 'Sections' : 'Bahagian'">
          <NuxtLink v-for="tb in tabs" :key="tb.key" :to="tb.to"
            :aria-current="active(tb.to) ? 'page' : undefined"
            class="inline-flex h-[30px] items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors duration-[160ms]"
            :class="active(tb.to) ? 'gtab-on bg-surface-0 text-ink-900 shadow-[0_1px_2px_rgb(0_0_0/.06),0_1px_1px_rgb(0_0_0/.03)]' : 'gtab text-ink-600 hover:text-ink-900'">
            <component :is="tb.icon" class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ tb.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-2 sm:pb-12" :class="tabs.length > 1 ? 'pb-28' : 'pb-12'">
      <slot />
    </main>

    <footer v-if="ev.badge" class="mx-auto w-full max-w-[1100px] px-4 text-center text-[12px] leading-4 text-ink-400 sm:pb-8" :class="tabs.length > 1 ? 'pb-36' : 'pb-24'">
      <a href="https://indahnya.my" class="inline-flex min-h-10 items-center gap-1.5 hover:text-ink-700"><Logo :size="14" :wordmark="false" />{{ t('badge' as never) }}</a>
      <span class="mx-1.5">·</span><a href="https://ffdev.studio" target="_blank" rel="noopener" class="inline-flex min-h-10 items-center hover:text-ink-700">FF Dev Studio</a>
    </footer>

    <!-- phone bottom bar: the same pill language, thumb-reachable -->
    <nav v-if="tabs.length > 1" class="fixed inset-x-0 bottom-0 z-20 border-t border-line-100 bg-surface-0/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden" :aria-label="ev.settings.locale === 'en' ? 'Sections' : 'Bahagian'">
      <div class="mx-auto grid h-16 max-w-[520px]" :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }">
        <NuxtLink v-for="tb in tabs" :key="tb.key" :to="tb.to" :aria-current="active(tb.to) ? 'page' : undefined" class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium leading-4 transition-colors"
          :class="active(tb.to) ? 'text-ink-900' : 'text-ink-500'">
          <span class="gdot grid h-7 w-12 place-items-center rounded-full transition-colors duration-[160ms]" :class="active(tb.to) && 'is-on bg-primary-400'">
            <component :is="tb.icon" class="size-[18px]" :stroke-width="active(tb.to) ? 2 : 1.75" aria-hidden="true" />
          </span>
          {{ 'short' in tb && tabs.length > 4 ? tb.short : tb.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.gshell { background: var(--color-surface-50); }
.ghead { background: color-mix(in srgb, var(--color-surface-50) 85%, transparent); }
/* the kad's dress, when there is one */
.is-themed.gshell { background: var(--g-ground); }
.is-themed .ghead { background: color-mix(in srgb, var(--g-paper) 94%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--g-ink) 10%, transparent); }
.is-themed .gnames { font-family: var(--g-names); font-weight: 400; color: var(--g-ink); font-size: 22px; line-height: 28px; letter-spacing: 0; }
.is-themed .gnames.is-caps { text-transform: uppercase; font-size: 17px; letter-spacing: .06em; }
.is-themed .gdate { font-family: var(--g-heading); color: var(--g-muted); font-size: 13px; letter-spacing: .04em; }
.is-themed .gtabs { background: color-mix(in srgb, var(--g-ink) 7%, transparent); }
.is-themed .gtab { color: color-mix(in srgb, var(--g-ink) 72%, transparent); }
.is-themed .gtab:hover { color: var(--g-ink); }
.is-themed .gtab-on { background: var(--g-accent); color: var(--g-on-accent); box-shadow: none; }
.is-themed .gdot.is-on { background: var(--g-accent); color: var(--g-on-accent); }
</style>
