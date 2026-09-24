import nodemailer from 'nodemailer';

/**
 * Mail goes through NUXT_SMTP_URL. In dev, without it, the message is printed to
 * the server log, link included, so sign-in works with no mail account at
 * all. In production a missing NUXT_SMTP_URL is an error, never a log line: a
 * sign-in link in a log file is a key left in the door.
 */
let transport: ReturnType<typeof nodemailer.createTransport> | undefined;

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const { smtp } = useRuntimeConfig();
  if (!smtp.url) {
    if (!import.meta.dev) {
      console.error(`[mail] NUXT_SMTP_URL is not set; "${subject}" to ${to} was NOT sent`);
      throw createError({ statusCode: 503, statusMessage: 'Email belum disambung' });
    }
    console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport(smtp.url);
  await transport.sendMail({ from: smtp.from, to, subject, html, text });
}
