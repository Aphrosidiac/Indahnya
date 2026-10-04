# GEO / AEO brief: Indahnya (2026-10-04)

Inferred from the repo, PLAN.md and the project state; Fakhrul ran `/geo-aeo`
with no further brief.

- **Target**: repo `~/Desktop/dev/Indahnya` (Nuxt 4, SSR), checked on the local
  dev server `http://localhost:3182`. Production `indahnya.my` is **not
  registered and not deployed**, so nothing live could be probed.
- **Business**: QR guest photo gallery + e-kad + RSVP + table finder + wishes
  for Malaysian events. Sold one-time per event (RM0 / RM59 / RM99). Built and
  run by FF Dev Studio.
- **Vertical**: consumer SaaS (wedding/event tech). The SaaS playbook applies
  (pricing in HTML, comparison pages, docs), plus the Malaysia specifics (real BM
  pages, `ms-MY`, WhatsApp contact, SSM number).
- **Markets and languages**: Malaysia; Bahasa Melayu (colloquial, default) and
  English, each its own URL (`/` and `/?lang=en`).
- **Brand**: Indahnya (alias indahnya.my). Operator: FF Dev Studio.
- **Competitors** (positioning evidence from the 2026-09-19 market read, not yet
  checked against what engines cite; replace after wave 0): Kenangan
  (kenanganmajlis.com, the only local QR-gallery rival seen), Wedibox, GuestPix,
  POV; Malaysian e-kad platforms Tuan Majlis, Jemputan.me, KadKami, Nak Jemput.
- **Stack / host**: Nuxt 4 SSR on a VPS behind nginx (planned), media on
  Cloudflare R2. CDN/WAF bot settings unknown until it is live.
- **Owner decisions open**: training-crawler policy, SSM number and legal name
  on pages, founder naming, Cloudflare bot settings, deploy. See `owner-todo.md`.
- **Access**: no GSC, Bing Webmaster Tools, GA4, server logs or answer-engine API
  keys exist (site not live). Recorded as not measured, not guessed.
