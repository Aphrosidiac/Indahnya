import { z } from 'zod';
import type { events, kad as kadTable } from '../db';
import { PLANS } from './plans';
import { publicUrl } from './storage';
import { composeKad, type KadFieldsShape } from '../../shared/utils/kad-view';

/**
 * The e-kad's content. Stored in kad.fields; the template in kad.template.
 *
 * Text fields left `undefined` fall back to the default for the event's type
 * and language (see kadDefaults) — so a brand-new majlis already has a
 * complete, correct kad. An empty string means "hide this".
 *
 * Asset fields hold bucket keys, never URLs, and only keys under this
 * event's own `kad/` folder are accepted (checked in the PUT handler).
 */
const S = (n: number) => z.string().trim().max(n);
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Masa macam 11:00');
const Hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const Key = z.string().max(200);

export const KadFields = z.object({
  title: S(60).optional(),
  greeting: S(200).optional(),
  hosts: S(400).optional(),
  invite: S(700).optional(),
  fullNames: z.object({ a: S(100).optional(), b: S(100).optional() }).default({}),
  time: z.object({ start: HHMM.optional().or(z.literal('')), end: HHMM.optional().or(z.literal('')) }).default({}),
  aturcara: z.array(z.object({ time: S(20), item: S(140) })).max(20).default([]),
  doa: S(1500).optional(),
  dressCode: S(200).optional(),
  colours: z.array(Hex).max(5).default([]),
  contacts: z.array(z.object({ name: S(60).min(1), role: S(60).optional(), phone: z.string().trim().regex(/^\+?[\d\s-]{8,20}$/, 'Nombor telefon tak sah') })).max(8).default([]),
  gift: z.object({
    enabled: z.boolean().default(false),
    note: S(500).optional(),
    accounts: z.array(z.object({ bank: S(60).min(1), name: S(100).min(1), number: S(40).min(1) })).max(4).default([]),
    qrKey: Key.optional(),
  }).default({ enabled: false, accounts: [] }),
  photos: z.array(Key).max(12).default([]),
  coverKey: Key.optional(),
  music: z.object({ key: Key, title: S(100).optional() }).optional(),
  countdown: z.boolean().default(true),
});
export type KadFields = z.infer<typeof KadFields>;
// the zod schema and the shared shape must describe the same record
const _shape: KadFieldsShape = {} as KadFields; void _shape;

type Ev = typeof events.$inferSelect;
type KadRow = typeof kadTable.$inferSelect;

/** The keys a kad points at — for validation on save and for cleaning up what it no longer uses. */
export function kadKeys(f: KadFields) {
  return [...f.photos, f.coverKey, f.gift.qrKey, f.music?.key].filter((k): k is string => !!k);
}
/** What a host may upload for a kad, and how big. */
export const KAD_ASSET_TYPES = {
  photo: { types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'], max: 25 * 1024 * 1024 },
  qr: { types: ['image/jpeg', 'image/png', 'image/webp'], max: 10 * 1024 * 1024 },
  music: { types: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a', 'audio/wav', 'audio/x-wav', 'audio/ogg'], max: 20 * 1024 * 1024 },
} as const;

export const kadPrefix = (eventId: string) => `events/${eventId.toLowerCase()}/kad/`;

/** What a new kad says, by event type and language. Written the way a real kad in Malaysia reads. */
export function kadDefaults(ev: Pick<Ev, 'type' | 'names' | 'settings'>) {
  const en = ev.settings.locale === 'en';
  const couple = ev.type === 'kahwin';
  const title = en
    ? ({ kahwin: 'The Wedding of', aqiqah: 'Aqiqah', birthday: 'Birthday Celebration', corporate: 'You are invited', graduation: 'Graduation Celebration', lain: 'You are invited' } as const)[ev.type]
    : ({ kahwin: 'Walimatulurus', aqiqah: 'Majlis Aqiqah', birthday: 'Majlis Hari Jadi', corporate: 'Jemputan', graduation: 'Majlis Graduasi', lain: 'Jemputan' } as const)[ev.type];
  return {
    title,
    greeting: en ? 'With gratitude to the Almighty' : 'Assalamualaikum w.b.t. & Salam Sejahtera',
    hosts: '',
    invite: couple
      ? (en
        ? 'We joyfully invite you, together with your family, to the wedding reception of our children'
        : 'Dengan penuh kesyukuran, kami menjemput Dato\' | Datin | Tuan | Puan | Encik | Cik sekeluarga ke majlis perkahwinan anakanda kami')
      : (en ? 'We would be delighted to have you with us at' : 'Dengan segala hormatnya, kami menjemput Tuan | Puan | Encik | Cik sekeluarga ke'),
    // a doa only where one is customary; a birthday or a company dinner starts with none
    doa: ev.type === 'kahwin'
      ? (en
        ? 'May this union be blessed with love, patience and happiness, and may it bring the two families ever closer.'
        : 'Ya Allah, berkatilah majlis ini. Limpahkanlah rahmat dan kasih sayang kepada kedua mempelai, satukanlah hati mereka dalam kebaikan, dan kurniakanlah zuriat yang soleh dan solehah. Amin.')
      : ev.type === 'aqiqah'
        ? (en
          ? 'May this child grow in health and goodness, and be a joy to the family.'
          : 'Ya Allah, peliharalah anak ini. Jadikanlah dia anak yang soleh dan solehah, sihat, berakhlak mulia dan penyejuk mata ibu bapanya. Amin.')
        : '',
    giftNote: en
      ? 'Your presence is the greatest gift. If you wish to send a token of love, the details are below.'
      : 'Kehadiran korang dah cukup bermakna buat kami. Kalau nak beri hadiah tanda ingatan, maklumat di bawah.',
  };
}

/**
 * The kad as a guest's browser renders it: defaults filled in, keys turned
 * into public URLs, phone numbers into wa.me/tel links, maps links derived
 * from the address when the host gave none. (composeKad is shared with the
 * editor's live preview.)
 */
export function kadView(ev: Ev, row: Pick<KadRow, 'template' | 'fields'> | undefined) {
  const f = KadFields.parse(row?.fields ?? {});
  return composeKad(ev, row?.template ?? 'garden', f, kadDefaults(ev), publicUrl, !PLANS[ev.plan].badgeFree);
}
