/**
 * A majlis date arrives as `YYYY-MM-DD` (a date input) or a full ISO
 * string. It is stored as midnight UTC of that calendar day, and every
 * screen formats it in Asia/Kuala_Lumpur, where that is 8 a.m. the same day.
 */
export function parseEventDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const day = /^\d{4}-\d{2}-\d{2}/.exec(v)?.[0];
  const d = day ? new Date(`${day}T00:00:00.000Z`) : new Date(v);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2000 || d.getUTCFullYear() > 2100) {
    throw createError({ statusCode: 400, statusMessage: 'Tarikh tak sah' });
  }
  return d;
}
