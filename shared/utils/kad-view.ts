import { isKadTemplate, msisdn, type KadTemplate } from './kad-templates';

/**
 * The kad's stored shape (validated by zod on the server, server/utils/kad.ts)
 * and the ONE function that turns it into what a page renders. The public
 * page gets it from the server; the editor's live preview runs the same
 * function on the draft in the browser — so the preview cannot drift from
 * what guests will see.
 */
export interface KadFieldsShape {
  title?: string; greeting?: string; hosts?: string; invite?: string;
  fullNames: { a?: string; b?: string };
  time: { start?: string; end?: string };
  aturcara: { time: string; item: string }[];
  doa?: string; dressCode?: string; colours: string[];
  contacts: { name: string; role?: string; phone: string }[];
  gift: { enabled: boolean; note?: string; accounts: { bank: string; name: string; number: string }[]; qrKey?: string };
  photos: string[]; coverKey?: string;
  music?: { key: string; title?: string };
  countdown: boolean;
}

export interface KadDefaults { title: string; greeting: string; hosts: string; invite: string; doa: string; giftNote: string }

export interface KadEventShape {
  slug: string; type: string; date: string | Date | null;
  names: { a: string; b?: string };
  venue: { name?: string; address?: string; waze?: string; gmaps?: string };
  settings: { locale: 'ms' | 'en'; modules: { gambar: boolean } };
}

const fill = (v: string | undefined, d: string) => (v === undefined ? d : v);

export function composeKad(ev: KadEventShape, template: string, f: KadFieldsShape, d: KadDefaults, url: (key: string) => string, badge: boolean) {
  const address = [ev.venue.name, ev.venue.address].filter(Boolean).join(', ');
  const q = encodeURIComponent(address);
  return {
    slug: ev.slug,
    template: (isKadTemplate(template) ? template : 'garden') as KadTemplate,
    locale: ev.settings.locale,
    type: ev.type,
    names: ev.names,
    fullNames: { a: f.fullNames.a || ev.names.a, b: f.fullNames.b || ev.names.b || '' },
    title: fill(f.title, d.title),
    greeting: fill(f.greeting, d.greeting),
    hosts: fill(f.hosts, d.hosts),
    invite: fill(f.invite, d.invite),
    doa: fill(f.doa, d.doa),
    dressCode: f.dressCode ?? '',
    colours: f.colours,
    date: ev.date ? new Date(ev.date).toISOString() : null,
    time: { start: f.time.start || '', end: f.time.end || '' },
    venue: {
      name: ev.venue.name ?? '', address: ev.venue.address ?? '',
      waze: ev.venue.waze || (address ? `https://waze.com/ul?q=${q}&navigate=yes` : ''),
      gmaps: ev.venue.gmaps || (address ? `https://www.google.com/maps/search/?api=1&query=${q}` : ''),
    },
    aturcara: f.aturcara.filter(a => a.item),
    contacts: f.contacts.filter(c => c.name && c.phone).map(c => ({ ...c, wa: `https://wa.me/${msisdn(c.phone)}`, tel: `tel:+${msisdn(c.phone)}` })),
    gift: f.gift.enabled && (f.gift.accounts.length || f.gift.qrKey)
      ? { note: fill(f.gift.note, d.giftNote), accounts: f.gift.accounts.filter(a => a.number), qr: f.gift.qrKey ? url(f.gift.qrKey) : null }
      : null,
    photos: f.photos.map(url),
    cover: f.coverKey ? url(f.coverKey) : null,
    music: f.music ? { url: url(f.music.key), title: f.music.title ?? '' } : null,
    countdown: f.countdown && !!ev.date,
    badge,
    gambar: ev.settings.modules.gambar,
  };
}
export type KadView = ReturnType<typeof composeKad>;

/**
 * The majlis start as an instant: the stored date is midnight UTC of the
 * calendar day, the time is Malaysian wall clock (UTC+8, no DST).
 */
export function kadStart(date: string | Date | null, start: string) {
  if (!date) return null;
  const day = new Date(date).getTime();
  const m = /^(\d{2}):(\d{2})$/.exec(start);
  const minutes = m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  return new Date(day + minutes * 60_000 - 8 * 3_600_000);
}
