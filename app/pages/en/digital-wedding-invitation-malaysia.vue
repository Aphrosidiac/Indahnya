<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { KAD_TEMPLATES, KAD_THEMES, type KadTemplate } from '~~/shared/utils/kad-templates';
import { linkIn } from '~~/shared/utils/site-pages';

/**
 * /en/digital-wedding-invitation-malaysia: the e-kad in English. The phone is
 * /contoh/kad (the real guest component on the fictional Aina & Hakim
 * sample), framed like /e-kad; the chips re-dress it by postMessage.
 */
definePageMeta({ layout: 'bare' });

const template = ref<KadTemplate>('garden');
const frame = ref<HTMLIFrameElement>();
const screen = ref<HTMLElement>();
const PHONE_W = 390;
const fit = reactive({ s: 1, h: 0 });
const theme = computed(() => KAD_THEMES[template.value]);
const swatch = (t: KadTemplate) => ({ background: `linear-gradient(135deg, ${KAD_THEMES[t].bg} 0 50%, ${KAD_THEMES[t].accent} 50% 100%)` });
const LOOK: Record<KadTemplate, string> = {
  garden: 'sage green, leaves and a handwritten feel',
  klasik: 'cream and maroon with a classic frame',
  moden: 'black and white, large photo, bold type',
  emas: 'midnight blue and gold, art deco',
  minimal: 'off-white, plenty of space, fine lines',
};

function send() {
  frame.value?.contentWindow?.postMessage({ type: 'kad-demo', template: template.value, names: { a: '', b: '' }, cover: true }, location.origin);
}
watch(template, send);
function onMessage(e: MessageEvent) {
  if (e.origin === location.origin && e.data?.type === 'kad-demo-ready' && e.source === frame.value?.contentWindow) send();
}
let ro: ResizeObserver | undefined;
onMounted(() => {
  addEventListener('message', onMessage);
  for (const ms of [400, 1200, 2500, 5000]) setTimeout(send, ms);
  ro = new ResizeObserver(([e]) => {
    const r = e?.contentRect; if (!r?.width) return;
    fit.s = r.width / PHONE_W; fit.h = r.height / fit.s;
  });
  if (screen.value) ro.observe(screen.value);
});
onBeforeUnmount(() => { removeEventListener('message', onMessage); ro?.disconnect(); });

const faq = [
  { q: 'Is the digital invitation extra?', a: 'No. The invitation is part of every plan, including Free (RM0, 50 uploads). There is no separate price for it. Paid plans are RM59 or RM99 one-time, counted from the event day.' },
  { q: 'Do guests need an app to open it?', a: 'No. Guests open one link in their phone browser, with no app and no sign-in. The host signs in to edit the invitation.' },
  { q: 'Can I use an invitation made elsewhere and use just the photo gallery?', a: 'Yes. You get a QR code and a photos-only link to put in your existing invitation or send on WhatsApp. Guests scan, upload and everything goes into one gallery.' },
];
</script>

<template>
  <LArticle
    title="Digital wedding invitation in Malaysia, with RSVP"
    description="One link for a Malaysian wedding: families, programme, doa, Waze, salam kaut DuitNow QR, RSVP, table finder, wishes and photo gallery. Five templates."
    h1="A digital wedding invitation for Malaysia, in one link"
    lead="Indahnya, a QR photo gallery for Malaysian events, also makes the digital invitation (e-kad). One link carries both families, programme, doa, maps, salam kaut DuitNow QR, RSVP, table finder and wishes. There are five templates, and it is included in every plan, even Free."
    modified="2026-11-12"
    kicker="Digital invitation"
    :crumbs="[{ name: 'Digital wedding invitation', path: '/en/digital-wedding-invitation-malaysia' }]"
    :faq="faq"
  >
    <h2>What a Malaysian digital invitation carries</h2>
    <p>Guests get one link on WhatsApp. They tap it and the invitation opens in the phone browser, with no app and no sign-in.</p>
    <ul>
      <li><strong>Both families' names</strong>, the date, time and venue, with buttons to open Waze and Google Maps.</li>
      <li><strong>A countdown</strong> to the day, and a <strong>save the date</strong> button for Google Calendar or an .ics file.</li>
      <li><strong>The programme</strong> (aturcara), the <strong>doa</strong> and the <strong>dress code</strong>.</li>
      <li><strong>RSVP</strong>: name, phone number, attending or not, number of guests, which side, meal choice and a note. The host sees totals and exports a CSV.</li>
      <li><strong>Salam kaut</strong> (a cash gift) with a DuitNow QR that any banking app can scan.</li>
      <li><strong>A table finder</strong>: guests type their name and get a table number.</li>
      <li><strong>Wishes</strong>, written or recorded by voice, which the host can download.</li>
      <li><strong>Background song</strong>, a WhatsApp or call button, and the couple's photos.</li>
      <li><strong>A button to the photo gallery</strong>, where guests upload and view photos.</li>
    </ul>

    <h2>Five templates, same invitation</h2>
    <p>Pick one and switch any time. The content stays the same and the look changes. This is the real invitation from a sample reception. <strong>A fictional sample. Names and wishes are made up.</strong></p>
    <div class="not-prose my-8 overflow-hidden rounded-[28px] px-4 py-10 transition-colors duration-500" :style="{ background: theme.band }">
      <div class="flex justify-center">
        <div class="l-phone relative aspect-[9/19.5] h-[min(620px,72vh)] max-w-full">
          <div ref="screen" class="l-phone-screen" :style="{ background: theme.bg }">
            <iframe
              ref="frame" src="/contoh/kad?cover=1" title="Sample invitation for the fictional Aina and Hakim" loading="lazy" inert scrolling="no"
              class="pointer-events-none absolute left-0 top-0 block origin-top-left border-0"
              :style="fit.h ? { width: `${PHONE_W}px`, height: `${fit.h}px`, transform: `scale(${fit.s})` } : { width: '100%', height: '100%' }"
            />
          </div>
          <span class="l-phone-island" />
        </div>
      </div>
      <div class="mt-8 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Choose an invitation template">
        <button
          v-for="t in KAD_TEMPLATES" :key="t" type="button" role="radio" :aria-checked="template === t"
          class="inline-flex h-11 items-center gap-2.5 rounded-full bg-white/70 pl-1.5 pr-4 text-[15px] font-semibold text-[#1a1a1a] transition"
          :class="template === t ? 'shadow-[0_0_0_2px_#1a1a1a]' : 'hover:bg-white'"
          @click="template = t"
        >
          <span class="size-8 rounded-full shadow-[inset_0_0_0_1px_rgba(26,26,26,.12)]" :style="swatch(t)" />{{ KAD_THEMES[t].label }}
        </button>
      </div>
    </div>
    <ul>
      <li v-for="t in KAD_TEMPLATES" :key="t"><strong>{{ KAD_THEMES[t].label }}</strong>: {{ LOOK[t] }}.</li>
    </ul>
    <p>Five is deliberate. There is no catalogue of hundreds to scroll through.</p>

    <h2>Cost</h2>
    <p>The invitation is part of every plan. Free is RM0 with every feature, limited to 50 uploads, kept 30 days after the event. RM59 one-time gives unlimited uploads and keeps photos 1 year. RM99 one-time keeps them 2 years and removes the Indahnya badge from the card. Paid through CHIP, in Ringgit, including FPX online banking. See <NuxtLink :to="linkIn('/harga', 'en')">pricing</NuxtLink>.</p>

    <h2>If your invitation is made elsewhere</h2>
    <p>You do not have to switch. Use Indahnya for the photos alone.</p>
    <ul>
      <li>Create the event and take the QR code and the photos-only link.</li>
      <li>Put the link in your existing invitation, or send it on WhatsApp.</li>
      <li>Print the QR for the tables. Guests scan, upload and everything lands in one gallery.</li>
    </ul>
    <p>How that works at the reception is in <NuxtLink to="/en/guides/collect-guest-photos-malaysia">how to get guests to upload photos</NuxtLink> and <NuxtLink to="/en/wedding-photo-sharing-malaysia">wedding photo sharing in Malaysia</NuxtLink>.</p>

    <h2>What it does not do</h2>
    <ul>
      <li>Guests need no app, but the host signs in to edit the invitation.</li>
      <li>One event is one date and one venue. Two receptions mean two events and two links.</li>
      <li>It does not print an album.</li>
      <li>Indahnya is not open to the public yet. See the <NuxtLink :to="linkIn('/', 'en')">QR photo gallery</NuxtLink> home page or WhatsApp us.</li>
    </ul>
  </LArticle>
</template>
