"""
The Indahnya brand, drawn from source: the Mekar mark (a QR whose fourth
corner blooms) and the wordmark "indahnya" in Bricolage Grotesque, its i
dotted with a kerawang flower. The wordmark is outlined from the font
itself, pinned at the weight and optical size the landing uses, so it is
the same in the app, the social card and print without loading a font.

Writes brand/*.svg (the kit), app/ui/brand-art.ts (the paths the Logo
component draws) and brand/og-overlay.svg (scripts/build-assets.mjs lays
it over a photo).

    python3 scripts/build-brand.py && node scripts/build-assets.mjs
"""
import io, math, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2')
INK, GREEN, PAPER, NIGHT = '#1a1a1a', '#7dd56f', '#fdfcfb', '#f3f1ee'
WGHT, OPSZ, TRACK = 660, 96, -0.05

def instance(wght=WGHT, opsz=OPSZ):
    f = TTFont(FONT)
    f.flavor = None
    return instantiateVariableFont(f, {'wght': wght, 'opsz': opsz})

def outline(font, text, track=TRACK):
    """SVG path of `text`, baseline at y=0, y pointing down, in font units; plus advance and bounds."""
    gs, hmtx, cmap = font.getGlyphSet(), font['hmtx'], font.getBestCmap()
    upm = font['head'].unitsPerEm
    pen = SVGPathPen(gs)
    x, marks = 0.0, []
    for ch in text:
        name = cmap[ord(ch)]
        tp = TransformPen(pen, (1, 0, 0, -1, x, 0))
        gs[name].draw(tp)
        bp = BoundsPen(gs); gs[name].draw(bp)
        marks.append((ch, x, bp.bounds))
        x += hmtx[name][0] + track * upm
    x -= track * upm
    return pen.getCommands(), x, marks, upm

def flower(cx, cy, s, fill, seed):
    """The kerawang four-petal flower, centred, s = its width."""
    k = s / 64
    L, w = 26 * k, 13 * k
    p = (f'M{cx:.1f},{cy:.1f} C {cx - w:.1f},{cy - L * 0.35:.1f} {cx - w * 0.8:.1f},{cy - L * 0.85:.1f} {cx:.1f},{cy - L:.1f} '
         f'C {cx + w * 0.8:.1f},{cy - L * 0.85:.1f} {cx + w:.1f},{cy - L * 0.35:.1f} {cx:.1f},{cy:.1f} Z')
    out = ''.join(f'<path d="{p}" fill="{fill}" transform="rotate({a} {cx:.1f} {cy:.1f})"/>' for a in (0, 90, 180, 270))
    out += ''.join(f'<circle cx="{cx + 15 * k * math.cos(math.radians(a)):.1f}" cy="{cy + 15 * k * math.sin(math.radians(a)):.1f}" r="{3 * k:.1f}" fill="{fill}"/>' for a in (45, 135, 225, 315))
    return out + f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{4.6 * k:.1f}" fill="{seed}"/>'

# ── the mark, on a 64 grid ──────────────────────────────────────────────
def ring(x, y, s=26, r=7, t=5, ri=4):
    si = s - 2 * t
    return (f'M{x + r},{y} h{s - 2 * r} a{r},{r} 0 0 1 {r},{r} v{s - 2 * r} a{r},{r} 0 0 1 -{r},{r} h-{s - 2 * r} a{r},{r} 0 0 1 -{r},-{r} v-{s - 2 * r} a{r},{r} 0 0 1 {r},-{r} z '
            f'M{x + t + ri},{y + t} h{si - 2 * ri} a{ri},{ri} 0 0 1 {ri},{ri} v{si - 2 * ri} a{ri},{ri} 0 0 1 -{ri},{ri} h-{si - 2 * ri} a{ri},{ri} 0 0 1 -{ri},-{ri} v-{si - 2 * ri} a{ri},{ri} 0 0 1 {ri},-{ri} z')
EYES = ' '.join(ring(x, y) + f' M{x + 11.5},{y + 9} h3 a2.5,2.5 0 0 1 2.5,2.5 v3 a2.5,2.5 0 0 1 -2.5,2.5 h-3 a2.5,2.5 0 0 1 -2.5,-2.5 v-3 a2.5,2.5 0 0 1 2.5,-2.5 z' for x, y in ((4, 4), (34, 4), (4, 34)))
BLOOM = [(47, 40.4), (47, 53.6), (40.4, 47), (53.6, 47)]

def mark(ink=INK, petal=GREEN, centre=None):
    centre = centre or ink
    return (f'<path fill-rule="evenodd" fill="{ink}" d="{EYES}"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="6.4" fill="{petal}"/>' for x, y in BLOOM)
            + f'<circle cx="47" cy="47" r="3.1" fill="{centre}"/>')

def svg(w, h, body, vb=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}" width="{w}" height="{h}">{body}</svg>\n'

# ── the wordmark ────────────────────────────────────────────────────────
font = instance()
path, adv, marks, upm = outline(font, 'ındahnya')
os2 = font['OS/2']
xh, desc = os2.sxHeight, -font['hhea'].descent
i_ch, i_x, (ix0, _, ix1, _) = marks[0]
stem_cx = i_x + (ix0 + ix1) / 2
fs = 0.42 * upm                                # the flower: a little wider than the stem is tall above x-height
f_cy = -(xh + 0.035 * upm + fs * 0.5)         # sits a breath above the x-height, like a dot
top = f_cy - fs * 0.5 - 4
bottom = desc + 4
left = min(0.0, stem_cx - fs * 0.5) - 4        # the flower is wider than the i, so it reaches past it
W, H = adv - left, bottom - top

def wordmark(colour, seed=None, petal=GREEN):
    return f'<path d="{path}" fill="{colour}"/>' + flower(stem_cx, f_cy, fs, petal, seed or colour)

vb = f'{left:.0f} {top:.0f} {W:.0f} {H:.0f}'
os.makedirs(os.path.join(ROOT, 'brand'), exist_ok=True)
def write(name, text):
    with open(os.path.join(ROOT, 'brand', name), 'w') as fh: fh.write(text)

write('indahnya-mark.svg', svg(64, 64, mark()))
write('indahnya-mark-on-dark.svg', svg(64, 64, mark(ink=NIGHT)))
write('indahnya-mark-mono.svg', svg(64, 64, mark(ink=INK, petal=INK, centre=PAPER)))
write('indahnya-icon.svg', svg(64, 64, f'<rect width="64" height="64" rx="15" fill="{GREEN}"/><g transform="translate(9 9) scale(.72)">{mark(ink=INK, petal=INK, centre=GREEN)}</g>'))
write('indahnya-wordmark.svg', svg(round(W / 10), round(H / 10), wordmark(INK), vb))
write('indahnya-wordmark-on-dark.svg', svg(round(W / 10), round(H / 10), wordmark(NIGHT), vb))

# the lockup: the mark stands on the baseline, as tall as an ascender, a third of itself away
mh = 0.82 * upm
gap = mh * 0.22
lock_w = mh + gap + adv - left
lx = mh + gap - left            # where the wordmark's origin lands
def lockup(colour, ink):
    return (f'<g transform="translate(0 {-mh:.1f}) scale({mh / 64:.4f})">{mark(ink=ink)}</g>'
            f'<g transform="translate({lx:.1f} 0)">{wordmark(colour)}</g>')
lvb = f'0 {top:.0f} {lock_w:.0f} {H:.0f}'
write('indahnya-lockup.svg', svg(round(lock_w / 10), round(H / 10), lockup(INK, INK), lvb))
write('indahnya-lockup-on-dark.svg', svg(round(lock_w / 10), round(H / 10), lockup(NIGHT, NIGHT), lvb))

# ── the social card's words, outlined in the same face ──────────────────
h1a, a1, _, _ = outline(font, 'Semua gambar majlis.', -0.045)
h1b, a2, _, _ = outline(font, 'Satu QR.', -0.045)
OW, OH = 1200, 630
k = 92 / upm  # headline size, px
wk = 70 / upm  # wordmark size, px per em
og = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{OW}" height="{OH}">'
      f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.66"/></linearGradient></defs>'
      f'<rect width="{OW}" height="{OH}" fill="url(#g)"/>'
      f'<g transform="translate(72 {64 + 1.02 * upm * wk:.1f}) scale({wk:.4f})">{lockup("#ffffff", "#ffffff")}</g>'
      f'<g transform="translate(72 462) scale({k:.4f})"><path d="{h1a}" fill="#ffffff"/></g>'
      f'<g transform="translate(72 556) scale({k:.4f})"><path d="{h1b}" fill="#ffffff"/></g>'
      f'</svg>')
write('og-overlay.svg', og)

# ── what the Logo component draws ───────────────────────────────────────
ts = f'''/**
 * Generated by scripts/build-brand.py from Bricolage Grotesque ({WGHT}, opsz {OPSZ}).
 * Do not edit by hand: change the script and run it again.
 */
export const MARK_EYES = '{EYES}';
export const MARK_BLOOM = {[list(p) for p in BLOOM]} as const;
export const WORDMARK = {{
  viewBox: '{vb}',
  /** height / width, for sizing */
  ratio: {H / W:.5f},
  /** the ink, minus the i's dot */
  path: '{path}',
  /** the kerawang flower that dots the i: centre and width, in the same units */
  flower: {{ cx: {stem_cx:.1f}, cy: {f_cy:.1f}, s: {fs:.1f} }},
  /** the flower as SVG: petals in the brand green (or currentColor when mono), its seed in currentColor */
  flowerSvg: '{flower(stem_cx, f_cy, fs, "{P}", "currentColor")}',
  /** x-height and em, in the same units; the lockup's mark is {mh / upm:.2f}em tall, {gap / upm:.2f}em from the flower */
  xHeight: {xh}, unitsPerEm: {upm}, markEm: {mh / upm:.3f}, gapEm: {gap / upm:.3f},
}} as const;
/** mark + wordmark, in wordmark units: the mark stands on the baseline */
export const LOCKUP = {{
  viewBox: '0 {top:.0f} {lock_w:.0f} {H:.0f}',
  ratio: {H / lock_w:.5f},
  markTransform: 'translate(0 {-mh:.1f}) scale({mh / 64:.4f})',
  wordX: {lx:.1f},
  /** lockup height per px of mark height */
  perMark: {H / mh:.5f},
}} as const;
'''
with open(os.path.join(ROOT, 'app/ui/brand-art.ts'), 'w') as fh: fh.write(ts)


print(f'wordmark {W:.0f}x{H:.0f} units, flower at ({stem_cx:.0f},{f_cy:.0f}) size {fs:.0f}; upm {upm}, x-height {xh}')
