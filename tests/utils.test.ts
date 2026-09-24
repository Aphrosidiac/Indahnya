import { describe, it, expect } from 'vitest';
import { safeNext } from '../shared/utils/safe-next';
import { isBuilt } from '../shared/utils/modules';
import { exifMoment } from '../server/utils/exif-time';
import { parseEventDate } from '../server/utils/dates';
import { slugify } from '../server/utils/slug';
import { escapeHtml } from '../server/utils/html';
import { downloadName } from '../server/utils/media';

describe('safeNext', () => {
  it.each(['/app', '/app/01ABC/gambar?x=1'])('keeps a local path %s', v => expect(safeNext(v)).toBe(v));
  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '', null, 42, '/a\nb'])('rejects %s', v => expect(safeNext(v)).toBe('/app'));
});

describe('exifMoment', () => {
  it('reads a naive EXIF time as Malaysia time', () => {
    expect(exifMoment({ DateTimeOriginal: '2026:11:14 14:03:22' })?.toISOString()).toBe('2026-11-14T06:03:22.000Z');
  });
  it('honours an explicit offset', () => {
    expect(exifMoment({ DateTimeOriginal: '2026:11:14 14:03:22', OffsetTimeOriginal: '+07:00' })?.toISOString()).toBe('2026-11-14T07:03:22.000Z');
  });
  it('ignores junk and factory-reset clocks', () => {
    expect(exifMoment({ DateTimeOriginal: '0000:00:00 00:00:00' })).toBeNull();
    expect(exifMoment({ DateTimeOriginal: '2000:01:01 00:00:00' })).toBeNull();
    expect(exifMoment(null)).toBeNull();
  });
});

describe('parseEventDate', () => {
  it('stores the calendar day as midnight UTC whatever the input shape', () => {
    expect(parseEventDate('2026-11-14')?.toISOString()).toBe('2026-11-14T00:00:00.000Z');
    expect(parseEventDate('2026-11-14T00:00:00.000Z')?.toISOString()).toBe('2026-11-14T00:00:00.000Z');
    expect(parseEventDate(null)).toBeNull();
  });
  it('refuses nonsense', () => {
    expect(() => parseEventDate('soon')).toThrow();
    expect(() => parseEventDate('1900-01-01')).toThrow();
  });
});

describe('small helpers', () => {
  it('slugify', () => expect(slugify('Aina & Hakim')).toBe('aina-dan-hakim'));
  it('escapeHtml', () => expect(escapeHtml('<b>"Aina" & Hakim</b>')).toBe('&lt;b&gt;&quot;Aina&quot; &amp; Hakim&lt;/b&gt;'));
  it('isBuilt', () => { expect(isBuilt('gambar')).toBe(true); expect(isBuilt('rsvp')).toBe(false); });
  it('downloadName is Malaysia time and filesystem-safe', () => {
    const n = downloadName({ id: '01M391582T404GKCJ3MQSDKX93', takenAt: new Date('2026-11-14T06:03:22Z'), createdAt: new Date() }, 'jpg', 'Makcik Ros / "Team"');
    expect(n).toBe('2026-11-14-14-03-22-Makcik-Ros-Team-sdkx93.jpg');
  });
});
