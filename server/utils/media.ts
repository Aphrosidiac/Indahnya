import type { media } from '../db';
import { presignGet, publicUrl, type Where } from './storage';

type Row = typeof media.$inferSelect;

/** Where a row's served copies live: public while ready, private otherwise. */
export const servedWhere = (status: Row['status']): Where => (status === 'ready' ? 'public' : 'private');

/** Readable URLs for a row: public ones for ready media, short-lived signed ones for everything the public cannot see. */
export async function mediaUrls(m: Pick<Row, 'status' | 'key' | 'midKey' | 'thumbKey' | 'posterKey'>) {
  const where = servedWhere(m.status);
  const url = (k: string | null) => (!k ? Promise.resolve(null) : where === 'public' ? Promise.resolve(publicUrl(k)) : presignGet(k, 'private'));
  const [u, mid, thumb, poster] = await Promise.all([url(m.key), url(m.midKey), url(m.thumbKey), url(m.posterKey)]);
  return { url: u, mid, thumb, poster };
}

/** A filename a host's laptop will like: the moment it was taken, the guest who took it. */
export function downloadName(m: Pick<Row, 'takenAt' | 'createdAt' | 'id'>, ext: string, guestName?: string | null) {
  // Malaysia time: a host reading "14-20-31" expects the photo from 2:20 p.m., not UTC's 06:20
  const stamp = new Date((m.takenAt ?? m.createdAt).getTime() + 8 * 3_600_000).toISOString().replace(/[:T]/g, '-').slice(0, 19);
  // letters in any script stay (陈美玲, Ñora); only what a filesystem dislikes goes
  const who = safeName(guestName ?? '');
  return `${stamp}${who ? `-${who}` : ''}-${m.id.slice(-6).toLowerCase()}.${ext}`;
}

export const extOf = (key: string) => (/\.([a-z0-9]{2,5})$/i.exec(key)?.[1] ?? 'bin').toLowerCase();

/** A person's name made safe for a filename: letters and digits of any script, spaces to dashes, nothing a filesystem refuses. */
export function safeName(name: string, max = 30) {
  return name.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\- ]+/gu, '').trim().replace(/\s+/g, '-').slice(0, max);
}

/** A zip part holds about this much: a dropped download costs one part, and every filesystem (FAT32 included) takes the file. */
export const ZIP_PART_BYTES = 2 * 1024 ** 3;

/**
 * Splits the download into parts by size, in upload order. Deterministic, so
 * the part list the dashboard shows and the part a link downloads agree.
 * A file bigger than a part gets a part of its own. Callers pass EVERY upload
 * row (whatever its status) and filter inside each part: a photo hidden or
 * deleted between downloading part 1 and part 2 then moves no boundary, so
 * nothing is skipped or repeated. Only new uploads (at the end) change the
 * last part.
 */
export function zipParts<T extends { bytes: number }>(rows: T[], limit = ZIP_PART_BYTES): T[][] {
  const parts: T[][] = [];
  let cur: T[] = [], size = 0;
  for (const r of rows) {
    if (cur.length && size + r.bytes > limit) { parts.push(cur); cur = []; size = 0; }
    cur.push(r); size += r.bytes;
  }
  if (cur.length) parts.push(cur);
  return parts;
}
