import { and, eq, gt, isNull } from 'drizzle-orm';
import { useDb, loginTokens } from '../../../db';
import { createSession, findOrCreateUser } from '../../../utils/session';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  const db = useDb();
  const [t] = await db.update(loginTokens).set({ usedAt: new Date() })
    .where(and(eq(loginTokens.id, id), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date()))).returning();
  if (!t) return sendRedirect(event, '/masuk?error=expired');
  const user = await findOrCreateUser(t.email);
  await createSession(event, user.id);
  return sendRedirect(event, t.next || '/app');
});
