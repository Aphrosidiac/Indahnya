/**
 * The LOCAL calendar day, as `YYYY-MM-DD`.
 *
 * `new Date().toISOString().slice(0, 10)` is the tempting version and it is
 * WRONG in Malaysia. `toISOString()` renders UTC, and UTC+8 means every moment
 * between midnight and 8am local still belongs to yesterday's UTC date — so for
 * eight hours of every day the diary opened on yesterday, the "Today" button
 * re-landed on yesterday, a health record defaulted to yesterday, and an
 * accounting export ended a day early. The customer app hit the same trap in
 * two places first (apps/app/src/lib/format.ts); this is the one derivation
 * Ops and the till share instead of re-inventing it per view.
 *
 * The rule: a date a person reads is a LOCAL date, and it is derived one way.
 */
export function localDay(at: Date | string | number = new Date()): string {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today's local day — the default for every "when" field and date picker. */
export const today = () => localDay(new Date());

/** A `YYYY-MM-DD` shifted by whole days, staying on the local calendar. */
export function shiftDay(day: string, by: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y!, m! - 1, d! + by));
}
