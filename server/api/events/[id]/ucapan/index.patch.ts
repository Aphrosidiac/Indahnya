import { z } from 'zod';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { useDb, messages } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { move, delEverywhere, cdnPurge } from '../../../../utils/storage';
import { readBodyAs } from '../../../../utils/validate';

const Body = z.object({ ids: z.array(z.string().max(40)).min(1).max(500), action: z.enum(['hide', 'show', 'delete']) });

/**
 * Moderate wishes, the same way as photos: hiding moves a voice note out of
 * the public bucket (its link dies), showing moves it back, deleting removes
 * the words and the recording at once. One row at a time, under its lock.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { ids, action } = await readBodyAs(event, Body);
  const db = useDb();
  const rows = await db.select({ id: messages.id }).from(messages).where(and(eq(messages.eventId, ev.id), inArray(messages.id, ids)));
  let n = 0;
  const unpublished: string[] = [];
  for (const { id } of rows) {
    const done = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`message:${id}`}))`);
      const [m] = await tx.select().from(messages).where(eq(messages.id, id));
      if (!m || m.status === 'deleted') return false;
      if (action === 'delete') {
        await tx.update(messages).set({ status: 'deleted', body: null, audioKey: null, audioSrcKey: null }).where(eq(messages.id, id));
        await delEverywhere([m.audioKey, m.audioSrcKey].filter((k): k is string => !!k));
        if (m.status === 'visible' && m.audioKey) unpublished.push(m.audioKey);
        return true;
      }
      const toHidden = action === 'hide';
      if ((toHidden && m.status !== 'visible') || (!toHidden && m.status !== 'hidden')) return false;
      if (m.audioKey) await (toHidden ? move(m.audioKey, 'public', 'private') : move(m.audioKey, 'private', 'public'));
      await tx.update(messages).set({ status: toHidden ? 'hidden' : 'visible' }).where(eq(messages.id, id));
      if (toHidden && m.audioKey) unpublished.push(m.audioKey);
      return true;
    });
    if (done) n++;
  }
  await cdnPurge(unpublished);
  return { ok: true, n };
});
