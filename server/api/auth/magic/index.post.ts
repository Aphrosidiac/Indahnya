import { z } from 'zod';
import { useDb, loginTokens } from '../../../db';
import { newToken } from '../../../utils/ids';
import { sendMail } from '../../../utils/mail';

const Body = z.object({ email: z.string().email(), next: z.string().startsWith('/').optional() });

export default defineEventHandler(async (event) => {
  const { email, next } = Body.parse(await readBody(event));
  const id = newToken();
  await useDb().insert(loginTokens).values({ id, email: email.toLowerCase(), next, expiresAt: new Date(Date.now() + 15 * 60_000) });
  const url = `${useRuntimeConfig().public.siteUrl}/api/auth/magic/${id}`;
  await sendMail(email, 'Link log masuk Indahnya',
    `<p>Klik untuk log masuk ke Indahnya:</p><p><a href="${url}">${url}</a></p><p>Link ni tamat dalam 15 minit.</p>`,
    `Klik untuk log masuk ke Indahnya: ${url}\nLink ni tamat dalam 15 minit.`);
  return { ok: true };
});
