<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { linkIn } from '~~/shared/utils/site-pages';

/**
 * /en/guides/collect-guest-photos-malaysia: the English how-to for "how to
 * get guests to upload photos wedding malaysia". Same facts as the BM guide
 * (/panduan/kumpul-gambar-tetamu), written fresh for English readers.
 */
definePageMeta({ layout: 'bare' });
const faq = [
  { q: 'Can I check photos before other guests see them?', a: 'Yes. Turn on approval mode and photos show in the gallery and on the TV after you approve them. You can also hide or delete any photo.' },
  { q: 'What photo quality do I get?', a: 'Guests upload the original file from their phone. When you download everything as a zip, you get the original quality. The gallery itself shows lighter copies so it opens quickly.' },
  { q: 'How long are the photos kept?', a: 'Free: 30 days after the event. RM59: 1 year. RM99: 2 years. The count starts on the event day, not the day you created the gallery.' },
];
</script>

<template>
  <LArticle
    title="How to get wedding guests to upload photos"
    description="Three ways to collect guest photos at a Malaysian wedding: a WhatsApp group, Google Drive or a QR gallery. Steps, tips to get guests uploading, cost and limits."
    h1="How to get guests to upload their photos at a Malaysian wedding"
    lead="The easiest way is a QR code on every table. Guests scan it, pick photos from their phone and upload. Everything lands in one gallery, and you download it all as one zip. Indahnya, a QR photo gallery for Malaysian events, does exactly this. For a small group, WhatsApp is enough."
    modified="2026-11-12"
    kicker="Guide"
    :crumbs="[{ name: 'Collecting guest photos', path: '/en/guides/collect-guest-photos-malaysia' }]"
    :faq="faq"
  >
    <h2>The three common ways</h2>
    <ul>
      <li><strong>A WhatsApp group.</strong> Good for a small gathering where everyone is already in one group. The downside: photos mix with chat, and quality depends on each guest's settings.</li>
      <li><strong>A Google Drive folder or Google Photos album.</strong> Good if your family already uses Google. The downside: long links are hard to explain to older guests, and there is no slideshow for the hall.</li>
      <li><strong>A QR gallery on the tables.</strong> Good for medium and large receptions with many guests who do not know each other. The downside: there is a cost for a big event, and you have to print the QR.</li>
    </ul>
    <p>The full comparison is in Malay: <NuxtLink to="/banding/whatsapp-google-drive">QR gallery, WhatsApp or Google Drive</NuxtLink>.</p>

    <h2>Step by step with a QR gallery</h2>
    <ol>
      <li><strong>Create the gallery.</strong> Enter the couple's names, the date and the venue. One gallery is one date and one venue, so a majlis (reception) on the bride's side and another on the groom's side means two galleries.</li>
      <li><strong>Print the QR.</strong> You get an A5 poster, an A4 poster and a folded table card in your invitation's design, in Malay or English.</li>
      <li><strong>Put it where people wait.</strong> On each dining table, at the entrance and next to the guest book.</li>
      <li><strong>Add the link to your invitation.</strong> Guests who miss the table card can open the same link from the invitation. If your invitation is made elsewhere, use the photos-only link.</li>
      <li><strong>Guests scan and upload.</strong> The gallery opens in the phone browser. They pick up to 30 photos at once, or shoot directly. Videos can be up to 60 seconds. If the signal drops, the upload resumes when it returns.</li>
      <li><strong>Show it on the TV</strong> if you like. One link for a laptop or smart TV, and new photos appear with the guest's name. The venue needs internet, so use a phone hotspot if it has none.</li>
      <li><strong>Download after the event.</strong> One zip in time order at original quality. iPhone HEIC photos are converted and videos are converted to play on any phone.</li>
    </ol>

    <h2>Tips to get guests to actually upload</h2>
    <ul>
      <li><strong>Say it out loud.</strong> Ask the emcee to announce it: "There is a QR code on your table, scan it and share your photos."</li>
      <li><strong>Show the slideshow.</strong> When guests see their own photos on the screen, more of them join in.</li>
      <li><strong>Help the elders.</strong> Ask a younger relative to scan for them, or share the link in the family group after the event.</li>
      <li><strong>Use approval mode</strong> if you worry about unsuitable photos reaching the TV.</li>
      <li><strong>Send the link again</strong> a day or two later. Many guests look at their phones then.</li>
    </ul>

    <h2>What it costs</h2>
    <p>Free is RM0: 50 uploads, every feature, kept 30 days after the event. RM59 one-time gives unlimited uploads (open for 6 months) and keeps photos for 1 year. RM99 one-time stays open for 12 months, keeps photos for 2 years and removes the Indahnya badge from the card. No subscription, no per-guest fee. Paid through CHIP, in Ringgit, including FPX online banking. Details on the <NuxtLink :to="linkIn('/harga', 'en')">pricing page</NuxtLink>.</p>

    <h2>What a QR gallery does not do</h2>
    <ul>
      <li>It does not replace a photographer. It gathers angles the photographer could not reach.</li>
      <li>It does not print an album. Download the photos and print them yourself.</li>
      <li>The host signs in to manage the gallery. Guests skip the sign-in.</li>
      <li>Indahnya is not open to the public yet. See the <NuxtLink :to="linkIn('/', 'en')">QR photo gallery</NuxtLink> overview or WhatsApp us.</li>
    </ul>

    <h2>Related</h2>
    <p>The Malaysia-specific version, with dewan tables, venue wifi and elders, is <NuxtLink to="/en/wedding-photo-sharing-malaysia">wedding photo sharing in Malaysia</NuxtLink>. If you also need the invitation, read about <NuxtLink to="/en/digital-wedding-invitation-malaysia">digital wedding invitations in Malaysia</NuxtLink>.</p>
  </LArticle>
</template>
