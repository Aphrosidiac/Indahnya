# Screenshots

Every screen, as it renders. These are real captures of the app running
against the seeded sample majlis (`/aina-hakim`), at 1560 × 900 (desktop) and
390 × 844 (phone). Nothing is mocked up. How they were taken:
[development.md → Screenshots](development.md#screenshots).

The couple, the guests and every name are made up. The photos are by
Malaysian photographers on Unsplash. See the [licence note](../README.md#licence).

## Landing (`/`)

![Hero: "Semua gambar majlis. Satu QR." beside the QR card and guests' photos](images/landing-hero.webp)

The same page in English (`/?lang=en`):

![English hero](images/landing-hero-en.webp)

![How it works: "Tiga langkah. Makcik pun boleh." with the phone scanning a QR stand](images/landing-how.webp)

![Kad section: template picker (Garden, Klasik, Moden, Emas, Minimal), name fields and a live kad in an iPhone frame](images/landing-kad.webp)

![Live section: the dewan TV showing a guest photo, with a "Cuba sekarang" panel to send a real photo from your phone](images/landing-live.webp)

![Pricing: Percuma RM0, Indahnya RM59, Indahnya Lengkap RM99, one-time](images/landing-pricing.webp)

<p align="center"><img src="images/landing-phone.webp" alt="Landing hero at phone width" width="300"></p>

## Guest pages (`/[slug]`)

What a guest sees after scanning. Phone first, because that's where guests
are.

<table>
  <tr>
    <td align="center" width="33%"><img src="images/guest-kad-cover.webp" alt="Kad cover with monogram, names, date and the Buka jemputan button"><br><sub>Kad: cover</sub></td>
    <td align="center" width="33%"><img src="images/guest-kad-open.webp" alt="Kad: date, time, venue, Waze, Google Maps, Simpan tarikh, Google Calendar"><br><sub>Kad: the day, venue and calendar</sub></td>
    <td align="center" width="33%"><img src="images/guest-gallery.webp" alt="Gallery grid with reaction counts and Semua / Gambar saya filter"><br><sub>Gambar</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/guest-ucapan.webp" alt="Ucapan wall with four written wishes"><br><sub>Ucapan</sub></td>
    <td align="center"><img src="images/guest-rsvp.webp" alt="RSVP form: name, hadir or tak dapat hadir, phone, note, wish"><br><sub>RSVP</sub></td>
    <td align="center"><img src="images/guest-tempat.webp" alt="Seat search: typing Ros finds Makcik Ros at Meja 1"><br><sub>Tempat duduk</sub></td>
  </tr>
</table>

The gallery on a desktop:

![Gallery at desktop width with the guest tab bar](images/guest-gallery-desk.webp)

## Venue TV (`/tv/[slug]`)

![Full-screen slideshow with uploader name, event title and the Scan untuk upload QR](images/tv.webp)

## Host dashboard (`/app/[id]`)

### Ringkasan

![Overview: totals, latest photos, plan card with clocks, quick actions, guest link](images/host-overview.webp)

<p align="center"><img src="images/host-overview-phone.webp" alt="Overview at phone width" width="300"></p>

### Gambar

![Moderation grid with uploader names; tabs for shown, hidden, processing, failed; Download semua](images/host-gambar.webp)

### Kad jemputan

![Kad editor: template cards, cover photo, countdown toggle, WhatsApp preview, live phone preview](images/host-kad.webp)

### RSVP

![RSVP: attending, not attending, sides, seated pax; filters, search and the reply table](images/host-rsvp.webp)

### Tempat duduk

![Seating: pax totals and table cards with guests and capacity bars](images/host-tempat.webp)

### Ucapan

![Ucapan moderation cards with Sembunyi and delete, and Download semua](images/host-ucapan.webp)

### QR & link

![QR page: branded QR, PNG and SVG downloads, print templates, where to place them, gallery link and embed code](images/host-qr.webp)

### Pakej & tetapan

![Plan cards with the active plan and the RM40 upgrade](images/host-tetapan.webp)
