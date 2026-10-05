import { describe, it, expect } from 'vitest';
import { heifDeclaredPixels } from '../server/utils/heic';
import { contentDisposition } from '../server/utils/disposition';
import { zipParts, safeName, downloadName } from '../server/utils/media';
import { purgeDue, renewable } from '../server/utils/retention';
import { offers, days } from '../server/utils/plans';
import type { EventSettings } from '../server/db/schema';

const D = (s: string) => new Date(s);
const settings = (x: Partial<EventSettings> = {}) => ({ locale: 'ms', approvalMode: false, modules: { gambar: true, ucapan: true, rsvp: true, tempat: false, kad: true }, slideshow: { intervalSec: 7, showNames: true, shuffle: false }, guestDeleteHours: 24, ...x }) as EventSettings;

/** A minimal HEIF meta fragment: one `ispe` box declaring w × h. */
function ispe(w: number, h: number) {
  const b = Buffer.alloc(20);
  b.writeUInt32BE(20, 0); b.write('ispe', 4, 'ascii'); b.writeUInt32BE(0, 8); b.writeUInt32BE(w, 12); b.writeUInt32BE(h, 16);
  return b;
}

describe('HEIC is sized before it is decoded', () => {
  it('reads the largest declared image', () => {
    const file = Buffer.concat([Buffer.from('....ftypheic'), ispe(512, 512), ispe(4032, 3024), Buffer.alloc(64)]);
    expect(heifDeclaredPixels(file)).toBe(4032 * 3024);
  });
  it('a crafted 30,000 × 30,000 declaration is visible before any pixel is allocated', () => {
    expect(heifDeclaredPixels(Buffer.concat([ispe(30_000, 30_000), Buffer.alloc(32)]))).toBe(900_000_000);
  });
  it('no ispe box: unknown, not zero', () => {
    expect(heifDeclaredPixels(Buffer.alloc(200))).toBeNull();
  });
});

describe('download filenames', () => {
  it('keeps the real name in filename* and an ASCII fallback', () => {
    const h = contentDisposition('indahnya-陈美玲-ñora.zip');
    expect(h).toMatch(/^attachment; filename="indahnya--nora\.zip"; filename\*=UTF-8''/);
    expect(decodeURIComponent(h.split("UTF-8''")[1]!)).toBe('indahnya-陈美玲-ñora.zip');
  });
  it('cannot be broken out of with quotes or newlines', () => {
    expect(contentDisposition('a"b\r\nSet-Cookie: x.zip', 'inline')).not.toMatch(/[\r\n]|"b/);
  });
  it('guest names in any script survive into zip entries', () => {
    expect(safeName('陈美玲 (Mak Andak)')).toBe('陈美玲-Mak-Andak');
    expect(downloadName({ id: '01ABCDEFGHJKMNPQRSTVWXYZ12', takenAt: D('2026-12-12T06:20:31Z'), createdAt: D('2026-12-12T06:21:00Z') }, 'jpg', 'Ñora')).toBe('2026-12-12-14-20-31-Ñora-wxyz12.jpg');
  });
});

describe('zip parts', () => {
  const G = 1024 ** 3;
  it('splits by size in order, and agrees with itself', () => {
    const rows = [0.9, 0.9, 0.9, 0.5, 3, 0.1].map((g, i) => ({ i, bytes: g * G }));
    const parts = zipParts(rows, 2 * G);
    expect(parts.map(p => p.map(r => r.i))).toEqual([[0, 1], [2, 3], [4], [5]]);
    expect(zipParts(rows, 2 * G)).toEqual(parts);
  });
  it('an empty majlis is no parts', () => { expect(zipParts([])).toEqual([]); });
});

describe('purge is due only when it should be', () => {
  const end = D('2027-01-01T00:00:00Z');
  const ev = (x: object = {}) => ({ storageEndsAt: end, settings: settings(), deletedAt: null, purgedAt: null, purgeAfter: null, ...x });
  it('not inside the grace month', () => {
    expect(purgeDue(ev(), end.getTime() + days(29)).due).toBe(false);
  });
  it('not until the final warning has been out for 7 days', () => {
    const warned = settings({ finalWarningAt: new Date(end.getTime() + days(28)).toISOString() });
    expect(purgeDue(ev({ settings: warned }), end.getTime() + days(31)).due).toBe(false);
    expect(purgeDue(ev({ settings: warned }), end.getTime() + days(35)).due).toBe(true);
  });
  it('never warned: waits, then purges at the hard stop and says so', () => {
    expect(purgeDue(ev(), end.getTime() + days(40)).due).toBe(false);
    expect(purgeDue(ev(), end.getTime() + days(45))).toEqual({ due: true, unwarned: true });
  });
  it('a deleted majlis waits out its undo window', () => {
    const after = D('2026-10-12T00:00:00Z');
    const del = ev({ storageEndsAt: D('2030-01-01T00:00:00Z'), deletedAt: D('2026-10-05T00:00:00Z'), purgeAfter: after });
    expect(purgeDue(del, after.getTime() - 1000).due).toBe(false);
    expect(purgeDue(del, after.getTime()).due).toBe(true);
  });
  it('the sample gallery and the sandbox are never purged', () => {
    expect(purgeDue(ev({ settings: settings({ demo: true }) }), end.getTime() + days(400)).due).toBe(false);
  });
});

describe('nothing is sold that cannot be delivered', () => {
  const end = D('2027-01-01T00:00:00Z');
  const paid = { plan: 'std' as const, date: null, uploadWindowEndsAt: end, storageEndsAt: end, purgedAt: null, deletedAt: null, settings: settings() };
  it('a renewal is on offer in the grace month', () => {
    expect(offers(paid, new Date(end.getTime() + days(10))).map(o => o.kind)).toContain('renew');
  });
  it('but not once the purge is due, or within two hours of it', () => {
    expect(offers(paid, new Date(end.getTime() + days(46)))).toEqual([]);
    expect(renewable(paid, end.getTime() + days(45) - 3_600_000)).toBe(false);
  });
  it('nor after the purge has begun', () => {
    expect(offers({ ...paid, purgeStartedAt: new Date() }, new Date(end.getTime() + days(10)))).toEqual([]);
  });
  it('a payment that landed before the purge began is judged without the selling margin', () => {
    const t = new Date(end.getTime() + days(45) - 3_600_000);
    expect(offers(paid, t)).toEqual([]);
    expect(offers(paid, t, { applying: true }).map(o => o.kind)).toContain('renew');
  });
});

describe('review follow-ups', () => {
  const end = D('2027-01-01T00:00:00Z');
  const ev = (x: object = {}) => ({ storageEndsAt: end, settings: settings(), deletedAt: null, purgedAt: null, purgeAfter: null, ...x });
  it('a final warning sent late (day 40) is honoured in full: no purge at the day-45 hard stop', () => {
    const late = settings({ finalWarningAt: new Date(end.getTime() + days(40)).toISOString() });
    expect(purgeDue(ev({ settings: late }), end.getTime() + days(45)).due).toBe(false);
    expect(purgeDue(ev({ settings: late }), end.getTime() + days(47)).due).toBe(true);
  });
  it('the dev /media route is refused as a media domain, media.indahnya.my is not', () => {
    const bad = (u: string) => /^\/media(\/|$)/.test(new URL(u).pathname);
    expect(bad('https://media.indahnya.my')).toBe(false);
    expect(bad('http://localhost:3180/media')).toBe(true);
  });
  it('zip boundaries do not move when a photo in an early part is deleted', () => {
    const G = 1024 ** 3;
    const rows = [1, 0.9, 0.5, 1.5, 0.4].map((g, i) => ({ i, bytes: g * G, status: 'ready' }));
    const before = zipParts(rows, 2 * G).map(p => p.map(r => r.i));
    rows[1]!.status = 'deleted';
    expect(zipParts(rows, 2 * G).map(p => p.map(r => r.i))).toEqual(before);
  });
});
