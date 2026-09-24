import type { media } from '../db';
import { presignGet, publicUrl, type Where } from './storage';

type Row = typeof media.$inferSelect;

/** Where a row's served copies live: public while ready, private otherwise. */
export const servedWhere = (status: Row['status']): Where => (status === 'ready' ? 'public' : 'private');

/** Readable URLs for a row: public ones for ready media, short-lived signed ones for everything the public cannot see. */
export async function mediaUrls(m: Pick<Row, 'status' | 'key' | 'thumbKey' | 'posterKey'>) {
  const where = servedWhere(m.status);
  const url = (k: string | null) => (!k ? Promise.resolve(null) : where === 'public' ? Promise.resolve(publicUrl(k)) : presignGet(k, 'private'));
  const [u, thumb, poster] = await Promise.all([url(m.key), url(m.thumbKey), url(m.posterKey)]);
  return { url: u, thumb, poster };
}

/** A filename a host's laptop will like: the moment it was taken, the guest who took it. */
export function downloadName(m: Pick<Row, 'takenAt' | 'createdAt' | 'id'>, ext: string, guestName?: string | null) {
  // Malaysia time: a host reading "14-20-31" expects the photo from 2:20 p.m., not UTC's 06:20
  const stamp = new Date((m.takenAt ?? m.createdAt).getTime() + 8 * 3_600_000).toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const who = (guestName ?? '').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 30);
  return `${stamp}${who ? `-${who}` : ''}-${m.id.slice(-6).toLowerCase()}.${ext}`;
}

export const extOf = (key: string) => (/\.([a-z0-9]{2,5})$/i.exec(key)?.[1] ?? 'bin').toLowerCase();
