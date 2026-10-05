import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { useDb, users, events, eventMembers, sessions } from '../db';
import { requireUser, destroySession } from '../utils/session';
import { readBodyAs } from '../utils/validate';
import { enqueue } from '../utils/jobs';

const Body = z.object({ confirm: z.literal('PADAM') });

/**
 * Delete the host's account (PDPA: the right to have one's data erased).
 * Every majlis they own is deleted and purged now — not after the usual
 * 7 days: nobody is left to restore it. Co-hosting ends. The user row stays
 * only as an anonymous anchor for payment records the business must keep,
 * with the email and name removed.
 */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  await readBodyAs(event, Body);
  const db = useDb();
  const now = new Date();
  const owned = await db.transaction(async (tx) => {
    const rows = await tx.update(events).set({ deletedAt: now, purgeAfter: now })
      .where(and(eq(events.ownerId, u.id), isNull(events.purgedAt))).returning({ id: events.id });
    // majlis already deleted earlier lose what was left of their undo window
    await tx.update(events).set({ purgeAfter: now }).where(eq(events.ownerId, u.id));
    await tx.delete(eventMembers).where(eq(eventMembers.userId, u.id));
    await tx.delete(sessions).where(eq(sessions.userId, u.id));
    await tx.update(users).set({ email: `deleted-${u.id.toLowerCase()}@deleted.invalid`, name: null, googleSub: null, deletedAt: now }).where(eq(users.id, u.id));
    return rows;
  });
  for (const e of owned) await enqueue('purge_event', e.id);
  await destroySession(event);
  return { ok: true };
});
