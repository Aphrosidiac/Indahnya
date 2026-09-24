/**
 * Every date is shown in Malaysia's clock, on the server and in the browser
 * alike: the SSR box runs UTC, a guest's phone may not, and a majlis date or
 * an upload time must read the same everywhere (and hydrate without a
 * mismatch). `lang` follows the page: BM by default, English for EN events.
 */
const TZ = 'Asia/Kuala_Lumpur';
const tag = (lang?: 'ms' | 'en') => (lang === 'en' ? 'en-MY' : 'ms-MY');

export const fmtDate = (d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }, lang?: 'ms' | 'en') =>
  d ? new Date(d).toLocaleDateString(tag(lang), { timeZone: TZ, ...opts }) : '—';
export const fmtDateTime = (d: string | Date | null | undefined, lang?: 'ms' | 'en') =>
  d ? new Date(d).toLocaleString(tag(lang), { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
export const fmtBytes = (n: number) => n >= 1_073_741_824 ? `${(n / 1_073_741_824).toFixed(1)} GB` : n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
export const daysLeft = (d: string | Date) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000));
export const fmtRM = (cents: number) => `RM${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
/** A stored majlis date (midnight UTC of the day) as the `YYYY-MM-DD` a date input wants. */
export const dateInput = (d: string | Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const planName = (p: 'free' | 'std' | 'full') => ({ free: 'Percuma', std: 'Indahnya', full: 'Indahnya Lengkap' })[p];
export const typeName = (t: string, lang: 'ms' | 'en' = 'ms') => (lang === 'en'
  ? ({ kahwin: 'Wedding', aqiqah: 'Aqiqah', birthday: 'Birthday', corporate: 'Company event', graduation: 'Graduation', lain: 'Event' })[t] ?? 'Event'
  : ({ kahwin: 'Majlis kahwin', aqiqah: 'Aqiqah', birthday: 'Birthday', corporate: 'Majlis syarikat', graduation: 'Graduasi', lain: 'Majlis' })[t] ?? 'Majlis');
export const siteUrl = () => useRuntimeConfig().public.siteUrl;
export const shortSite = () => siteUrl().replace(/^https?:\/\//, '');

export async function copyText(s: string) {
  try { await navigator.clipboard.writeText(s); return true; } catch { return false; }
}
