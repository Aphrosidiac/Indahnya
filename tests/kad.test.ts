import { describe, it, expect } from 'vitest';
import { kadTime, msisdn, KAD_THEMES, KAD_TEMPLATES } from '../shared/utils/kad-templates';
import { composeKad, kadStart } from '../shared/utils/kad-view';
import { KadFields, kadDefaults } from '../server/utils/kad';

const ev = {
  slug: 'aina-hakim', type: 'kahwin', date: '2026-11-14T00:00:00.000Z',
  names: { a: 'Aina', b: 'Hakim' }, venue: { name: 'Dewan Seri Melati', address: 'Shah Alam' },
  settings: { locale: 'ms' as const, modules: { gambar: true } },
};
const defaults = kadDefaults({ type: 'kahwin', names: ev.names, settings: { locale: 'ms' } as never });

describe('kad wording and numbers', () => {
  it('writes times the way a kad does', () => {
    expect(kadTime('11:00')).toBe('11.00 pagi');
    expect(kadTime('12:30')).toBe('12.30 tengah hari');
    expect(kadTime('14:00')).toBe('2.00 petang');
    expect(kadTime('20:15')).toBe('8.15 malam');
    expect(kadTime('00:05', 'en')).toBe('12:05 AM');
    expect(kadTime('nope')).toBe('');
  });
  it('turns Malaysian phone numbers into wa.me numbers', () => {
    expect(msisdn('012-345 6789')).toBe('60123456789');
    expect(msisdn('+60 19-876 5432')).toBe('60198765432');
    expect(msisdn('60123456789')).toBe('60123456789');
  });
  it('starts the countdown at Malaysian wall-clock time', () => {
    expect(kadStart(ev.date, '11:00')?.toISOString()).toBe('2026-11-14T03:00:00.000Z');
    expect(kadStart(ev.date, '')?.toISOString()).toBe('2026-11-13T16:00:00.000Z');
    expect(kadStart(null, '11:00')).toBeNull();
  });
  it('every template has every colour and font the page and the preview image need', () => {
    for (const k of KAD_TEMPLATES) {
      const t = KAD_THEMES[k];
      for (const c of [t.bg, t.band, t.ink, t.muted, t.accent, t.onAccent]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.og.names && t.og.text && t.og.textBold).toBeTruthy();
    }
  });
});

describe('composeKad', () => {
  const url = (k: string) => `https://media.example/${k}`;
  it('a brand-new kad is complete from the event alone', () => {
    const v = composeKad(ev, 'garden', KadFields.parse({}), defaults, url, true);
    expect(v.title).toBe('Walimatulurus');
    expect(v.fullNames).toEqual({ a: 'Aina', b: 'Hakim' });
    expect(v.venue.waze).toContain('waze.com/ul?q=Dewan%20Seri%20Melati');
    expect(v.gift).toBeNull();
    expect(v.countdown).toBe(true);
  });
  it('an empty string hides a default; undefined keeps it', () => {
    const v = composeKad(ev, 'garden', KadFields.parse({ doa: '', greeting: undefined }), defaults, url, true);
    expect(v.doa).toBe('');
    expect(v.greeting).toBe(defaults.greeting);
  });
  it('the gift only shows when it has something to show', () => {
    expect(composeKad(ev, 'garden', KadFields.parse({ gift: { enabled: true, accounts: [] } }), defaults, url, true).gift).toBeNull();
    const g = composeKad(ev, 'garden', KadFields.parse({ gift: { enabled: true, accounts: [{ bank: 'Maybank', name: 'Aina', number: '123' }] } }), defaults, url, true).gift;
    expect(g?.accounts).toHaveLength(1);
    expect(g?.note).toBe(defaults.giftNote);
  });
  it('an unknown template falls back to garden', () => {
    expect(composeKad(ev, 'rococo', KadFields.parse({}), defaults, url, true).template).toBe('garden');
  });
  it('the schema refuses a phone that is not a phone and a time that is not a time', () => {
    expect(KadFields.safeParse({ contacts: [{ name: 'A', phone: 'call me' }] }).success).toBe(false);
    expect(KadFields.safeParse({ time: { start: '25:00' } }).success).toBe(false);
  });
});

describe('OG renderer', () => {
  it('draws Latin names and skips a line its fonts cannot draw, without throwing', async () => {
    const { renderKadOg } = await import('../server/utils/kad-og');
    const { readFileSync } = await import('node:fs');
    const load = async (f: string) => readFileSync(`server/assets/fonts/${f}`);
    const url = (k: string) => k;
    const latin = composeKad(ev, 'garden', KadFields.parse({}), defaults, url, true);
    const cjk = composeKad({ ...ev, names: { a: '李明', b: '王芳' } }, 'emas', KadFields.parse({}), defaults, url, true);
    const [a, b] = await Promise.all([renderKadOg(latin, null, load), renderKadOg(cjk, null, load)]);
    for (const buf of [a, b]) expect(buf.subarray(0, 2).toString('hex')).toBe('ffd8'); // a JPEG
  });
});
