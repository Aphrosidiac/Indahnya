import nodemailer from 'nodemailer';

/**
 * Mail goes through SMTP_URL when set; without it (dev) the message is
 * printed to the server log, link included, so sign-in works with no mail
 * account at all.
 */
export async function sendMail(to: string, subject: string, html: string, text: string) {
  const { smtp } = useRuntimeConfig();
  if (!smtp.url) {
    console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return;
  }
  const t = nodemailer.createTransport(smtp.url);
  await t.sendMail({ from: smtp.from, to, subject, html, text });
}
