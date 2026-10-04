import QRCode from 'qrcode';

/**
 * Indahnya's QR: the brand mark at scale. The three finder patterns are the
 * Mekar mark's rounded eyes, the data modules are plain cells (anything
 * softer read worse below ~2.5px a module), and the middle carries the bloom
 * on a clear patch. Error correction H (30%) pays for the patch (about 6% of the area)
 * many times over; every size we print was checked against a real decoder
 * (zxing) before this shipped.
 *
 * Pure string out, so the server (print, PNG), the landing and the editor
 * all draw the same thing. The QR itself is always ink on a light panel:
 * scanners need contrast more than they need a theme.
 */
export interface QrArtOptions {
  /** module colour */ ink?: string;
  /** panel colour (keep it light) */ paper?: string;
  /** the bloom's petals */ accent?: string;
  /** draw the bloom in the middle */ logo?: boolean;
  /** quiet zone, in modules */ margin?: number;
  /** transparent panel (when the stand draws its own) */ transparent?: boolean;
}

export function qrModules(text: string, ec: 'M' | 'H' = 'H') {
  const q = QRCode.create(text, { errorCorrectionLevel: ec });
  return { size: q.modules.size as number, dark: (r: number, c: number) => !!q.modules.data[r * q.modules.size + c] };
}

/** The bloom's clear patch, in modules: odd, so it sits on the centre module. */
export function logoPatch(size: number) {
  let n = Math.round(size * 0.2);
  if (n % 2 === 0) n++;
  const start = (size - n) / 2;
  return { start, n };
}

const isFinder = (r: number, c: number, size: number) =>
  (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

export function qrArt(text: string, o: QrArtOptions = {}) {
  const ink = o.ink ?? '#1a1a1a', paper = o.paper ?? '#ffffff', accent = o.accent ?? '#7dd56f';
  const logo = o.logo ?? true, m = o.margin ?? 2;
  const { size, dark } = qrModules(text, logo ? 'H' : 'M');
  const patch = logoPatch(size);
  const inPatch = (r: number, c: number) => logo && r >= patch.start - 0.5 && r < patch.start + patch.n + 0.5 && c >= patch.start - 0.5 && c < patch.start + patch.n + 0.5;
  const W = size + m * 2;
  let mods = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!dark(r, c) || isFinder(r, c, size) || inPatch(r, c)) continue;
      // full cells: soft or gapped modules read worse below ~2.5px a module; the brand is in the eyes and the bloom
      mods += `M${c + m},${r + m}h1v1h-1z`;
    }
  }
  // a hair of stroke closes the seams anti-aliasing leaves between touching cells
  const soft = `<path d="${mods}" fill="${ink}" stroke="${ink}" stroke-width="0.04"/>`;
  const eye = (x: number, y: number) => {
    x += m; y += m;
    // the Mekar eye: a 7-module ring with its corners rounded (kept modest so the 1:1:3:1:1 ratio a
    // scanner looks for survives at small sizes), a 3-module pupil
    const R = 1.5, r = 0.6;
    return `<path fill-rule="evenodd" fill="${ink}" d="M${x + R},${y}h${7 - 2 * R}a${R},${R} 0 0 1 ${R},${R}v${7 - 2 * R}a${R},${R} 0 0 1 -${R},${R}h-${7 - 2 * R}a${R},${R} 0 0 1 -${R},-${R}v-${7 - 2 * R}a${R},${R} 0 0 1 ${R},-${R}z M${x + 1 + r},${y + 1}h${5 - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${5 - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${5 - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${5 - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z"/>`
      + `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.8" fill="${ink}"/>`;
  };
  const eyes = eye(0, 0) + eye(size - 7, 0) + eye(0, size - 7);
  let bloom = '';
  if (logo) {
    const cx = m + size / 2, cy = cx, s = patch.n;
    const pr = s * 0.19, off = s * 0.2;
    bloom = `<rect x="${m + patch.start - 0.15}" y="${m + patch.start - 0.15}" width="${s + 0.3}" height="${s + 0.3}" rx="${s * 0.22}" fill="${paper}"/>`
      + [[0, -off], [0, off], [-off, 0], [off, 0]].map(([dx, dy]) => `<circle cx="${cx + dx!}" cy="${cy + dy!}" r="${pr}" fill="${accent}"/>`).join('')
      + `<circle cx="${cx}" cy="${cy}" r="${pr * 0.48}" fill="${ink}"/>`;
  }
  const panel = o.transparent ? '' : `<rect width="${W}" height="${W}" rx="${m * 0.9}" fill="${paper}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" shape-rendering="geometricPrecision">${panel}${soft}${eyes}${bloom}</svg>`;
}

export const qrArtDataUrl = (text: string, o?: QrArtOptions) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrArt(text, o))}`;
