<script setup lang="ts">
import { Mail, Images, MessageSquareHeart, Users, Armchair } from 'lucide-vue-next';
import { Logo } from '~/ui';
import type { GuestEvent } from '~/composables/useGuestEvent';

/**
 * What every guest page sits in: the couple's names up top, the module tabs
 * (bottom bar on a phone, a segment strip on a desk), and the Indahnya line
 * at the foot unless the plan removed it. The same ground and card language
 * as the dashboard, one size warmer.
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
    { key: 'tempat', to: `${base.value}/tempat`, label: props.t('tabs.tempat' as never), icon: Armchair, on: m.tempat },
  ];
  // a module the host switched on but that is not built yet (Phase B) gets no tab
  return all.filter(t => t.on && isBuilt(t.key));
});
const active = (to: string) => route.path === to || (to !== base.value && route.path.startsWith(`${to}/`));
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-50">
    <header class="sticky top-0 z-20 bg-surface-50/85 backdrop-blur-md">
      <div class="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-3 px-4">
        <NuxtLink :to="base" class="min-w-0">
          <span class="block truncate text-[16px] font-semibold leading-5 tracking-[-0.015em] text-ink-900">{{ title }}</span>
          <span v-if="ev.date" class="block truncate text-[12px] leading-4 text-ink-500">{{ fmtDate(ev.date, undefined, ev.settings.locale) }}</span>
        </NuxtLink>
        <nav v-if="tabs.length > 1" class="hidden items-center gap-0.5 rounded-[11px] bg-sand p-[3px] sm:inline-flex" :aria-label="ev.settings.locale === 'en' ? 'Sections' : 'Bahagian'">
          <NuxtLink v-for="tb in tabs" :key="tb.key" :to="tb.to"
            :aria-current="active(tb.to) ? 'page' : undefined"
            class="inline-flex h-[30px] items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors duration-[160ms]"
            :class="active(tb.to) ? 'bg-surface-0 text-ink-900 shadow-[0_1px_2px_rgb(0_0_0/.06),0_1px_1px_rgb(0_0_0/.03)]' : 'text-ink-600 hover:text-ink-900'">
            <component :is="tb.icon" class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ tb.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-2 sm:pb-12" :class="tabs.length > 1 ? 'pb-28' : 'pb-12'">
      <slot />
    </main>

    <footer v-if="ev.badge" class="mx-auto w-full max-w-[1100px] px-4 text-center text-[12px] leading-4 text-ink-400 sm:pb-8" :class="tabs.length > 1 ? 'pb-36' : 'pb-24'">
      <a href="https://indahnya.my" class="inline-flex items-center gap-1.5 hover:text-ink-700"><Logo :size="14" :wordmark="false" />{{ t('badge' as never) }}</a>
      <span class="mx-1.5">·</span><a href="https://ffdev.studio" target="_blank" rel="noopener" class="hover:text-ink-700">FF Dev Studio</a>
    </footer>

    <!-- phone bottom bar: the same pill language, thumb-reachable -->
    <nav v-if="tabs.length > 1" class="fixed inset-x-0 bottom-0 z-20 border-t border-line-100 bg-surface-0/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden" :aria-label="ev.settings.locale === 'en' ? 'Sections' : 'Bahagian'">
      <div class="mx-auto grid h-16 max-w-[520px]" :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }">
        <NuxtLink v-for="tb in tabs" :key="tb.key" :to="tb.to" :aria-current="active(tb.to) ? 'page' : undefined" class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium leading-4 transition-colors"
          :class="active(tb.to) ? 'text-ink-900' : 'text-ink-500'">
          <span class="grid h-7 w-12 place-items-center rounded-full transition-colors duration-[160ms]" :class="active(tb.to) && 'bg-primary-400'">
            <component :is="tb.icon" class="size-[18px]" :stroke-width="active(tb.to) ? 2 : 1.75" aria-hidden="true" />
          </span>
          {{ tb.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
