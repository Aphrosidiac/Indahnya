# Owner to-do (Fakhrul)

Things only the owner can decide or do. Nothing here was applied silently.

## Decisions

- [ ] **Training crawlers** (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended).
  Today robots.txt allows everyone. Keeping them allowed means future models learn what
  Indahnya is (good for a brand nobody knows yet); blocking them stops reuse of the copy
  for training. Search and assistant bots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
  PerplexityBot, Googlebot, Bingbot, Applebot) stay allowed either way.
  Recommendation: keep allowed while the brand is new.
- [ ] **SSM number and legal name** on `/tentang` and in the Organization schema. FF Dev
  Studio's registration exists; say whether it goes on Indahnya's pages (Malaysian buyers
  look for it).
- [ ] **Founder / team names** on `/tentang` ("orang yang bina yang jawab WhatsApp" is on the
  page; a named person makes it verifiable).
- [ ] **Cloudflare bot settings** at launch: "Block AI bots" / "AI Labyrinth" / Bot Fight Mode
  can block search bots too. Keep them off for the public pages, or allow the search/user
  bots explicitly.
- [ ] **Deploy**: nothing here is live. Push and deploy only on your word.

## On launch day

- [ ] Verify indahnya.my in Google Search Console and Bing Webmaster Tools; submit
  `https://indahnya.my/sitemap.xml`. Turn on GSC's AI reporting if offered.
- [ ] Set up IndexNow (key file) so Bing/Copilot learn changes within hours.
- [ ] Run `bot_access.py https://indahnya.my https://indahnya.my/tentang` and the GPTBot curl
  test; fix any 403/challenge.
- [ ] GA4 (or a self-hosted equivalent) with an "AI assistants" channel for chatgpt.com,
  perplexity.ai, gemini.google.com, copilot.microsoft.com referrals.

## Measurement

- [ ] Wave 0: fill `visibility/manual-wave0/manual.csv` from logged-out ChatGPT, Perplexity,
  Gemini and Google AI Mode (fresh chat per prompt, Malaysian locale), then
  `python3 ~/.claude/skills/geo-aeo/scripts/ai_visibility.py --ingest-manual docs/geo/visibility/manual-wave0`.
  Or provide API keys (OpenAI, Anthropic, Gemini, Perplexity, SerpApi) and the agent runs it.

## Needs a source before it can be published

- [ ] [NEEDS SOURCE] WhatsApp photo compression facts and Google Drive upload requirements, for
  the planned comparison page (`plan.md` P3).
- [ ] [NEEDS SOURCE] Current Kenangan / Wedibox prices and features, dated, for any comparison.

## Off-site

See `offsite-plan.md`.
