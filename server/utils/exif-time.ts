/**
 * EXIF `DateTimeOriginal` is a wall-clock time with no zone ("2026:11:14
 * 14:03:22"). Newer phones add `OffsetTimeOriginal` ("+08:00"); older ones
 * do not, and then the only honest guess for a Malaysian majlis is MYT.
 * Letting the parser read it in the SERVER's zone (UTC on the VPS) put
 * every photo eight hours late.
 */
export function exifMoment(raw: { DateTimeOriginal?: unknown; CreateDate?: unknown; OffsetTimeOriginal?: unknown; OffsetTime?: unknown } | null | undefined, fallbackOffset = '+08:00'): Date | null {
  const v = raw?.DateTimeOriginal ?? raw?.CreateDate;
  if (typeof v !== 'string') return null;
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(v.trim());
  if (!m) return null;
  const off = [raw?.OffsetTimeOriginal, raw?.OffsetTime].find((o): o is string => typeof o === 'string' && /^[+-]\d{2}:\d{2}$/.test(o.trim()))?.trim() ?? fallbackOffset;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${off}`);
  // camera clocks left at 2000-01-01 are not a moment worth sorting by
  return Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2005 ? null : d;
}
