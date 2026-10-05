import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { useDb, events, users } from '../db';
import { sendMail, maskEmail } from '../utils/mail';
import { escapeHtml } from '../utils/html';
import { opsAlert } from '../utils/alert';
import { FINAL_NOTICE_DAYS, GRACE_DAYS } from '../utils/retention';

const DAY = 86_400_000;

/**
 * Retention warnings: 14 days before storage ends, the day it ends, and a
 * final one 23 days into the grace month. Each step is sent ONCE per storage
 * clock (recorded in settings.notified; a payment that moves the clock
 * clears the record — see applyPaidSession).
 *
 * The steps catch up: a step whose moment was missed (mail down, worker
 * down) still goes out late, and only the latest due step is sent, so a
 * host never gets three mails in one hour. The purge waits until the final
 * warning has been out for at least FINAL_NOTICE_DAYS (see purgeDue): a
 * mail that could not be sent delays the deletion instead of skipping the
 * warning.
 *
 * One event's failure (a rejected address, SMTP down) is logged and alerted
 * and the loop goes on to the next host.
 */
const STEPS = [
  { key: 'd14', due: (end: number, now: number) => end > now && end - now < 14 * DAY },
  { key: 'd0', due: (end: number, now: number) => end <= now },
  { key: 'd23', due: (end: number, now: number) => now >= end + (GRACE_DAYS - FINAL_NOTICE_DAYS) * DAY },
] as const;

function copy(step: string, title: string) {
  if (step === 'd14') return { subject: 'Galeri Indahnya korang tamat dalam 14 hari', text: `Galeri "${title}" akan ditutup dalam 14 hari. Download semua gambar (satu zip, kualiti asal) atau lanjutkan pakej dari dashboard.` };
  if (step === 'd0') return { subject: 'Galeri Indahnya korang dah tamat — 30 hari lagi sebelum dipadam', text: `Tempoh simpanan "${title}" dah tamat. Gambar akan dipadam terus dalam 30 hari. Download sekarang, atau lanjutkan pakej untuk simpan lagi.` };
  return { subject: 'Gambar majlis korang akan dipadam dalam 7 hari', text: `Ini peringatan terakhir untuk "${title}": semua gambar, video dan ucapan akan dipadam terus paling awal 7 hari dari sekarang, dan tak boleh dikembalikan. Download sekarang dari dashboard.` };
}

export async function notifyExpiring() {
  const db = useDb();
  const now = Date.now();
  const rows = await db.select({ ev: events, email: users.email }).from(events).innerJoin(users, eq(users.id, events.ownerId))
    .where(and(isNull(events.purgedAt), isNull(events.deletedAt), isNull(events.purgeStartedAt), isNull(users.deletedAt), lt(events.storageEndsAt, new Date(now + 15 * DAY))));
  const site = useRuntimeConfig().public.siteUrl;
  for (const { ev, email } of rows) {
    if (ev.settings.demo || ev.settings.sandbox) continue;
    const sent = new Set(ev.settings.notified ?? []);
    const end = ev.storageEndsAt.getTime();
    const latest = [...STEPS].reverse().find(s => s.due(end, now));
    if (!latest || sent.has(latest.key)) continue;
    const { subject, text } = copy(latest.key, ev.title);
    const url = `${site}/app/${ev.id}`;
    try {
      await sendMail(email, subject,
        `<p>${escapeHtml(text)}</p><p><a href="${url}">Buka dashboard majlis</a></p><p style="color:#767676;font-size:13px">Indahnya · FF Dev Studio</p>`,
        `${text}\n\n${url}`);
    } catch (e) {
      opsAlert('Retention mail failed', `${latest.key} for event ${ev.id} to ${maskEmail(email)}: ${(e as Error).message}`);
      continue;
    }
    // every step up to the one sent counts as done: a late mail never brings the earlier ones after it
    const notified = [...new Set([...sent, ...STEPS.slice(0, STEPS.indexOf(latest) + 1).map(s => s.key)])];
    const patch: Record<string, unknown> = { notified };
    if (latest.key === 'd23') patch.finalWarningAt = new Date(now).toISOString();
    await db.update(events).set({ settings: sql`${events.settings} || ${JSON.stringify(patch)}::jsonb` }).where(eq(events.id, ev.id));
  }
}
