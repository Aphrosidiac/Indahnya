import { and, eq, isNull, lt, gt, sql } from 'drizzle-orm';
import { useDb, events, users } from '../db';
import { sendMail } from '../utils/mail';

/**
 * Retention warnings: 14 days before storage ends, then the day it ends,
 * then 7 days before the grace period closes. One mail per step, recorded
 * in settings.notified so a restart never re-sends.
 */
export async function notifyExpiring() {
  const db = useDb();
  const now = Date.now();
  const steps: { key: string; when: (endsAt: number) => boolean; subject: string; body: (title: string, url: string) => string }[] = [
    { key: 'd14', when: e => e - now < 14 * 86_400_000 && e > now, subject: 'Galeri Indahnya anda tamat dalam 14 hari', body: (t, u) => `Galeri "${t}" akan ditutup dalam 14 hari. Download semua gambar atau lanjutkan pakej di ${u}.` },
    { key: 'd0', when: e => e <= now && e > now - 86_400_000 * 2, subject: 'Galeri Indahnya anda dah tamat — 30 hari lagi sebelum dipadam', body: (t, u) => `Tempoh simpanan "${t}" dah tamat. Gambar akan dipadam dalam 30 hari. Download atau lanjutkan di ${u}.` },
    { key: 'd23', when: e => e < now - 23 * 86_400_000 && e > now - 25 * 86_400_000, subject: 'Gambar majlis anda dipadam dalam 7 hari', body: (t, u) => `Ini peringatan terakhir untuk "${t}": gambar akan dipadam dalam 7 hari. ${u}` },
  ];
  const rows = await db.select({ ev: events, email: users.email }).from(events).innerJoin(users, eq(users.id, events.ownerId))
    .where(and(isNull(events.purgedAt), lt(events.storageEndsAt, new Date(now + 15 * 86_400_000)), gt(events.storageEndsAt, new Date(now - 26 * 86_400_000))));
  const site = useRuntimeConfig().public.siteUrl;
  for (const { ev, email } of rows) {
    const notified = ((ev.settings as { notified?: string[] }).notified ?? []);
    for (const s of steps) {
      if (notified.includes(s.key) || !s.when(ev.storageEndsAt.getTime())) continue;
      const url = `${site}/app/${ev.id}`;
      await sendMail(email, s.subject, `<p>${s.body(ev.title, url)}</p>`, s.body(ev.title, url));
      notified.push(s.key);
      await db.update(events).set({ settings: sql`${events.settings} || ${JSON.stringify({ notified })}::jsonb` }).where(eq(events.id, ev.id));
    }
  }
}
