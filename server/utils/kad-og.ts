import sharp from 'sharp';
import * as fontkit from 'fontkit';
import { KAD_THEMES, kadDate, kadTime, type KadTheme } from '../../shared/utils/kad-templates';
import type { KadView } from '../../shared/utils/kad-view';

/**
 * The WhatsApp / Telegram preview for a kad: 1200×630, in the kad's own
 * template, with the couple's cover photo when there is one.
 *
 * Text is drawn as OUTLINES from font files bundled in server/assets/fonts
 * (fontkit shapes the line → SVG paths → sharp), so the image is identical
 * on a laptop and on a VPS with no fonts installed. (opentype.js was tried
 * first: it emits NaN inside some Cormorant outlines and cannot shape Great
 * Vibes; sharp's own text renderer cannot load a font file without
 * fontconfig.)
 */
const W = 1200, H = 630;
type Font = fontkit.Font;
const fonts = new Map<string, Font>();

export type FontLoader = (file: string) => Promise<Buffer>;
/** In the app the fonts come from Nitro's bundled server assets; a script passes its own loader. */
const nitroFonts: FontLoader = async (file) => {
  const raw = await useStorage('assets:server').getItemRaw(`fonts/${file}`);
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as Uint8Array);
};

async function font(file: string, load: FontLoader) {
  let f = fonts.get(file);
  if (!f) {
    f = fontkit.create(await load(file)) as Font;
    fonts.set(file, f);
  }
  return f;
}

/**
 * A line of text as one SVG path, centred on cx, shrunk until it fits maxW.
 * The bundled fonts are Latin: a line with a character they cannot draw
 * (a Chinese, Tamil or Jawi name) is left out rather than drawn as empty
 * boxes — the page itself still shows it, in the phone's own fonts.
 */
function line(f: Font, text: string, size: number, cx: number, y: number, fill: string, maxW: number, tracking = 0) {
  if ([...text].some(ch => !/\s/.test(ch) && !f.hasGlyphForCodePoint(ch.codePointAt(0)!))) return '';
  const run = f.layout(text);
  const width = (sz: number) => run.positions.reduce((w, p) => w + p.xAdvance * (sz / f.unitsPerEm) + tracking, -tracking);
  let sz = size;
  while (sz > 12 && width(sz) > maxW) sz -= 2;
  const s = sz / f.unitsPerEm;
  let x = cx - width(sz) / 2, d = '';
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i]!;
    d += g.path.scale(s, -s).translate(x + p.xOffset * s, y - p.yOffset * s).toSVG();
    x += p.xAdvance * s + tracking;
  });
  return `<path d="${d}" fill="${fill}"/>`;
}

function ornament(t: KadTheme, cx: number, y: number, w: number) {
  const a = t.accent;
  switch (t.ornament) {
    case 'sprig': return `<g stroke="${a}" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M${cx - w / 2} ${y} H${cx - 22} M${cx + 22} ${y} H${cx + w / 2}"/>
      <path d="M${cx - 16} ${y} q8 -14 16 -18 q8 4 16 18" /><path d="M${cx - 8} ${y - 6} q-10 -10 -20 -8 M${cx + 8} ${y - 6} q10 -10 20 -8"/></g>`;
    case 'filigree': return `<g stroke="${a}" stroke-width="1.6" fill="none">
      <path d="M${cx - w / 2} ${y} H${cx - 30} M${cx + 30} ${y} H${cx + w / 2}"/>
      <path d="M${cx - 30} ${y} c10 -14 20 -14 30 0 c10 14 20 14 30 0"/><circle cx="${cx}" cy="${y}" r="3" fill="${a}"/></g>`;
    case 'deco': return `<g stroke="${a}" stroke-width="1.6" fill="none">
      <path d="M${cx - w / 2} ${y - 4} H${cx - 20} M${cx - w / 2} ${y + 4} H${cx - 20} M${cx + 20} ${y - 4} H${cx + w / 2} M${cx + 20} ${y + 4} H${cx + w / 2}"/>
      <path d="M${cx} ${y - 12} L${cx + 12} ${y} L${cx} ${y + 12} L${cx - 12} ${y} Z" fill="${a}"/></g>`;
    case 'rule': return `<path d="M${cx - w / 2} ${y} H${cx + w / 2}" stroke="${a}" stroke-width="1"/>`;
    default: return '';
  }
}

export async function renderKadOg(view: KadView, cover: Buffer | null, load: FontLoader = nitroFonts) {
  const t = KAD_THEMES[view.template];
  const [fNames, fText, fBold] = await Promise.all([font(t.og.names, load), font(t.og.text, load), font(t.og.textBold, load)]);
  const lang = view.locale;

  let photo: Buffer | null = null;
  if (cover) {
    try { photo = await sharp(cover).resize(520, H, { fit: 'cover' }).jpeg().toBuffer(); }
    catch { photo = null; }
  }
  const panelW = photo ? W - 520 : W;
  const cx = panelW / 2, maxW = panelW - 120;
  const names = view.fullNames.b && view.type === 'kahwin' ? [view.names.a, '&', view.names.b ?? ''] : [view.names.b ? `${view.names.a} & ${view.names.b}` : view.names.a];
  const up = (s: string) => (t.namesCaps ? s.toUpperCase() : s);
  const when = [view.date ? kadDate(view.date, lang) : '', view.time.start ? kadTime(view.time.start, lang) : ''].filter(Boolean).join(' · ');

  const parts: string[] = [];
  parts.push(line(fBold, view.title.toUpperCase(), 26, cx, 128, t.accent, maxW, 4));
  parts.push(ornament(t, cx, 160, 220));
  if (names.length === 3) {
    parts.push(line(fNames, up(names[0]!), 92, cx, 268, t.ink, maxW));
    parts.push(line(fNames, '&', 52, cx, 330, t.accent, maxW));
    parts.push(line(fNames, up(names[2]!), 92, cx, 420, t.ink, maxW));
  } else {
    parts.push(line(fNames, up(names[0]!), 96, cx, 330, t.ink, maxW));
  }
  if (when) parts.push(line(fText, when, 32, cx, 500, t.ink, maxW));
  if (view.venue.name) parts.push(line(fText, view.venue.name, 26, cx, 544, t.muted, maxW));
  parts.push(line(fText, `indahnya.my/${view.slug}`, 20, cx, 598, t.muted, maxW));

  const frame = t.ornament === 'filigree' || t.ornament === 'deco'
    ? `<rect x="24" y="24" width="${panelW - 48}" height="${H - 48}" fill="none" stroke="${t.accent}" stroke-width="1.5"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${t.bg}"/>${frame}${parts.join('')}</svg>`;
  const base = sharp(Buffer.from(svg));
  const out = photo ? base.composite([{ input: photo, left: W - 520, top: 0 }]) : base;
  return out.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
