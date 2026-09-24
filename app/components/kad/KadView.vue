<script setup lang="ts">
import { Phone, MapPin, Music2, Pause, Gift, Images, CalendarPlus, Navigation, Copy, Check, X, MessageCircle, Camera, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import { KAD_THEMES, kadDate, kadTime } from '~~/shared/utils/kad-templates';
import { kadStart, type KadView } from '~~/shared/utils/kad-view';
import KadOrnament from './KadOrnament.vue';

/**
 * The e-kad, in the shape Malaysian guests already know from the genre: a
 * cover you tap open (which is also the gesture that lets the song play),
 * the invitation, the day, the countdown, the aturcara, the photos, the doa,
 * and a bottom bar — Hubungi · Lokasi · Muzik · Hadiah · Gambar — whose
 * buttons open sheets. What Indahnya adds is the last button: the guests'
 * own photo gallery, live, one tap from the card.
 *
 * `mode="preview"` is the editor's phone frame (an iframe, so fixed
 * positioning still means the phone's screen): the cover shows only when
 * asked for, nothing autoplays and nothing animates in.
 */
const props = withDefaults(defineProps<{ view: KadView; mode?: 'page' | 'preview'; ready?: number; showCover?: boolean }>(), { mode: 'page', ready: 0, showCover: true });

const t = computed(() => KAD_THEMES[props.view.template]);
const en = computed(() => props.view.locale === 'en');
const L = computed(() => en.value
  ? { open: 'Open invitation', date: 'Date', time: 'Time', venue: 'Venue', save: 'Save the date', google: 'Google Calendar', countdown: 'Counting down', days: 'days', hours: 'hours', minutes: 'min', seconds: 'sec', today: 'It is today!', past: 'Thank you for celebrating with us', programme: 'Programme', photos: 'Our moments', doa: 'Prayer', dress: 'Dress code', gift: 'Gift', contact: 'Contact', location: 'Location', music: 'Song', gallery: 'Photos', galleryTitle: 'Event photos', gallerySub: 'Took a photo at the event? Upload it here — it goes straight into one gallery.', galleryCta: 'Upload & see photos', photosCount: 'photos so far', copy: 'Copy', copied: 'Copied', qr: 'Scan with any banking app', whatsapp: 'WhatsApp', call: 'Call', badge: 'Made with Indahnya', to: 'to', close: 'Close' }
  : { open: 'Buka jemputan', date: 'Tarikh', time: 'Masa', venue: 'Tempat', save: 'Simpan tarikh', google: 'Google Calendar', countdown: 'Menghitung hari', days: 'hari', hours: 'jam', minutes: 'minit', seconds: 'saat', today: 'Hari ni la harinya!', past: 'Terima kasih kerana meraikan bersama kami', programme: 'Aturcara majlis', photos: 'Kenangan kami', doa: 'Doa', dress: 'Tema pakaian', gift: 'Salam kaut', contact: 'Hubungi', location: 'Lokasi', music: 'Lagu', gallery: 'Gambar', galleryTitle: 'Gambar majlis', gallerySub: 'Ada snap gambar masa majlis? Upload kat sini — semua masuk satu galeri.', galleryCta: 'Upload & tengok gambar', photosCount: 'gambar setakat ni', copy: 'Copy', copied: 'Dah copy', qr: 'Scan dengan mana-mana app bank', whatsapp: 'WhatsApp', call: 'Call', badge: 'Dibuat dengan Indahnya', to: 'hingga', close: 'Tutup' });

const vars = computed(() => ({
  '--k-bg': t.value.bg, '--k-band': t.value.band, '--k-ink': t.value.ink, '--k-muted': t.value.muted,
  '--k-accent': t.value.accent, '--k-on-accent': t.value.onAccent,
  '--k-names': t.value.names, '--k-heading': t.value.heading, '--k-body': t.value.body,
}));
const couple = computed(() => props.view.type === 'kahwin' && !!props.view.names.b);
const initials = computed(() => `${props.view.names.a.slice(0, 1)}${props.view.names.b ? props.view.names.b.slice(0, 1) : ''}`.toUpperCase());
const dateLong = computed(() => (props.view.date ? kadDate(props.view.date, props.view.locale) : ''));
const dateShort = computed(() => (props.view.date ? kadDate(props.view.date, props.view.locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.') : ''));
const timeLine = computed(() => [props.view.time.start, props.view.time.end].filter(Boolean).map(x => kadTime(x, props.view.locale)).join(` ${L.value.to} `));
const icsUrl = computed(() => `/api/g/${props.view.slug}/kad.ics`);
const gcalUrl = computed(() => {
  const s = kadStart(props.view.date, props.view.time.start);
  if (!s) return '';
  let e = props.view.time.end ? kadStart(props.view.date, props.view.time.end)! : new Date(s.getTime() + 4 * 3_600_000);
  if (e <= s) e = new Date(e.getTime() + 86_400_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const text = couple.value ? `${props.view.title} ${props.view.names.a} & ${props.view.names.b}` : `${props.view.title} ${props.view.names.a}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text, dates: `${f(s)}/${f(e)}`, location: [props.view.venue.name, props.view.venue.address].filter(Boolean).join(', ') });
  return `https://calendar.google.com/calendar/render?${p}`;
});

/* ── cover & song ─────────────────────────────────────────────────── */
/**
 * Opened once in this tab (say, before a trip to the gallery), the kad comes
 * back open — but only on a client-side visit: a fresh page load always
 * shows the cover, so the server and the first paint agree.
 */
const seenKey = `indahnya:kad-open:${props.view.slug}`;
const nuxtApp = useNuxtApp();
const seen = () => { try { return import.meta.client && !nuxtApp.isHydrating && sessionStorage.getItem(seenKey) === '1'; } catch { return false; } };
const opened = ref(props.mode === 'preview' ? !props.showCover : seen());
watch(() => props.showCover, (v) => { if (props.mode === 'preview') opened.value = !v; });
const audio = ref<HTMLAudioElement>();
const playing = ref(false);
function open() {
  opened.value = true;
  try { sessionStorage.setItem(seenKey, '1'); } catch { /* private mode */ }
  if (props.mode === 'page' && audio.value) audio.value.play().catch(() => {});
}
/* the page under the cover must not scroll away while the cover is up */
if (props.mode === 'page') {
  watch(opened, (o) => { if (import.meta.client) document.documentElement.style.overflow = o ? '' : 'hidden'; }, { immediate: true });
  onBeforeUnmount(() => { document.documentElement.style.overflow = ''; });
}
function toggleSong() {
  const a = audio.value; if (!a) return;
  if (a.paused) a.play().catch(() => {}); else a.pause();
}

/* ── countdown: client only, so the server and the phone never disagree ── */
const now = ref<number | null>(null);
let tick: ReturnType<typeof setInterval> | undefined;
onMounted(() => { now.value = Date.now(); tick = setInterval(() => { now.value = Date.now(); }, 1000); });
onBeforeUnmount(() => clearInterval(tick));
const count = computed(() => {
  const start = kadStart(props.view.date, props.view.time.start);
  if (!start || now.value === null) return null;
  const ms = start.getTime() - now.value;
  const dayMs = 86_400_000;
  if (ms <= 0) return { state: now.value - start.getTime() < dayMs ? 'today' as const : 'past' as const };
  return { state: 'ahead' as const, d: Math.floor(ms / dayMs), h: Math.floor((ms % dayMs) / 3_600_000), m: Math.floor((ms % 3_600_000) / 60_000), s: Math.floor((ms % 60_000) / 1000) };
});

/* ── sheets ───────────────────────────────────────────────────────── */
type Sheet = 'contact' | 'location' | 'gift';
const sheet = ref<Sheet | null>(null);
const copied = ref<string | null>(null);
async function copy(v: string) {
  try { await navigator.clipboard.writeText(v.replace(/\s/g, '')); copied.value = v; setTimeout(() => { if (copied.value === v) copied.value = null; }, 1500); } catch { /* no clipboard */ }
}
const toGallery = computed(() => `/${props.view.slug}/gambar`);

/* ── photo viewer ─────────────────────────────────────────────────── */
const viewing = ref<number | null>(null);
function step(d: number) { if (viewing.value === null) return; const n = viewing.value + d; if (n >= 0 && n < props.view.photos.length) viewing.value = n; }
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { viewing.value = null; sheet.value = null; }
  if (viewing.value !== null && e.key === 'ArrowRight') step(1);
  if (viewing.value !== null && e.key === 'ArrowLeft') step(-1);
}
onMounted(() => addEventListener('keydown', onKey));
onBeforeUnmount(() => removeEventListener('keydown', onKey));

/* sections arrive once, on entry; before that they are simply visible (the house motion rule) */
const root = ref<HTMLElement>();
onMounted(() => {
  if (props.mode === 'preview') return;
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('reveal'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -10% 0px' });
  root.value?.querySelectorAll('[data-arrive]').forEach(el => io.observe(el));
  onBeforeUnmount(() => io.disconnect());
});

const tools = computed(() => [
  props.view.contacts.length ? { key: 'contact', label: L.value.contact, icon: Phone } : null,
  props.view.venue.name || props.view.venue.address ? { key: 'location', label: L.value.location, icon: MapPin } : null,
  props.view.music ? { key: 'music', label: L.value.music, icon: playing.value ? Pause : Music2 } : null,
  props.view.gift ? { key: 'gift', label: L.value.gift, icon: Gift } : null,
  props.view.gambar ? { key: 'gambar', label: L.value.gallery, icon: Images } : null,
].filter(Boolean) as { key: string; label: string; icon: unknown }[]);
function tool(k: string) {
  if (k === 'music') return toggleSong();
  if (k === 'gambar') return props.mode === 'page' ? navigateTo(toGallery.value) : undefined;
  sheet.value = k as Sheet;
}
</script>

<template>
  <div ref="root" class="kad" :class="[`kad-${view.template}`, mode === 'preview' ? 'kad-preview' : 'kad-page']" :style="vars" :lang="view.locale">
    <audio v-if="view.music && mode === 'page'" ref="audio" :src="view.music.url" loop preload="none" @play="playing = true" @pause="playing = false" />

    <!-- COVER: the tap that opens the kad is the gesture that lets the song start -->
    <Transition name="kad-cover">
      <div v-if="!opened" class="kad-cover" role="dialog" :aria-label="view.title">
        <img v-if="view.cover" :src="view.cover" alt="" class="kad-cover-photo" />
        <div class="kad-cover-inner">
          <p class="kad-eyebrow">{{ view.title }}</p>
          <KadOrnament :kind="t.ornament" class="mt-4" />
          <div class="kad-seal" aria-hidden="true"><span>{{ initials }}</span></div>
          <p class="kad-names kad-names-cover">
            <template v-if="couple">{{ view.names.a }}<span class="kad-amp">&amp;</span>{{ view.names.b }}</template>
            <template v-else>{{ view.names.a }}</template>
          </p>
          <p v-if="dateShort" class="kad-cover-date">{{ dateShort }}</p>
          <button type="button" class="kad-open-btn" @click="open">{{ L.open }}</button>
        </div>
      </div>
    </Transition>

    <main class="kad-column" :aria-hidden="!opened && mode === 'page' ? 'true' : undefined">
      <!-- HERO -->
      <section class="kad-hero" :class="view.cover && 'kad-hero-photo'">
        <img v-if="view.cover" :src="view.cover" alt="" class="kad-hero-img" />
        <div class="kad-hero-text">
          <p class="kad-eyebrow">{{ view.title }}</p>
          <KadOrnament :kind="t.ornament" class="mt-3" />
          <h1 class="kad-names kad-names-hero">
            <template v-if="couple">{{ view.names.a }}<span class="kad-amp">&amp;</span>{{ view.names.b }}</template>
            <template v-else>{{ view.names.a }}</template>
          </h1>
          <p v-if="dateLong" class="kad-hero-date">{{ dateLong }}</p>
        </div>
      </section>

      <!-- INVITATION -->
      <section data-arrive class="kad-section kad-center">
        <p v-if="view.greeting" class="kad-greeting">{{ view.greeting }}</p>
        <p v-if="view.hosts" class="kad-hosts">{{ view.hosts }}</p>
        <p v-if="view.invite" class="kad-invite">{{ view.invite }}</p>
        <div class="kad-fullnames">
          <p class="kad-names kad-names-full">{{ view.fullNames.a }}</p>
          <template v-if="couple && view.fullNames.b">
            <p class="kad-amp kad-amp-full">&amp;</p>
            <p class="kad-names kad-names-full">{{ view.fullNames.b }}</p>
          </template>
        </div>
      </section>

      <!-- THE DAY -->
      <section data-arrive class="kad-section kad-center">
        <KadOrnament :kind="t.ornament" />
        <dl class="kad-facts">
          <div v-if="dateLong"><dt>{{ L.date }}</dt><dd>{{ dateLong }}</dd></div>
          <div v-if="timeLine"><dt>{{ L.time }}</dt><dd>{{ timeLine }}</dd></div>
          <div v-if="view.venue.name || view.venue.address"><dt>{{ L.venue }}</dt><dd><strong>{{ view.venue.name }}</strong><span v-if="view.venue.address" class="kad-address">{{ view.venue.address }}</span></dd></div>
        </dl>
        <div class="kad-actions">
          <a v-if="view.venue.waze" :href="view.venue.waze" target="_blank" rel="noopener" class="kad-btn"><Navigation class="size-4" :stroke-width="1.75" aria-hidden="true" />Waze</a>
          <a v-if="view.venue.gmaps" :href="view.venue.gmaps" target="_blank" rel="noopener" class="kad-btn"><MapPin class="size-4" :stroke-width="1.75" aria-hidden="true" />Google Maps</a>
        </div>
        <div v-if="view.date" class="kad-actions">
          <a :href="icsUrl" class="kad-btn kad-btn-solid"><CalendarPlus class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.save }}</a>
          <a v-if="gcalUrl" :href="gcalUrl" target="_blank" rel="noopener" class="kad-btn">{{ L.google }}</a>
        </div>
      </section>

      <!-- COUNTDOWN -->
      <section v-if="view.countdown" data-arrive class="kad-section kad-center">
        <p class="kad-label">{{ L.countdown }}</p>
        <ClientOnly>
          <div v-if="count?.state === 'ahead'" class="kad-count" role="timer">
            <div><strong>{{ count.d }}</strong><span>{{ L.days }}</span></div>
            <div><strong>{{ count.h }}</strong><span>{{ L.hours }}</span></div>
            <div><strong>{{ count.m }}</strong><span>{{ L.minutes }}</span></div>
            <div><strong>{{ count.s }}</strong><span>{{ L.seconds }}</span></div>
          </div>
          <p v-else-if="count" class="kad-count-done">{{ count.state === 'today' ? L.today : L.past }}</p>
          <template #fallback><div class="kad-count kad-count-skel" aria-hidden="true"><div v-for="i in 4" :key="i"><strong>–</strong><span>&nbsp;</span></div></div></template>
        </ClientOnly>
      </section>

      <!-- ATURCARA -->
      <section v-if="view.aturcara.length" data-arrive class="kad-section kad-center">
        <h2 class="kad-h2">{{ L.programme }}</h2>
        <KadOrnament :kind="t.ornament" class="mt-2" />
        <ol class="kad-aturcara">
          <li v-for="(a, i) in view.aturcara" :key="i"><span class="kad-at-time">{{ /^\d{2}:\d{2}$/.test(a.time) ? kadTime(a.time, view.locale) : a.time }}</span><span class="kad-at-item">{{ a.item }}</span></li>
        </ol>
      </section>

      <!-- PHOTOS -->
      <section v-if="view.photos.length" data-arrive class="kad-section kad-center">
        <h2 class="kad-h2">{{ L.photos }}</h2>
        <div class="kad-photos" :class="view.photos.length === 1 && 'kad-photos-one'">
          <button v-for="(p, i) in view.photos" :key="p" type="button" class="kad-photo" :aria-label="`${L.photos} ${i + 1}`" @click="viewing = i">
            <img :src="p" alt="" loading="lazy" decoding="async" />
          </button>
        </div>
      </section>

      <!-- THE GUESTS' GALLERY (Indahnya) -->
      <section v-if="view.gambar" data-arrive class="kad-section kad-center">
        <span class="kad-icon-disc"><Camera class="size-5" :stroke-width="1.6" aria-hidden="true" /></span>
        <h2 class="kad-h2 mt-3">{{ L.galleryTitle }}</h2>
        <p class="kad-p mt-2">{{ L.gallerySub }}</p>
        <NuxtLink :to="toGallery" class="kad-btn kad-btn-solid mt-5" :tabindex="mode === 'preview' ? -1 : undefined" @click="mode === 'preview' && $event.preventDefault()">{{ L.galleryCta }}</NuxtLink>
        <p v-if="ready" class="kad-small mt-3">{{ ready }} {{ L.photosCount }}</p>
      </section>

      <!-- DOA -->
      <section v-if="view.doa" data-arrive class="kad-section kad-center">
        <h2 class="kad-h2">{{ L.doa }}</h2>
        <KadOrnament :kind="t.ornament" class="mt-2" />
        <p class="kad-doa">{{ view.doa }}</p>
      </section>

      <!-- DRESS CODE -->
      <section v-if="view.dressCode || view.colours.length" data-arrive class="kad-section kad-center">
        <h2 class="kad-h2">{{ L.dress }}</h2>
        <p v-if="view.dressCode" class="kad-p mt-2">{{ view.dressCode }}</p>
        <div v-if="view.colours.length" class="kad-swatches"><span v-for="c in view.colours" :key="c" :style="{ background: c }" :title="c" /></div>
      </section>

      <!-- GIFT (also in the sheet) -->
      <section v-if="view.gift" data-arrive class="kad-section kad-center">
        <h2 class="kad-h2">{{ L.gift }}</h2>
        <p v-if="view.gift.note" class="kad-p mt-2">{{ view.gift.note }}</p>
        <button type="button" class="kad-btn kad-btn-solid mt-5" @click="sheet = 'gift'"><Gift class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.gift }}</button>
      </section>

      <footer class="kad-foot">
        <KadOrnament :kind="t.ornament" flip />
        <p class="kad-names kad-names-foot">{{ couple ? `${view.names.a} & ${view.names.b}` : view.names.a }}</p>
        <a v-if="view.badge" href="https://indahnya.my" class="kad-badge">{{ L.badge }} · FF Dev Studio</a>
      </footer>
    </main>

    <!-- THE BAR -->
    <nav v-if="tools.length && opened" class="kad-bar" :aria-label="en ? 'Invitation' : 'Jemputan'">
      <button v-for="b in tools" :key="b.key" type="button" class="kad-bar-btn" :aria-pressed="b.key === 'music' ? playing : undefined" @click="tool(b.key)">
        <component :is="b.icon" class="size-5" :stroke-width="1.6" aria-hidden="true" />{{ b.label }}
      </button>
    </nav>

    <!-- SHEETS -->
    <Transition name="veil"><div v-if="sheet" class="kad-veil" @click="sheet = null" /></Transition>
    <Transition name="kad-sheet">
      <div v-if="sheet" class="kad-sheet" role="dialog" aria-modal="true" :aria-label="sheet === 'contact' ? L.contact : sheet === 'location' ? L.location : L.gift">
        <div class="kad-sheet-head">
          <p class="kad-h2">{{ sheet === 'contact' ? L.contact : sheet === 'location' ? L.location : L.gift }}</p>
          <button type="button" class="kad-x" :aria-label="L.close" @click="sheet = null"><X class="size-5" :stroke-width="1.75" /></button>
        </div>
        <div v-if="sheet === 'contact'" class="kad-sheet-body">
          <div v-for="c in view.contacts" :key="c.phone + c.name" class="kad-row">
            <div class="min-w-0 flex-1"><p class="kad-row-title">{{ c.name }}</p><p v-if="c.role" class="kad-small">{{ c.role }}</p></div>
            <a :href="c.wa" target="_blank" rel="noopener" class="kad-btn kad-btn-sm"><MessageCircle class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.whatsapp }}</a>
            <a :href="c.tel" class="kad-btn kad-btn-sm"><Phone class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ L.call }}</a>
          </div>
        </div>
        <div v-else-if="sheet === 'location'" class="kad-sheet-body kad-center">
          <p class="kad-row-title">{{ view.venue.name }}</p>
          <p v-if="view.venue.address" class="kad-small mt-1 whitespace-pre-line">{{ view.venue.address }}</p>
          <div class="kad-actions">
            <a v-if="view.venue.waze" :href="view.venue.waze" target="_blank" rel="noopener" class="kad-btn kad-btn-solid"><Navigation class="size-4" :stroke-width="1.75" aria-hidden="true" />Waze</a>
            <a v-if="view.venue.gmaps" :href="view.venue.gmaps" target="_blank" rel="noopener" class="kad-btn"><MapPin class="size-4" :stroke-width="1.75" aria-hidden="true" />Google Maps</a>
          </div>
        </div>
        <div v-else-if="sheet === 'gift' && view.gift" class="kad-sheet-body">
          <p v-if="view.gift.note" class="kad-p kad-center">{{ view.gift.note }}</p>
          <div v-if="view.gift.qr" class="kad-qr"><img :src="view.gift.qr" alt="DuitNow QR" /><p class="kad-small">{{ L.qr }}</p></div>
          <div v-for="a in view.gift.accounts" :key="a.number" class="kad-row">
            <div class="min-w-0 flex-1"><p class="kad-small">{{ a.bank }}</p><p class="kad-row-title kad-num">{{ a.number }}</p><p class="kad-small">{{ a.name }}</p></div>
            <button type="button" class="kad-btn kad-btn-sm" @click="copy(a.number)"><component :is="copied === a.number ? Check : Copy" class="size-4" :stroke-width="1.75" aria-hidden="true" />{{ copied === a.number ? L.copied : L.copy }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PHOTO VIEWER -->
    <Transition name="veil">
      <div v-if="viewing !== null" class="kad-viewer" role="dialog" aria-modal="true" :aria-label="L.photos" @click.self="viewing = null">
        <button type="button" class="kad-viewer-x" :aria-label="L.close" @click="viewing = null"><X class="size-6" :stroke-width="1.75" /></button>
        <button v-if="viewing > 0" type="button" class="kad-viewer-nav left-2" aria-label="‹" @click="step(-1)"><ChevronLeft class="size-6" :stroke-width="1.75" /></button>
        <img :key="viewing" :src="view.photos[viewing]" alt="" class="reveal-flat" />
        <button v-if="viewing < view.photos.length - 1" type="button" class="kad-viewer-nav right-2" aria-label="›" @click="step(1)"><ChevronRight class="size-6" :stroke-width="1.75" /></button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kad { background: var(--k-bg); color: var(--k-ink); font-family: var(--k-body); min-height: 100vh; min-height: 100dvh; position: relative; -webkit-font-smoothing: antialiased; }
.kad-column { max-width: 480px; margin: 0 auto; padding-bottom: calc(88px + env(safe-area-inset-bottom)); background: var(--k-bg); box-shadow: 0 0 0 1px color-mix(in srgb, var(--k-ink) 6%, transparent); }
@media (min-width: 520px) { .kad-page { background: color-mix(in srgb, var(--k-band) 70%, var(--k-bg)); } }

.kad-eyebrow { font-family: var(--k-heading); font-size: 13px; letter-spacing: .28em; text-transform: uppercase; color: var(--k-accent); font-weight: 600; }
.kad-names { font-family: var(--k-names); color: var(--k-ink); line-height: 1.05; }
.kad-amp { display: block; font-size: .55em; color: var(--k-accent); margin: .15em 0; }
.kad-emas .kad-names, .kad-emas .kad-h2 { text-transform: uppercase; letter-spacing: .06em; }
.kad-garden .kad-names { font-weight: 400; }
.kad-klasik .kad-names { font-style: italic; }
.kad-moden .kad-names { font-weight: 700; letter-spacing: -.035em; }
.kad-minimal .kad-names { font-weight: 400; letter-spacing: -.01em; }

/* cover */
.kad-cover { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; background: var(--k-bg); overflow: hidden; text-align: center; }
.kad-cover-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .22; }
.kad-cover-inner { position: relative; padding: 32px 28px; max-width: 420px; }
.kad-seal { width: 88px; height: 88px; margin: 28px auto 20px; border-radius: 999px; display: grid; place-items: center; background: var(--k-accent); color: var(--k-on-accent); font-family: var(--k-heading); font-size: 26px; letter-spacing: .08em; box-shadow: 0 0 0 6px color-mix(in srgb, var(--k-accent) 18%, transparent); }
.kad-moden .kad-seal, .kad-minimal .kad-seal { border-radius: 0; }
.kad-names-cover { font-size: clamp(40px, 12vw, 56px); }
.kad-cover-date { margin-top: 14px; font-family: var(--k-heading); letter-spacing: .2em; font-size: 14px; color: var(--k-muted); }
.kad-open-btn { margin-top: 32px; height: 48px; padding: 0 28px; border-radius: 999px; background: var(--k-accent); color: var(--k-on-accent); font-family: var(--k-heading); font-size: 14px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; transition: transform .12s ease; }
.kad-open-btn:active { transform: scale(.97); }
.kad-cover-leave-active { transition: opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1); }
.kad-cover-leave-to { opacity: 0; transform: translateY(-4%); }

/* hero */
.kad-hero { position: relative; min-height: 78vh; min-height: 78dvh; display: grid; place-items: center; text-align: center; padding: 64px 28px; }
.kad-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kad-hero-photo .kad-hero-text { position: relative; background: color-mix(in srgb, var(--k-bg) 88%, transparent); padding: 28px 24px 30px; backdrop-filter: blur(2px); max-width: 360px; }
.kad-klasik .kad-hero-photo .kad-hero-text, .kad-emas .kad-hero-photo .kad-hero-text { outline: 1px solid var(--k-accent); outline-offset: -8px; }
.kad-names-hero { font-size: clamp(44px, 13vw, 64px); margin-top: 18px; }
/* Moden is photo-forward: the picture fills the screen, the names sit on it in white */
.kad-moden .kad-hero-photo { place-items: end center; padding-bottom: 56px; }
.kad-moden .kad-hero-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgb(0 0 0 / .72), rgb(0 0 0 / .1) 55%, transparent); }
.kad-moden .kad-hero-photo .kad-hero-text { z-index: 1; background: none; backdrop-filter: none; padding: 0; }
.kad-moden .kad-hero-photo .kad-names, .kad-moden .kad-hero-photo .kad-eyebrow, .kad-moden .kad-hero-photo .kad-amp { color: #fff; }
.kad-moden .kad-hero-photo .kad-hero-date { color: rgb(255 255 255 / .86); }
.kad-hero-date { margin-top: 16px; font-family: var(--k-heading); font-size: 16px; color: var(--k-muted); letter-spacing: .04em; }

/* sections */
.kad-section { padding: 56px 28px; }
/* bands alternate over the sections that actually render, so an empty section never leaves two tints touching */
.kad-column > .kad-section:nth-child(even of .kad-section) { background: var(--k-band); }
.kad-center { text-align: center; }
.kad-h2 { font-family: var(--k-heading); font-size: 22px; line-height: 1.2; color: var(--k-ink); font-weight: 600; }
.kad-moden .kad-h2, .kad-minimal .kad-h2 { font-size: 13px; letter-spacing: .24em; text-transform: uppercase; }
.kad-label { font-family: var(--k-heading); font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--k-accent); font-weight: 600; }
.kad-p { font-size: 17px; line-height: 1.6; color: var(--k-muted); }
.kad-small { font-size: 14px; line-height: 1.45; color: var(--k-muted); }
.kad-greeting { font-family: var(--k-heading); font-size: 17px; font-style: italic; color: var(--k-muted); }
.kad-moden .kad-greeting { font-style: normal; font-size: 15px; }
.kad-hosts { margin-top: 20px; font-family: var(--k-heading); font-size: 19px; line-height: 1.5; font-weight: 600; white-space: pre-line; color: var(--k-ink); }
.kad-invite { margin-top: 18px; font-size: 18px; line-height: 1.6; color: var(--k-muted); white-space: pre-line; }
.kad-fullnames { margin-top: 26px; }
.kad-names-full { font-size: clamp(30px, 8.6vw, 40px); }
.kad-amp-full { font-family: var(--k-names); font-size: 28px; margin: 6px 0; }
.kad-facts { margin-top: 20px; display: grid; gap: 22px; }
.kad-facts dt { font-family: var(--k-heading); font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--k-accent); font-weight: 600; }
.kad-facts dd { margin-top: 6px; font-size: 19px; line-height: 1.45; }
.kad-facts strong { display: block; font-weight: 600; }
.kad-address { display: block; font-size: 16px; color: var(--k-muted); white-space: pre-line; margin-top: 2px; }
.kad-actions { margin-top: 22px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.kad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--k-ink) 22%, transparent); color: var(--k-ink); font-family: var(--k-heading); font-size: 14px; font-weight: 600; letter-spacing: .02em; background: transparent; transition: background-color .12s ease, transform .12s ease; }
.kad-btn:hover { background: color-mix(in srgb, var(--k-ink) 6%, transparent); }
.kad-btn:active { transform: scale(.97); }
.kad-btn-solid { background: var(--k-accent); border-color: var(--k-accent); color: var(--k-on-accent); }
.kad-btn-solid:hover { background: color-mix(in srgb, var(--k-accent) 88%, var(--k-ink)); }
.kad-btn-sm { height: 36px; padding: 0 12px; font-size: 13px; }
.kad-moden .kad-btn, .kad-minimal .kad-btn, .kad-moden .kad-open-btn, .kad-minimal .kad-open-btn { border-radius: 2px; }
.kad-count { margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-width: 340px; margin-inline: auto; }
.kad-count div { padding: 14px 4px; border: 1px solid color-mix(in srgb, var(--k-accent) 40%, transparent); border-radius: 12px; }
.kad-moden .kad-count div, .kad-minimal .kad-count div { border-radius: 2px; }
.kad-count strong { display: block; font-family: var(--k-heading); font-size: 30px; line-height: 1; font-variant-numeric: tabular-nums; }
.kad-count span { display: block; margin-top: 6px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--k-muted); }
.kad-count-done { margin-top: 12px; font-family: var(--k-heading); font-size: 20px; }
.kad-aturcara { margin: 24px auto 0; max-width: 360px; text-align: left; }
.kad-aturcara li { display: grid; grid-template-columns: 116px 1fr; gap: 14px; padding: 13px 0; border-bottom: 1px solid color-mix(in srgb, var(--k-ink) 10%, transparent); }
.kad-aturcara li:last-child { border-bottom: 0; }
.kad-at-time { font-family: var(--k-heading); font-weight: 600; color: var(--k-accent); font-size: 15px; }
.kad-at-item { font-size: 17px; line-height: 1.4; }
.kad-photos { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.kad-photos-one { grid-template-columns: 1fr; }
.kad-photo { aspect-ratio: 4 / 5; overflow: hidden; border-radius: 10px; background: var(--k-band); }
.kad-photos-one .kad-photo { aspect-ratio: 4 / 3; }
.kad-moden .kad-photo, .kad-minimal .kad-photo { border-radius: 0; }
.kad-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .24s cubic-bezier(.2,.8,.2,1); }
.kad-photo:hover img { transform: scale(1.03); }
.kad-icon-disc { display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 999px; background: var(--k-accent); color: var(--k-on-accent); }
.kad-doa { margin: 18px auto 0; max-width: 380px; font-size: 18px; line-height: 1.7; font-style: italic; color: var(--k-muted); white-space: pre-line; }
.kad-moden .kad-doa { font-style: normal; font-size: 16px; }
.kad-swatches { margin-top: 16px; display: flex; justify-content: center; gap: 10px; }
.kad-swatches span { width: 34px; height: 34px; border-radius: 999px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--k-ink) 16%, transparent); }
.kad-foot { padding: 44px 28px 36px; text-align: center; }
.kad-names-foot { margin-top: 14px; font-size: 30px; }
.kad-badge { display: inline-block; margin-top: 18px; font-family: Inter, sans-serif; font-size: 12px; color: var(--k-muted); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, var(--k-muted) 40%, transparent); }

/* bar */
.kad-bar { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; z-index: 40; width: 100%; max-width: 480px; display: flex; justify-content: space-around; padding: 8px 6px calc(8px + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--k-bg) 92%, transparent); backdrop-filter: blur(12px); border-top: 1px solid color-mix(in srgb, var(--k-ink) 10%, transparent); }
.kad-bar-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 2px; font-family: Inter, sans-serif; font-size: 11px; font-weight: 500; color: var(--k-ink); border-radius: 10px; }
.kad-bar-btn svg { color: var(--k-accent); }
.kad-bar-btn:active { background: color-mix(in srgb, var(--k-ink) 6%, transparent); }

/* sheets */
.kad-veil { position: fixed; inset: 0; z-index: 60; background: rgb(0 0 0 / .4); }
.kad-sheet { position: fixed; left: 50%; bottom: 0; z-index: 61; width: 100%; max-width: 480px; transform: translateX(-50%); max-height: 82vh; overflow-y: auto; background: var(--k-bg); color: var(--k-ink); border-radius: 20px 20px 0 0; padding-bottom: calc(20px + env(safe-area-inset-bottom)); box-shadow: 0 -12px 40px rgb(0 0 0 / .18); }
.kad-sheet-enter-active, .kad-sheet-leave-active { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.kad-sheet-enter-from, .kad-sheet-leave-to { transform: translate(-50%, 100%); }
.kad-sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 8px; }
.kad-x { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 999px; color: var(--k-muted); }
.kad-x:hover { background: color-mix(in srgb, var(--k-ink) 6%, transparent); }
.kad-sheet-body { padding: 4px 20px 8px; }
.kad-row { display: flex; align-items: center; gap: 8px; padding: 14px 0; border-bottom: 1px solid color-mix(in srgb, var(--k-ink) 10%, transparent); }
.kad-row:last-child { border-bottom: 0; }
.kad-row-title { font-family: var(--k-heading); font-size: 18px; font-weight: 600; line-height: 1.3; }
.kad-num { font-variant-numeric: tabular-nums; letter-spacing: .03em; }
.kad-qr { margin: 16px auto 8px; max-width: 260px; text-align: center; }
.kad-qr img { width: 100%; border-radius: 12px; background: #fff; padding: 10px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--k-ink) 10%, transparent); }
.kad-qr p { margin-top: 8px; }

/* viewer */
.kad-viewer { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; background: rgb(12 12 12 / .95); padding: 16px; }
.kad-viewer img { max-width: 100%; max-height: 100%; border-radius: 8px; object-fit: contain; }
.kad-viewer-x { position: absolute; top: 12px; right: 12px; color: #fff; width: 44px; height: 44px; display: grid; place-items: center; }
.kad-viewer-nav { position: absolute; top: 50%; transform: translateY(-50%); color: #fff; width: 44px; height: 44px; display: grid; place-items: center; background: rgb(255 255 255 / .12); border-radius: 999px; }

@media (prefers-reduced-motion: reduce) {
  .kad-cover-leave-active, .kad-sheet-enter-active, .kad-sheet-leave-active { transition: none; }
}
</style>
