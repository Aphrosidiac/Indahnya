<script setup lang="ts">
import LArticle from '~/components/landing/LArticle.vue';
import { linkIn } from '~~/shared/utils/site-pages';

/**
 * /en/wedding-photo-sharing-malaysia: English landing for "wedding photo qr
 * code malaysia". Content the English home does not carry: the Malaysian
 * how-to (dewan tables, strangers, elders, venue wifi, the TV). Facts only
 * from docs/seo/research/indahnya-truth.md.
 */
definePageMeta({ layout: 'bare' });
const faq = [
  { q: 'Do guests need to install an app or sign in?', a: 'No. Guests scan the QR code and the gallery opens in their phone browser. They give a name so their photos are credited, and that is all. The couple or host does sign in to manage the gallery.' },
  { q: 'What if the venue wifi is bad?', a: 'Guests upload over their own mobile data, and an upload that gets cut off carries on when the signal returns. For the TV slideshow, the laptop or smart TV needs internet, so use a phone hotspot if the venue has none.' },
  { q: 'How much does it cost and how long are photos kept?', a: 'Free is RM0 for 50 uploads, kept 30 days after the event. RM59 one-time is unlimited uploads, kept 1 year. RM99 one-time is kept 2 years and removes the Indahnya badge from the card. The clock starts on the event day.' },
];
</script>

<template>
  <LArticle
    title="Wedding photo sharing in Malaysia with a QR code"
    description="How to collect every guest photo at a Malaysian wedding with a QR code on the tables: no app for guests, a TV slideshow, and when a WhatsApp group is enough."
    h1="Wedding photo sharing in Malaysia, with a QR code"
    lead="Put a QR code on every table. Guests scan it, pick photos from their phone and upload, and everything lands in one gallery that the couple downloads as a single zip. Indahnya, a QR photo gallery for Malaysian events, works this way. No app, no sign-in for guests."
    modified="2026-11-12"
    kicker="For Malaysian weddings"
    :crumbs="[{ name: 'Wedding photo sharing', path: '/en/wedding-photo-sharing-malaysia' }]"
    :faq="faq"
  >
    <h2>How it works at a Malaysian majlis</h2>
    <p>A <em>majlis</em> is the wedding reception, often a few hundred guests in a dewan or hotel ballroom. The photographer cannot be at every table. Your guests can.</p>
    <ol>
      <li><strong>Create the gallery.</strong> Add the couple's names, the date and the venue. One gallery is one date and one venue. If you hold two receptions on different days, make two.</li>
      <li><strong>Print the QR.</strong> Indahnya makes an A5 poster, an A4 poster and a folded table card, in the same design as your invitation, in Malay or English.</li>
      <li><strong>Place the QR where people wait.</strong> On every dining table, at the entrance and beside the guest book.</li>
      <li><strong>Guests scan and upload.</strong> They pick up to 30 files at a time, or shoot straight from the page. Videos can run up to 60 seconds each.</li>
      <li><strong>Download everything afterwards.</strong> One zip, in time order, at original quality.</li>
    </ol>

    <h2>Guests who do not know each other</h2>
    <p>At a big majlis the bride's side, the groom's side, office friends and distant relatives sit at different tables. A WhatsApp group needs everyone to join first. A QR code on the table needs nothing. Guests give a name when they upload, so the gallery and the TV show who took each photo.</p>

    <h2>Elders and guests who are not comfortable with phones</h2>
    <p>Some elders will not scan, and that is fine. Ask a nephew or niece to scan for them, and share the same link in the family WhatsApp group after the event. The printed table card helps, because the code is large and sits right in front of them.</p>

    <h2>Venue wifi and mobile data</h2>
    <p>Do not rely on the venue wifi. Guests use their own mobile data. If the signal drops mid-upload, the upload resumes when the connection returns, so nobody has to start again.</p>
    <p>The TV is different. A laptop or smart TV showing the slideshow needs internet at the venue. If the dewan has none, run it from a phone hotspot.</p>

    <h2>The TV slideshow</h2>
    <p>Open one link on the laptop or smart TV and the slideshow starts. New photos join live, with the guest's name. When guests see their own photo on the screen, more of them upload. Turn on approval mode if you want to check photos before they appear on the TV.</p>

    <h2>When a WhatsApp group is enough</h2>
    <p>Honestly, often. For a small kenduri (a community feast) or a family majlis where everyone is already in one group, a WhatsApp group works and costs nothing. The trade-offs are that photos mix with chat, and quality depends on each guest's WhatsApp settings.</p>
    <p>A QR gallery helps when guests are many and do not know each other, or when you want a TV slideshow. Try the free plan to see if it suits you. For a fuller look at the options, read <NuxtLink to="/banding/whatsapp-google-drive">the Malay comparison of a QR gallery, WhatsApp and Google Drive</NuxtLink>, or <NuxtLink to="/banding">a comparison of Malaysian QR galleries (in Malay)</NuxtLink>.</p>

    <h2>What it costs</h2>
    <p>Free is RM0: 50 uploads, kept 30 days after the event. RM59 one-time gives unlimited uploads, open for 6 months and kept 1 year. RM99 one-time is open for 12 months, kept 2 years, and removes the Indahnya badge from the card. Counting starts on the event day, not the day you set up. Paid through CHIP, in Ringgit, including FPX online banking. No subscription and no per-guest fee. See <NuxtLink :to="linkIn('/harga', 'en')">pricing</NuxtLink> for the details.</p>

    <h2>What it does not do</h2>
    <ul>
      <li>It does not replace your photographer. It collects the angles the photographer missed.</li>
      <li>It does not print an album. Download the zip and print it yourself.</li>
      <li>Guests need no app, but the host signs in to manage the gallery.</li>
      <li>Indahnya is not open to the public yet. See <NuxtLink :to="linkIn('/tentang', 'en')">about us</NuxtLink> or WhatsApp us.</li>
    </ul>

    <h2>More guides</h2>
    <p>Step by step: <NuxtLink to="/en/guides/collect-guest-photos-malaysia">how to get guests to upload photos</NuxtLink>. The invitation side: <NuxtLink to="/en/digital-wedding-invitation-malaysia">digital wedding invitations in Malaysia</NuxtLink>. The product overview is on the <NuxtLink :to="linkIn('/', 'en')">QR photo gallery</NuxtLink> home page.</p>
  </LArticle>
</template>
