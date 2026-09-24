import { describe, it, expect } from 'vitest';
import { planClocks, clockAnchor, offers, clocksAfterPayment, days } from '../server/utils/plans';

const D = (s: string) => new Date(s);
const base = { purgedAt: null, deletedAt: null };

describe('clocks start at the majlis, not at sign-up', () => {
  it('free event created two months early is still open on the day and 30 days after', () => {
    const created = D('2026-09-20T10:00:00Z');
    const majlis = D('2026-11-14T00:00:00Z');
    const c = planClocks('free', created, majlis);
    expect(c.uploadWindowEndsAt.getTime()).toBe(D('2026-11-15T00:00:00Z').getTime() + days(30));
    expect(c.storageEndsAt > majlis).toBe(true);
  });
  it('no date, or a date in the past: clocks run from now', () => {
    const now = D('2026-09-20T10:00:00Z');
    expect(clockAnchor(now, null)).toEqual(now);
    expect(clockAnchor(now, D('2026-01-01T00:00:00Z'))).toEqual(now);
  });
  it('a far-future date cannot buy more than 18 months of lead', () => {
    const now = D('2026-09-20T00:00:00Z');
    expect(clockAnchor(now, D('2099-01-01T00:00:00Z')).getTime()).toBe(now.getTime() + days(540));
  });
});

describe('offers', () => {
  const now = D('2026-12-01T00:00:00Z');
  it('free can buy either plan at full price', () => {
    expect(offers({ ...base, plan: 'free', date: null, uploadWindowEndsAt: now, storageEndsAt: D('2027-01-01T00:00:00Z') }, now))
      .toEqual([{ plan: 'std', kind: 'upgrade', cents: 5900 }, { plan: 'full', kind: 'upgrade', cents: 9900 }]);
  });
  it('std upgrades to full for the difference, and cannot rebuy std early', () => {
    expect(offers({ ...base, plan: 'std', date: null, uploadWindowEndsAt: now, storageEndsAt: D('2027-06-01T00:00:00Z') }, now))
      .toEqual([{ plan: 'full', kind: 'upgrade', cents: 4000 }]);
  });
  it('renewal opens in the last 30 days and in the grace month', () => {
    const soon = offers({ ...base, plan: 'full', date: null, uploadWindowEndsAt: now, storageEndsAt: D('2026-12-20T00:00:00Z') }, now);
    expect(soon).toEqual([{ plan: 'full', kind: 'renew', cents: 9900 }]);
    const grace = offers({ ...base, plan: 'std', date: null, uploadWindowEndsAt: now, storageEndsAt: D('2026-11-15T00:00:00Z') }, now);
    expect(grace).toEqual([{ plan: 'std', kind: 'renew', cents: 5900 }, { plan: 'full', kind: 'upgrade', cents: 4000 }]);
  });
  it('nothing for a purged or deleted event', () => {
    expect(offers({ ...base, purgedAt: now, plan: 'free', date: null, uploadWindowEndsAt: now, storageEndsAt: now }, now)).toEqual([]);
    expect(offers({ ...base, deletedAt: now, plan: 'free', date: null, uploadWindowEndsAt: now, storageEndsAt: now }, now)).toEqual([]);
  });
});

describe('clocks after payment never shrink', () => {
  const paid = D('2026-10-01T00:00:00Z');
  it('upgrade anchors on the majlis day when it is later', () => {
    const ev = { ...base, plan: 'free' as const, date: D('2026-12-01T00:00:00Z'), uploadWindowEndsAt: D('2027-01-01T00:00:00Z'), storageEndsAt: D('2027-01-01T00:00:00Z') };
    const c = clocksAfterPayment(ev, 'upgrade', 'std', paid);
    expect(c.storageEndsAt.getTime()).toBe(D('2026-12-02T00:00:00Z').getTime() + days(365));
  });
  it('std → full near expiry keeps the std anchor: RM40 never beats a RM59 renewal', () => {
    const stdPaid = D('2025-11-01T00:00:00Z');
    const ev = { ...base, plan: 'std' as const, date: null, planPaidAt: stdPaid, uploadWindowEndsAt: D('2026-05-03T00:00:00Z'), storageEndsAt: D('2026-11-01T00:00:00Z') };
    const up = clocksAfterPayment(ev, 'upgrade', 'full', D('2026-10-20T00:00:00Z'));
    expect(up.storageEndsAt.getTime()).toBe(stdPaid.getTime() + days(730));
    const renew = clocksAfterPayment(ev, 'renew', 'std', D('2026-10-20T00:00:00Z'));
    expect(renew.storageEndsAt.getTime()).toBe(D('2026-11-01T00:00:00Z').getTime() + days(365));
  });
  it('renewal continues from the end of storage, or from now in grace', () => {
    const ev = { ...base, plan: 'std' as const, date: null, uploadWindowEndsAt: D('2026-04-01T00:00:00Z'), storageEndsAt: D('2026-10-20T00:00:00Z') };
    expect(clocksAfterPayment(ev, 'renew', 'std', paid).storageEndsAt.getTime()).toBe(D('2026-10-20T00:00:00Z').getTime() + days(365));
    const lapsed = { ...ev, storageEndsAt: D('2026-09-15T00:00:00Z') };
    expect(clocksAfterPayment(lapsed, 'renew', 'std', paid).storageEndsAt.getTime()).toBe(paid.getTime() + days(365));
  });
});
