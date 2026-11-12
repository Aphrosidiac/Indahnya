# Sweep: how AI answers the prompts in `docs/geo/prompts_v1.csv`

Checked 2026-11-12. **Status: not measured.** I cannot query ChatGPT, Perplexity, Gemini, Copilot or Google AI Overviews from this environment (no keys, no logged-in browser session used, and the
search tools return ordinary results, not answers). Nothing below is a measurement of an answer engine. The wave 0 sheet at `docs/geo/visibility/manual-wave0/manual.csv` is still the place to record those.

Labels as in `galeri-gambar-tetamu.md`.

## What I did observe (proxy evidence only)

1. **DuckDuckGo (`kl=my-en`) for prompt-like queries.** Indahnya's home page is a result on 12 BM gallery queries, at ranks 1 to 9 (table in `galeri-gambar-tetamu.md`) [measured, DDG, once]. Bing powers part of DDG's index [inferred], and Bing feeds ChatGPT search and Copilot (GEO plan), so being indexed is a precondition met. It is not proof of citation.
2. **The WebSearch tool, 4 prompts** (US-only backend; it summarises results). It returned no Malaysian vendor and no Indahnya for any of them:
   - `cara kumpul gambar tetamu masa majlis kahwin` (p002): SAYS Malaysia articles about photographers and a QR video, plus a QR Tiger Indonesian guide [measured].
   - `e-kad kahwin digital dengan RSVP` (about p012): ecentral.my kad kahwin digital page, a UKM technical report on "Kahwinly", Jotform and Greenvelope blogs [measured].
   - `Wedibox alternative in Malaysia` (p020): irrelevant results (streaming, e-wallets). It said it found no direct alternatives [measured].
   - `best QR code wedding photo sharing app Malaysia` (p006): global list (Wedibox, GuestCam, Kululu, Joy, Folded, WaldoWed); it said nothing Malaysia-specific was found [measured].
   [inferred] This tells me the backend is not Malaysia-aware. It does **not** tell me what ChatGPT or Perplexity say. Do not read it as "AI ignores Malaysian vendors".
3. **The field that an answer engine can cite for BM prompts is small and vendor-written.** For p002, p003, p005, p019 the DDG results are 2 or 3 vendor guides (kenanganmajlis.com, gathrly.my blog, pixovia.app/ms) and the vendors' homes [measured]. [inferred] That is also the pool an engine will draw from. An Indahnya guide on the same topic would join a pool of three, not a pool of thirty.
4. **For English "best / alternatives" prompts** (p006, p007, p020, p023) the cited pool is the global vendor listicles (wedibox.com/compare, fotify, lense, pov.camera, easyweddingalbum, eventpixel ...) [measured, D]. Indahnya is on none of them (0 of 10 in `best wedding photo sharing app`). Getting named inside those lists is off-site work (`docs/geo/offsite-plan.md`), not a page.

## Prompt clusters and the page that should earn the citation

Codes: p-ids from `prompts_v1.csv`. "Not measured" for every engine.

| Cluster | Prompts | Citing page (proposed) | Note |
|---|---|---|---|
| What is / how does a QR gallery work | p001 | Home (EN) and `/en/...` photo-sharing page | definition in first sentence (already in the FAQ) |
| Collect guest photos (BM how-to) | p002, p003, p036 | `/panduan/kumpul-gambar-tetamu`, `/panduan/cara-buat-qr-code-gambar-majlis` | highest weight in the CSV (p002 weight 3) |
| Collect guest photos (EN how-to) | p004, p007, p035, p038, p037 | English guide `/en/guides/collect-guest-photos-malaysia` (if built), else the BM guide's EN sibling | approval mode (p038); original quality caveat (p037) |
| No-app upload, best-for BM | p005, p034, p033 | Home (already ranks #3 for the no-app phrasing) | keep the home answer-first |
| Best app / price, EN | p006, p008, p009 | `/harga` + English gallery page | price and what is included in the first lines |
| Slideshow / TV | p010, p011 | `/panduan/slideshow-tv-majlis` | p032 (offline) answer: needs internet at the venue |
| E-kad + RSVP + table | p012, p013, p014, p039 | `/e-kad` | the bundle angle |
| Guestbook / voice | p015 | `/buku-tetamu-digital` | |
| Other events | p016, p017, p040 | Home "Untuk majlis apa?" section + FAQ | no event pages yet (see `other-events.md`) |
| WhatsApp / Drive comparison | p018, p019 | `/banding/whatsapp-google-drive` | needs sources |
| Alternatives / vs | p020, p021, p022, p023 | `/banding/alternatif-wedibox-malaysia` | p022 (Indahnya vs Kenangan) later |
| Branded facts | p024 to p032 | `/tentang`, `/harga`, home FAQ | p027 "is Indahnya legit": `/tentang` with SSM number; p030 "who makes Indahnya"; p032 answer is no (needs internet) |

## Measurements to run (when a key or a manual session exists)

1. Wave 0 on the frozen 40 prompts, as planned in `docs/geo/plan.md` P7, with Wilson intervals. Record whether each engine cites, names, or ignores Indahnya, and which URLs it cites.
2. For each BM how-to prompt, record which 3 to 5 Malaysian URLs the engine cites. If the same three vendors appear, that is the pool to join.
3. Re-run after each new page is indexed, not before.
4. Check whether ChatGPT search, Perplexity and Copilot answer p020 with Wedibox-only English sources (likely) or with a Malaysian source.
