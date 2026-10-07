import { sendMail } from './mail';
import { escapeHtml } from './html';

/**
 * Things a person must act on: a payment that needs refunding, a job the
 * worker gave up on, a purge that ran without its final warning, mail that
 * cannot be sent. Logged always; mailed to NUXT_ALERT_EMAIL when it is set.
 * The same subject mails at most once per 15 minutes per process, so a
 * failing loop cannot flood the inbox. Never throws: an alert that fails
 * must not break the thing it is reporting on.
 */
const lastSent = new Map<string, number>();
const QUIET_MS = 15 * 60_000;

export function opsAlert(subject: string, detail: string) {
  console.error(`[alert] ${subject} — ${detail}`);
  const to = useRuntimeConfig().alertEmail;
  if (!to) return;
  const now = Date.now();
  if (now - (lastSent.get(subject) ?? 0) < QUIET_MS) return;
  lastSent.set(subject, now);
  void sendMail(to, `[Indahnya] ${subject}`, `<p><b>${escapeHtml(subject)}</b></p><pre style="white-space:pre-wrap">${escapeHtml(detail)}</pre>`, `${subject}\n\n${detail}`)
    .catch(e => console.error('[alert] could not mail:', (e as Error).message));
}
