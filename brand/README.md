# Indahnya brand

Chosen 2026-10-04 from four directions (`concepts/index.html`): **Mekar**
as the mark, with **Titik Kerawang** dotting the wordmark.

- **Mark, Mekar:** three corners of a QR code, and where the fourth should
  be, a flower. Scan it and it turns into something beautiful. It grew out
  of the old four-petal bloom.
- **Wordmark:** "indahnya", lowercase, Bricolage Grotesque at weight 660,
  optical size 96, tracking -0.05em. It is outlined, so no font loads. The i
  is dotted with a four-petal flower from Malay kerawang wood carving.

## Files

| File | Use |
|---|---|
| `indahnya-lockup.svg` / `-on-dark` | Default. Mark + wordmark. |
| `indahnya-wordmark.svg` / `-on-dark` | Where the mark is already near (kad, print headers). |
| `indahnya-mark.svg` / `-on-dark` | Avatars, small spaces, the app sidebar when collapsed. |
| `indahnya-mark-mono.svg` | One colour: print, embossing, the kad badge (takes each template's ink). |
| `indahnya-icon.svg` | The tile: ink mark on green. Favicon and home screen. |
| `og-overlay.svg` | The social card's words, laid over a photo by `build-assets.mjs`. |

In the app, use `<Logo>` (`app/ui/components/Logo.vue`). `size` sets the
mark's height in px. Ink follows `currentColor`. `mono` turns the flowers to
ink, and `inherit` takes the parent's colour.

## Rules

- **Colours:** ink `#1a1a1a`, green `#7dd56f`, paper `#fdfcfb`; on dark,
  ink becomes `#f3f1ee`. The flowers stay green unless the logo is one
  colour.
- **Clear space:** keep half the mark's height free on every side.
- **Minimum size:** the mark at 14px, the lockup at a 20px mark. Below that,
  use the tile.
- **The tile:** always green with an ink mark. A tab bar can be light or
  dark, and green reads on both.
- **Don'ts:** don't recolour the bloom, don't set "indahnya" in another face
  as the logo, don't put the old bloom tile back, and don't add the "!" from
  the Kilau concept.

## Rebuild

```bash
python3 scripts/build-brand.py && node scripts/build-assets.mjs
```

`build-brand.py` writes `brand/*.svg` and `app/ui/brand-art.ts`.
`build-assets.mjs` writes the favicons, app icons and `public/og.jpg`. It
needs `fonttools` and `brotli` (pip).
