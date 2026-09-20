export const fmtDate = (d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('ms-MY', opts) : '—';
export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString('ms-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
export const fmtBytes = (n: number) => n >= 1_073_741_824 ? `${(n / 1_073_741_824).toFixed(1)} GB` : n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
export const daysLeft = (d: string | Date) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000));
export const planName = (p: 'free' | 'std' | 'full') => ({ free: 'Percuma', std: 'Indahnya', full: 'Indahnya Lengkap' })[p];
export const typeName = (t: string) => ({ kahwin: 'Majlis kahwin', aqiqah: 'Aqiqah', birthday: 'Birthday', corporate: 'Majlis syarikat', graduation: 'Graduasi', lain: 'Majlis' })[t] ?? 'Majlis';
export const siteUrl = () => useRuntimeConfig().public.siteUrl;
export const shortSite = () => siteUrl().replace(/^https?:\/\//, '');

export async function copyText(s: string) {
  try { await navigator.clipboard.writeText(s); return true; } catch { return false; }
}
