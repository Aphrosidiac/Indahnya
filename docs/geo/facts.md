# Indahnya: canonical fact set

The one description every surface uses: the landing, `/tentang`, the JSON-LD
(`app/composables/useSiteGraph.ts`), app-store and directory profiles, press
boilerplate. Answer-engine checks (`ai_visibility.py`) compare against this.
Change a fact here and in those places together.

Last checked against the code: 2026-10-04.

| Fact | Value | Where it is visible |
|---|---|---|
| Name | Indahnya | everywhere |
| Domain | indahnya.my (not yet registered or live) | footer, /tentang |
| One-line definition (BM) | Indahnya ialah galeri gambar majlis dengan QR untuk Malaysia. | /tentang intro, FAQ "Apa itu Indahnya?" |
| One-line definition (EN) | Indahnya is a QR photo gallery for Malaysian events. | /tentang?lang=en, FAQ "What is Indahnya?" |
| Category | QR guest photo gallery + e-invitation (e-kad) + RSVP + table finder + written/voice wishes | /tentang facts |
| For | Weddings (majlis kahwin), aqiqah, birthdays, graduations, company events, other events in Malaysia | /tentang facts, landing eyebrow |
| How guests use it | Scan the table QR, upload from the phone browser, no app, no sign-up; up to 30 photos at a time; videos up to 60 s | landing "Cara guna", FAQ, /tentang |
| Screen | Live slideshow on the venue TV/screen | landing, /tentang |
| Languages | Bahasa Melayu, English | landing, /tentang |
| Price: Percuma | RM0: 50 uploads, upload window 30 days after the event, kept 30 days after the event | landing pricing, FAQ, /tentang |
| Price: Indahnya | RM59 one-time: unlimited uploads, upload open 6 months, kept 1 year, own link, 1 co-host | landing pricing |
| Price: Indahnya Lengkap | RM99 one-time: unlimited uploads, upload open 12 months, kept 2 years, own link, 5 co-hosts, no Indahnya badge on the kad | landing pricing |
| Billing model | One-time per event; no subscription; no per-guest fee | landing pricing, FAQ |
| Payment | Stripe: FPX, card, GrabPay, in MYR | landing pricing, /tentang, /terma |
| Retention clock | Counts from the event day (or payment, whichever is later), not account creation | FAQ, /terma |
| Privacy | Couple pages noindex; EXIF/GPS stripped from shown copies; originals private; approval mode | /tentang, /privasi |
| Law | PDPA 2010 notice in BM and EN | /privasi |
| Operator | FF Dev Studio, Malaysia (ffdev.studio) | footer, /tentang, /privasi, /terma |
| Contact | hello@ffdev.studio · WhatsApp +60 13-907 8719 | /tentang and JSON-LD; WhatsApp link in landing footer. /privasi and /terma still say hello@indahnya.my (owner to decide) |

## Not published (owner decisions, see owner-todo.md)

- Legal name and SSM registration number of FF Dev Studio on Indahnya pages.
- Founder/team names and photos.
- Launch date ("since …"), customer counts, ratings: none exist yet. Never invent them.
