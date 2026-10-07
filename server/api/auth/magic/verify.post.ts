import { z } from 'zod';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { useDb, loginTokens } from '../../../db';
import { createSession, findOrCreateUser } from '../../../utils/session';
import { readBodyAs } from '../../../utils/validate';
import { tokenHash } from '../../../utils/ids';
import { rateLimit, clientIp } from '../../../utils/rate';

const Body = z.object({ t: z.string().min(16).max(64) });

/**
 * Spend a sign-in token: one use, 15 minutes. Answers where to go next.
 * JSON only: a cross-site HTML form can post urlencoded bodies but cannot set
 * this content type, so no other site can sign a visitor into its own account.
 */
export default defineEventHandler(async (event) => {
  if (!String(getHeader(event, 'content-type') ?? '').toLowerCase().startsWith('application/json')) throw createError({ statusCode: 415 });
  const { t } = await readBodyAs(event, Body);
  await rateLimit(`verify:ip:${clientIp(event)}`, 30, 15 * 60_000);
  const [row] = await useDb().update(loginTokens).set({ usedAt: new Date() })
    .where(and(eq(loginTokens.id, tokenHash(t)), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date()))).returning();
  if (!row) throw createError({ statusCode: 410, statusMessage: 'Link dah tamat atau dah diguna' });
  const user = await findOrCreateUser(row.email);
  await createSession(event, user.id);
  return { next: safeNext(row.next) };
});
