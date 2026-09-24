import { and, eq, isNull, lt, gt, sql } from 'drizzle-orm';
import { useDb, events, users } from '../db';
import { sendMail } from '../utils/mail';
import { escapeHtml } from '../utils/html';

/**
 * Retention warnings: 14 days before storage ends, then the day it ends,
 * then 7 days before the grace period closes. One mail per step, recorded
 * in settings.notified so a restart never re-sends; a payment that moves
 * the clock clears the record (see applyPaidSession).
 */
export async function notifyExpiring() {
  const db = useDb();
  const now = Date.now();
  const steps: { key: string; when: (endsAt: number) => boolean; subject: string; body: (title: string) => string }[] = [
    { key: 'd14', when: e => e - now < 14 * 86_400_000 && e > now, subject: 'Galeri Indahnya anda tamat dalam 14 hari', body: t => `Galeri "${t}" akan ditutup dalam 14 hari. Download semua gambar (satu zip, kualiti asal) atau lanjutkan pakej dari dashboard.` },
    { key: 'd0', when: e => e <= now && e > now - 86_400_000 * 2, subject: 'Galeri Indahnya anda dah tamat — 30 hari lagi sebelum dipadam', body: t => `Tempoh simpanan "${t}" dah tamat. Gambar akan dipadam terus dalam 30 hari. Download sekarang, atau lanjutkan pakej untuk simpan lagi.` },
    { key: 'd23', when: e => e < now - 23 * 86_400_000 && e > now - 25 * 86_400_000, subject: 'Gambar majlis anda dipadam dalam 7 hari', body: t => `Ini peringatan terakhir untuk "${t}": semua gambar dan video akan dipadam terus dalam 7 hari, dan tak boleh dikembalikan.` },
  ];
  const rows = await db.select({ ev: events, email: users.email }).from(events).innerJoin(users, eq(users.id, events.ownerId))
    .where(and(isNull(events.purgedAt), isNull(events.deletedAt), lt(events.storageEndsAt, new Date(now + 15 * 86_400_000)), gt(events.storageEndsAt, new Date(now - 26 * 86_400_000))));
  const site = useRuntimeConfig().public.siteUrl;
  for (const { ev, email } of rows) {
    if (ev.settings.demo) continue;
    const notified = [...(ev.settings.notified ?? [])];
    for (const s of steps) {
      if (notified.includes(s.key) || !s.when(ev.storageEndsAt.getTime())) continue;
      const url = `${site}/app/${ev.id}`;
      const text = s.body(ev.title);
      await sendMail(email, s.subject,
        `<p>${escapeHtml(text)}</p><p><a href="${url}">Buka dashboard majlis</a></p><p style="color:#767676;font-size:13px">Indahnya · FF Dev Studio</p>`,
        `${text}\n\n${url}`);
      notified.push(s.key);
      await db.update(events).set({ settings: sql`${events.settings} || ${JSON.stringify({ notified })}::jsonb` }).where(eq(events.id, ev.id));
    }
  }
}
