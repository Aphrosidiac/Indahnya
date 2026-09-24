<script setup lang="ts">
/**
 * The venue screen. Dark, full-bleed, a QR in the corner so the room can
 * join, a name under each photo if the host allows. Polls for new photos
 * every 6 s and folds them into the rotation — newest first, so the room
 * sees its own shot within seconds. Works on whatever is already loaded if
 * the venue wifi drops.
 *
 * Moderation reaches the screen: every poll carries the ids still on show,
 * and anything else leaves the rotation (and the screen, if it is up). A
 * rotated TV link answers 404 and the old screen goes blank.
 *
 * Two layers cross-fade; the incoming image is decoded before it is shown
 * so a 4 MB photo never flashes in half-painted, and one that fails to load
 * is skipped rather than shown as an empty frame.
 */
definePageMeta({ layout: 'bare' });
useSeoMeta({ robots: 'noindex, nofollow' });
const route = useRoute();
const slug = String(route.params.slug).toLowerCase();
const token = String(route.query.token ?? '');

interface Item { id: string; kind: 'photo' | 'video'; width: number | null; height: number | null; guestName: string | null; url: string; poster: string | null }
interface Feed { event: { title: string; names: { a: string; b?: string }; type: string; slug: string; locale: 'ms' | 'en'; settings: { intervalSec: number; showNames: boolean; shuffle: boolean } }; items: Item[]; live: string[] }

const feed = ref<Feed | null>(null);
const error = ref('');
const pool = ref<Item[]>([]);
const queue = ref<Item[]>([]);
const layers = ref<[Item | null, Item | null]>([null, null]);
/** Bumped on every assignment so a video that comes round again remounts and plays from the top. */
const stamp = ref<[number, number]>([0, 0]);
const front = ref<0 | 1>(0);
const current = computed(() => layers.value[front.value]);
const names = computed(() => feed.value ? (feed.value.event.names.b ? `${feed.value.event.names.a} & ${feed.value.event.names.b}` : feed.value.event.title) : '');
const en = computed(() => feed.value?.event.locale === 'en');
const qr = computed(() => `${siteUrl()}/${slug}/gambar`);
const qrImg = ref('');

async function pull(since?: string) {
  try {
    const r = await $fetch<Feed>(`/api/tv/${slug}`, { query: { token, since } });
    if (!feed.value) { feed.value = r; pool.value = r.items; }
    else {
      feed.value.event = r.event;
      if (r.items.length) { pool.value = [...r.items, ...pool.value]; queue.value = [...r.items, ...queue.value]; }
    }
    prune(new Set(r.live));
    // live but not here: approved, shown again, or processed late — older than `since`, so fetch them by id
    const have = new Set(pool.value.map(i => i.id));
    const missing = r.live.filter(id => !have.has(id)).slice(0, 100);
    if (missing.length) {
      const m = await $fetch<Feed>(`/api/tv/${slug}`, { query: { token, ids: missing.join(',') } });
      const fresh = m.items.filter(i => !have.has(i.id));
      if (fresh.length) {
        const order = new Map(r.live.map((id, n) => [id, n]));
        pool.value = [...pool.value, ...fresh].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        queue.value = [...fresh, ...queue.value];
      }
    }
    error.value = '';
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    // 404 is a verdict (bad or rotated link); anything else is the wifi, and the show goes on
    if (status === 404 || !feed.value) {
      error.value = status === 404 ? apiError(e, 'Link TV tak sah') : 'Tak dapat sambung — cuba lagi sekejap lagi…';
      feed.value = null; pool.value = []; queue.value = []; layers.value = [null, null];
      // a dead link stays dead: stop asking
      if (status === 404) { clearedForGood = true; clearedForGoodRef.value = true; clearInterval(poller); clearTimeout(timer); }
    }
  }
}

/** Drop what the host hid or deleted; if it is on screen right now, move on. */
function prune(live: Set<string>) {
  const keep = (i: Item) => live.has(i.id);
  if (pool.value.some(i => !keep(i))) pool.value = pool.value.filter(keep);
  if (queue.value.some(i => !keep(i))) queue.value = queue.value.filter(keep);
  cursor = Math.min(cursor, pool.value.length - 1);
  if (current.value && !keep(current.value)) void advance();
}

function nextItem(): Item | null {
  if (queue.value.length) return queue.value.shift()!;
  if (!pool.value.length) return null;
  const s = feed.value!.event.settings;
  if (s.shuffle && pool.value.length > 1) {
    let pick: Item;
    do { pick = pool.value[Math.floor(Math.random() * pool.value.length)]!; } while (pick.id === current.value?.id);
    return pick;
  }
  cursor = (cursor + 1) % pool.value.length;
  return pool.value[cursor]!;
}
let cursor = -1;
let timer: ReturnType<typeof setTimeout> | undefined;
let poller: ReturnType<typeof setInterval> | undefined;
const clearedForGoodRef = ref(false);
let clearedForGood = false;

const loadImage = (url: string) => new Promise<boolean>((res) => {
  const im = new Image();
  im.onload = () => { im.decode?.().then(() => res(true), () => res(true)) ?? res(true); };
  im.onerror = () => res(false);
  im.src = url;
});

async function advance(tries = 0) {
  clearTimeout(timer);
  const it = nextItem();
  if (!it) {
    layers.value = [null, null];
  } else {
    if (it.kind === 'photo' && !(await loadImage(it.url))) {
      // a broken frame is skipped, not shown; give up for a beat after a run of them (offline)
      if (tries < 5) return advance(tries + 1);
    } else {
      const back = front.value === 0 ? 1 : 0;
      layers.value[back] = it;
      stamp.value[back]++;
      front.value = back;
    }
  }
  const s = feed.value?.event.settings.intervalSec ?? 7;
  /** A video holds the screen until it ends (`onEnded` below); the 65 s timer is only the safety net. */
  timer = setTimeout(() => void advance(), (it?.kind === 'video' ? 65 : s) * 1000);
}
function onEnded() { void advance(); }

let retry: ReturnType<typeof setTimeout> | undefined;
async function start(): Promise<void> {
  await pull();
  if (!feed.value) {
    // no answer at all (the venue wifi, a restart): try again, unless the link itself was refused
    if (!clearedForGood) retry = setTimeout(() => void start(), 10_000);
    return;
  }
  qrImg.value = await (await import('qrcode')).toDataURL(qr.value, { margin: 1, width: 400, color: { dark: '#ffffff', light: '#00000000' } });
  void advance();
  poller = setInterval(() => { void pull(pool.value[0]?.id); }, 6000);
  document.documentElement.requestFullscreen?.().catch(() => {});
}
onMounted(() => {
  if (!token) { error.value = 'Link TV tak lengkap'; return; }
  void start();
});
onBeforeUnmount(() => { clearTimeout(timer); clearInterval(poller); clearTimeout(retry); });
const goFull = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };
useHead({ title: () => (names.value ? `${names.value} · Slideshow` : 'Slideshow · Indahnya') });
</script>

<template>
  <div class="fixed inset-0 select-none overflow-hidden bg-[#0f0f0f] text-white" @dblclick="goFull">
    <div v-if="error" class="grid size-full place-items-center text-center"><div><p class="text-[22px] font-semibold">{{ error }}</p><p class="mt-2 text-white/60">{{ clearedForGoodRef ? 'Minta link baru dari tuan majlis.' : 'Check internet laptop ni.' }}</p></div></div>

    <template v-else>
      <div v-for="(l, i) in layers" :key="i" class="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]" :class="front === i ? 'opacity-100' : 'opacity-0'">
        <div v-if="l" :key="stamp[i]" class="absolute inset-0">
          <img v-if="l.kind === 'photo'" :src="l.url" alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl" aria-hidden="true" />
          <img v-if="l.kind === 'photo'" :src="l.url" alt="" class="absolute inset-0 size-full object-contain" />
          <video v-else :src="l.url" :poster="l.poster ?? undefined" autoplay muted playsinline class="absolute inset-0 size-full object-contain" @ended="front === i && onEnded()" @error="front === i && onEnded()" />
        </div>
      </div>

      <div v-if="feed && !pool.length" class="absolute inset-0 grid place-items-center px-8 text-center">
        <div><p class="text-[40px] font-semibold tracking-[-0.02em]">{{ names }}</p><p class="mt-3 text-[20px] text-white/60">{{ en ? 'Scan the QR and upload your photos — they show up here.' : 'Scan QR, upload gambar korang — nampak kat sini terus.' }}</p></div>
      </div>

      <!-- bottom bar: names left, the guest's name centre, QR right -->
      <div v-if="feed" class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-black/70 to-transparent p-8 pt-24">
        <div class="min-w-0"><p class="truncate text-[28px] font-semibold leading-8 tracking-[-0.02em]">{{ names }}</p><p class="mt-1 text-[16px] text-white/70">{{ pool.length }} {{ en ? 'photos' : 'gambar' }}</p></div>
        <Transition name="veil"><p v-if="feed.event.settings.showNames && current?.guestName" :key="current.id" class="truncate rounded-full bg-white/15 px-5 py-2 text-[18px] backdrop-blur-md">📷 {{ current.guestName }}</p></Transition>
        <div class="flex shrink-0 items-center gap-4"><div class="text-right"><p class="text-[16px] font-medium">{{ en ? 'Scan to upload' : 'Scan untuk upload' }}</p><p class="text-[14px] text-white/60">{{ shortSite() }}/{{ slug }}</p></div><img v-if="qrImg" :src="qrImg" alt="QR" class="size-[120px]" /></div>
      </div>
    </template>
  </div>
</template>
