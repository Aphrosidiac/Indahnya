import { z } from 'zod';
import { useDb, loginTokens } from '../../../db';
import { newToken, tokenHash } from '../../../utils/ids';
import { sendMail } from '../../../utils/mail';
import { readBodyAs } from '../../../utils/validate';
import { rateLimit, clientIp } from '../../../utils/rate';

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254), next: z.string().optional() });

/**
 * Mail a one-shot sign-in link. The link opens /masuk, which spends the token
 * with a POST: mail scanners (Outlook Safe Links, corporate gateways) follow
 * GETs, and a link consumed by a robot is a host locked out.
 */
export default defineEventHandler(async (event) => {
  const { email, next } = await readBodyAs(event, Body);
  await rateLimit(`magic:ip:${clientIp(event)}`, 20, 15 * 60_000);
  await rateLimit(`magic:email:${email}`, 5, 15 * 60_000);
  const token = newToken();
  await useDb().insert(loginTokens).values({ id: tokenHash(token), email, next: safeNext(next), expiresAt: new Date(Date.now() + 15 * 60_000) });
  const url = `${useRuntimeConfig().public.siteUrl}/masuk?t=${token}`;
  await sendMail(email, 'Link log masuk Indahnya',
    `<p>Assalamualaikum / Hai,</p><p>Tekan link ni untuk log masuk ke Indahnya:</p><p><a href="${url}">Log masuk ke Indahnya</a></p><p style="color:#767676;font-size:13px">Link ni tamat dalam 15 minit dan boleh guna sekali je. Kalau bukan korang yang minta, abaikan email ni.</p>`,
    `Tekan link ni untuk log masuk ke Indahnya:\n${url}\n\nLink ni tamat dalam 15 minit dan boleh guna sekali je. Kalau bukan korang yang minta, abaikan email ni.`);
  return { ok: true };
});
