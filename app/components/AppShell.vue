<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  LayoutDashboard, Images, MonitorPlay, QrCode, Mail, Users, Armchair, MessageSquareHeart,
  Settings2, Menu, LogOut, PanelLeft, ChevronsUpDown, Plus, Check,
} from 'lucide-vue-next';
import { Logo, Count, useUi } from '~/ui';
import { useAuth } from '~/stores/auth';
import { useEvents } from '~/stores/events';

/**
 * ANK Ops' shell, one level simpler: the rail is the same ground as the page
 * with no border, the active item is the green pill carrying ink, the head is
 * title-left / account-right, and the fold control is remembered per browser.
 *
 * What is different is the scope. Ops is grouped by what a person came to DO;
 * a host here comes to do one thing per majlis, so the rail is scoped to the
 * open event (picked at the top) and grouped by who the screen is for:
 *
 *   Majlis   — the couple's own screens: overview, photos, the TV, the QR
 *   Tetamu   — what guests see and send: kad, RSVP, seating, wishes
 *   Tetapan  — the plan and the switches
 */
const auth = useAuth();
const ui = useUi();
const events = useEvents();
const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);
const pickerOpen = ref(false);

watch(() => route.fullPath, () => { ui.navOpen = false; menuOpen.value = false; pickerOpen.value = false; });

const eventId = computed(() => (route.params.id as string | undefined) ?? null);
const current = computed(() => events.items.find(e => e.id === eventId.value) ?? null);

type CountKey = 'gambar' | 'rsvp' | 'ucapan';
type Item = { to: string; label: string; icon: unknown; count?: CountKey; mod?: keyof EventRowModules };
type EventRowModules = { gambar: boolean; ucapan: boolean; rsvp: boolean; tempat: boolean; kad: boolean };

const groups = computed(() => {
  const id = eventId.value;
  if (!id) return [];
  const p = `/app/${id}`;
  const all: { label: string; items: Item[] }[] = [
    { label: 'Majlis', items: [
      { to: p, label: 'Ringkasan', icon: LayoutDashboard },
      { to: `${p}/gambar`, label: 'Gambar', icon: Images, count: 'gambar' },
      { to: `${p}/slideshow`, label: 'Slideshow', icon: MonitorPlay },
      { to: `${p}/qr`, label: 'QR & link', icon: QrCode },
    ] },
    { label: 'Tetamu', items: [
      { to: `${p}/kad`, label: 'Kad jemputan', icon: Mail },
      { to: `${p}/rsvp`, label: 'RSVP', icon: Users, count: 'rsvp' },
      { to: `${p}/tempat`, label: 'Tempat duduk', icon: Armchair },
      { to: `${p}/ucapan`, label: 'Ucapan', icon: MessageSquareHeart, count: 'ucapan' },
    ] },
    { label: 'Tetapan', items: [
      { to: `${p}/tetapan`, label: 'Pakej & tetapan', icon: Settings2 },
    ] },
  ];
  return all;
});

const counts = computed<Record<CountKey, number>>(() => ({
  gambar: events.current?.id === eventId.value ? events.current!.counts.ready : (current.value?.mediaCount ?? 0),
  rsvp: events.current?.id === eventId.value ? events.current!.rsvp.n : 0,
  ucapan: events.current?.id === eventId.value ? events.current!.ucapan : 0,
}));

const isActive = (n: Item) => route.path === n.to || (n.to !== `/app/${eventId.value}` && route.path.startsWith(n.to + '/'));

function pick(id: string) {
  pickerOpen.value = false;
  // stay on the same screen for the other majlis
  const tail = eventId.value ? route.path.slice(`/app/${eventId.value}`.length) : '';
  router.push(`/app/${id}${tail}`);
}

/** Close the popovers on an outside click. */
onMounted(() => {
  addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement;
    if (!t.closest('[data-user-menu]')) menuOpen.value = false;
    if (!t.closest('[data-picker]')) pickerOpen.value = false;
  });
});
</script>

<template>
  <div class="flex min-h-screen bg-surface-50">
    <!-- Sidebar — 256px, the same ground as the page, no border. Collapses to a drawer below lg. -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col bg-surface-50 transition-[transform,width] duration-[180ms] ease-[cubic-bezier(.2,.8,.2,1)] max-lg:w-[256px] max-lg:shadow-lg lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="[ui.navOpen ? 'translate-x-0' : '-translate-x-full', ui.navCollapsed ? 'lg:w-[72px]' : 'lg:w-[256px]']">
      <div class="flex h-16 shrink-0 items-center justify-between pr-3" :class="ui.navCollapsed ? 'max-lg:pl-5 lg:justify-center lg:pr-0' : 'pl-5'">
        <NuxtLink to="/app" class="flex items-center rounded-sm" :class="ui.navCollapsed && 'lg:hidden'"><Logo :size="26" /></NuxtLink>
        <button type="button" class="grid size-8 place-items-center rounded-[8px] text-ink-500 transition-colors hover:bg-sand hover:text-ink-900 max-lg:hidden"
          :aria-label="ui.navCollapsed ? 'Buka menu' : 'Lipat menu'" :aria-expanded="!ui.navCollapsed" @click="ui.toggleNav()">
          <PanelLeft class="size-[18px]" :stroke-width="1.5" />
        </button>
        <button type="button" class="grid size-8 place-items-center rounded-[8px] text-ink-500 transition-colors hover:bg-sand hover:text-ink-900 lg:hidden"
          aria-label="Tutup menu" @click="ui.navOpen = false">
          <PanelLeft class="size-[18px]" :stroke-width="1.5" />
        </button>
      </div>

      <!-- The majlis picker: which event the rail below is about. -->
      <div v-if="events.loaded && events.items.length" class="relative px-3 pb-2" data-picker :class="ui.navCollapsed && 'lg:px-2'">
        <button type="button"
          class="flex h-[42px] w-full items-center gap-2.5 rounded-sm border border-line-200 bg-surface-0 px-2.5 text-left transition-colors hover:border-ink-300"
          :class="ui.navCollapsed && 'lg:justify-center lg:px-0'" :aria-expanded="pickerOpen" @click="pickerOpen = !pickerOpen">
          <span class="grid size-7 shrink-0 place-items-center rounded-[8px] bg-ink-700 text-[11px] font-semibold text-white">
            {{ (current?.names.a ?? 'M').slice(0, 1).toUpperCase() }}{{ (current?.names.b ?? '').slice(0, 1).toUpperCase() }}
          </span>
          <span class="min-w-0 flex-1" :class="ui.navCollapsed && 'lg:hidden'">
            <span class="block truncate text-[13px] font-medium leading-4 text-ink-900">{{ current?.title ?? 'Pilih majlis' }}</span>
            <span class="block truncate text-[11px] leading-4 text-ink-500">{{ current ? `indahnya.my/${current.slug}` : `${events.items.length} majlis` }}</span>
          </span>
          <ChevronsUpDown class="size-4 shrink-0 text-ink-400" :class="ui.navCollapsed && 'lg:hidden'" :stroke-width="1.5" aria-hidden="true" />
        </button>
        <Transition name="drop">
          <div v-if="pickerOpen" class="card absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden p-1 shadow-md lg:left-3">
            <button v-for="e in events.items" :key="e.id" type="button"
              class="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-50"
              @click="pick(e.id)">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px] leading-[18px] text-ink-900">{{ e.title }}</span>
                <span class="block truncate text-[11px] leading-4 text-ink-500">{{ e.mediaCount }} gambar · {{ e.plan === 'free' ? 'Percuma' : e.plan === 'std' ? 'Indahnya' : 'Lengkap' }}</span>
              </span>
              <Check v-if="e.id === eventId" class="size-4 shrink-0 text-ink-900" :stroke-width="2" aria-hidden="true" />
            </button>
            <div class="mx-1 my-1 border-t border-line-100" />
            <NuxtLink to="/app?new=1" class="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-ink-600 transition-colors hover:bg-surface-50 hover:text-ink-900">
              <Plus class="size-4" :stroke-width="1.75" aria-hidden="true" /> Majlis baru
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-3 pt-1" aria-label="Utama">
        <div v-if="!groups.length" class="px-3 pt-1">
          <NuxtLink to="/app" class="relative flex h-9 items-center gap-2.5 rounded-sm px-3 text-[14px] leading-5 transition-colors duration-[120ms]"
            :class="route.path === '/app' ? 'bg-primary-400 font-medium text-ink-900' : 'text-ink-800 hover:bg-sand'">
            <LayoutDashboard class="size-[18px] shrink-0" :stroke-width="1.5" aria-hidden="true" />
            <span :class="ui.navCollapsed && 'lg:sr-only'">Majlis saya</span>
          </NuxtLink>
        </div>
        <div v-for="(g, gi) in groups" :key="g.label" :class="gi > 0 && 'mt-4'">
          <p class="px-3 pb-1 text-[12px] leading-4 text-ink-500" :class="ui.navCollapsed && 'lg:sr-only'">{{ g.label }}</p>
          <div v-if="ui.navCollapsed && gi > 0" class="mx-3 mb-2 hidden border-t border-line-200 lg:block" aria-hidden="true" />
          <div class="space-y-px">
            <NuxtLink v-for="n in g.items" :key="n.to" :to="n.to"
              :aria-current="isActive(n) ? 'page' : undefined"
              :title="ui.navCollapsed ? n.label : undefined"
              class="relative flex h-9 items-center gap-2.5 rounded-sm px-3 text-[14px] leading-5 transition-colors duration-[120ms]"
              :class="[isActive(n) ? 'bg-primary-400 font-medium text-ink-900' : 'text-ink-800 hover:bg-sand', ui.navCollapsed && 'lg:justify-center lg:px-0']">
              <component :is="n.icon" class="size-[18px] shrink-0"
                :class="isActive(n) ? 'text-ink-900' : 'text-ink-600'" :stroke-width="1.5" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate" :class="ui.navCollapsed && 'lg:sr-only'">{{ n.label }}</span>
              <Count v-if="n.count && counts[n.count]" :value="counts[n.count]"
                :tone="isActive(n) ? 'dark' : 'neutral'" :class="ui.navCollapsed && 'lg:hidden'" />
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="px-5 pb-4 text-[11px] leading-4 text-ink-400" :class="ui.navCollapsed && 'lg:hidden'">
        Indahnya · by <a href="https://ffdev.studio" target="_blank" rel="noopener" class="text-ink-500 hover:text-ink-900">FF Dev Studio</a>
      </div>
    </aside>

    <Transition name="veil">
      <div v-if="ui.navOpen" class="fixed inset-0 z-30 bg-ink-900/30 lg:hidden" @click="ui.navOpen = false" />
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-20 flex h-16 items-center gap-3 bg-surface-50/85 px-4 backdrop-blur-md lg:px-7">
        <button type="button"
          class="-ml-1 grid size-8 place-items-center rounded-[8px] text-ink-600 transition-colors hover:bg-sand hover:text-ink-900 lg:hidden"
          aria-label="Buka menu" @click="ui.navOpen = true">
          <Menu class="size-5" :stroke-width="1.5" />
        </button>
        <div id="page-head" class="flex min-w-0 flex-1 items-center" />

        <div class="flex shrink-0 items-center gap-2">
          <div class="relative" data-user-menu>
            <button type="button"
              class="grid size-9 place-items-center rounded-full bg-ink-700 text-[12px] font-semibold text-white transition-colors hover:bg-ink-800"
              :aria-expanded="menuOpen" :title="auth.user?.name ?? auth.user?.email" aria-label="Akaun" @click="menuOpen = !menuOpen">
              {{ auth.initials }}
            </button>
            <Transition name="drop">
              <div v-if="menuOpen" class="card absolute right-0 top-full z-30 mt-2 w-[240px] overflow-hidden p-1 shadow-md">
                <div class="px-3 pb-2 pt-2">
                  <p class="truncate text-[13px] font-medium leading-[18px] text-ink-900">{{ auth.user?.name ?? 'Tuan majlis' }}</p>
                  <p class="truncate text-[12px] leading-4 text-ink-500">{{ auth.user?.email }}</p>
                </div>
                <div class="mx-1 border-t border-line-100" />
                <button type="button"
                  class="mt-1 flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] text-ink-600 transition-colors hover:bg-surface-50 hover:text-ink-900"
                  @click="auth.logout().then(() => router.push('/masuk'))">
                  <LogOut class="size-4" :stroke-width="1.5" aria-hidden="true" />
                  Log keluar
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>
      <!-- Where a page's buttons land on a phone (PageHead teleports them here below `sm`). -->
      <div id="page-actions" class="px-4 pb-2 empty:hidden sm:hidden" />
      <main class="min-w-0 flex-1">
        <div class="mx-auto w-full max-w-[1360px]"><slot /></div>
      </main>
    </div>
  </div>
</template>
