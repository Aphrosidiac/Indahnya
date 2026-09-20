<script setup lang="ts">
/**
 * The venue screen. Dark, full-bleed, a QR in the corner so the room can
 * join, a name under each photo if the host allows. Polls for new photos
 * every 6 s and folds them into the rotation — newest first, so the room
 * sees its own shot within seconds. Works on whatever is already loaded if
 * the venue wifi drops.
 *
 * Two layers cross-fade; the incoming image is decoded before it is shown
 * so a 4 MB photo never flashes in half-painted.
 */
definePageMeta({ layout: 'bare' });
const route = useRoute();
const slug = String(route.params.slug);
const token = String(route.query.token ?? '');

interface Item { id: string; kind: 'photo' | 'video'; width: number | null; height: number | null; guestName: string | null; url: string; poster: string | null }
interface Feed { event: { title: string; names: { a: string; b?: string }; type: string; slug: string; settings: { intervalSec: number; showNames: boolean; shuffle: boolean } }; items: Item[] }

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
const qr = computed(() => `${siteUrl()}/${slug}/gambar`);
const qrImg = ref('');

async function pull(since?: string) {
  try {
    const r = await $fetch<Feed>(`/api/tv/${slug}`, { query: { token, since } });
    if (!feed.value) { feed.value = r; pool.value = r.items; }
    else if (r.items.length) { feed.value.event = r.event; pool.value = [...r.items, ...pool.value]; queue.value = [...r.items, ...queue.value]; }
    error.value = '';
  } catch (e) { if (!feed.value) error.value = apiError(e, 'Link TV tak sah'); }
}

function nextItem(): Item | null {
  if (queue.value.length) return queue.value.shift()!;
  if (!pool.value.length) return null;
  const s = feed.value!.event.settings;
  if (s.shuffle) return pool.value[Math.floor(Math.random() * pool.value.length)]!;
  cursor = (cursor + 1) % pool.value.length;
  return pool.value[cursor]!;
}
let cursor = -1;
let timer: ReturnType<typeof setTimeout> | undefined;

async function advance() {
  const it = nextItem();
  if (it) {
    if (it.kind === 'photo') { await new Promise<void>((res) => { const im = new Image(); im.onload = () => res(); im.onerror = () => res(); im.src = it.url; }); }
    const back = front.value === 0 ? 1 : 0;
    layers.value[back] = it;
    stamp.value[back]++;
    front.value = back;
  }
  const s = feed.value?.event.settings.intervalSec ?? 7;
  /** A video holds the screen until it ends (`onEnded` below); the 65 s timer is only the safety net. */
  clearTimeout(timer);
  timer = setTimeout(advance, (it?.kind === 'video' ? 65 : s) * 1000);
}
function onEnded() { clearTimeout(timer); void advance(); }

onMounted(async () => {
  await pull();
  qrImg.value = await (await import('qrcode')).toDataURL(qr.value, { margin: 1, width: 400, color: { dark: '#ffffff', light: '#00000000' } });
  advance();
  setInterval(() => { const newest = pool.value[0]?.id; pull(newest); }, 6000);
  document.documentElement.requestFullscreen?.().catch(() => {});
});
onBeforeUnmount(() => clearTimeout(timer));
const goFull = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };
useHead({ title: () => `${names.value} · Slideshow` });
</script>

<template>
  <div class="fixed inset-0 select-none overflow-hidden bg-[#0f0f0f] text-white" @dblclick="goFull">
    <div v-if="error" class="grid size-full place-items-center text-center"><div><p class="text-[22px] font-semibold">{{ error }}</p><p class="mt-2 text-white/60">Minta link baru dari tuan majlis.</p></div></div>

    <template v-else>
      <div v-for="(l, i) in layers" :key="i" class="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]" :class="front === i ? 'opacity-100' : 'opacity-0'">
        <div v-if="l" :key="stamp[i]" class="absolute inset-0">
          <img v-if="l.kind === 'photo'" :src="l.url" alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl" aria-hidden="true" />
          <img v-if="l.kind === 'photo'" :src="l.url" alt="" class="absolute inset-0 size-full object-contain" />
          <video v-else :src="l.url" :poster="l.poster ?? undefined" autoplay muted playsinline class="absolute inset-0 size-full object-contain" @ended="front === i && onEnded()" />
        </div>
      </div>

      <div v-if="!pool.length" class="absolute inset-0 grid place-items-center text-center">
        <div><p class="text-[40px] font-semibold tracking-[-0.02em]">{{ names }}</p><p class="mt-3 text-[20px] text-white/60">Scan QR, upload gambar korang — nampak kat sini terus.</p></div>
      </div>

      <!-- bottom bar: names left, the guest's name centre, QR right -->
      <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-black/70 to-transparent p-8 pt-24">
        <div class="min-w-0"><p class="truncate text-[28px] font-semibold leading-8 tracking-[-0.02em]">{{ names }}</p><p class="mt-1 text-[16px] text-white/70">{{ pool.length }} gambar</p></div>
        <Transition name="veil"><p v-if="feed?.event.settings.showNames && current?.guestName" :key="current.id" class="truncate rounded-full bg-white/15 px-5 py-2 text-[18px] backdrop-blur-md">📷 {{ current.guestName }}</p></Transition>
        <div class="flex shrink-0 items-center gap-4"><div class="text-right"><p class="text-[16px] font-medium">Scan untuk upload</p><p class="text-[14px] text-white/60">{{ shortSite() }}/{{ slug }}</p></div><img v-if="qrImg" :src="qrImg" alt="QR" class="size-[120px]" /></div>
      </div>
    </template>
  </div>
</template>
