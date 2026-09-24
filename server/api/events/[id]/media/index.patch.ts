import { z } from 'zod';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { useDb, media } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { move, del, delEverywhere } from '../../../../utils/storage';
import { readBodyAs } from '../../../../utils/validate';

const Body = z.object({ ids: z.array(z.string().max(40)).min(1).max(500), action: z.enum(['hide', 'show', 'delete']) });

/**
 * Bulk moderation. Hiding MOVES the served copies from the public bucket to
 * the private one, so a link someone already copied stops working and cannot
 * be guessed back; showing moves them home. Deleting removes every byte at
 * once — it is the stronger action, so it is at least as fast as hiding.
 * The TV drops a hidden or deleted photo on its next poll.
 *
 * Each row is handled under its own advisory lock, re-read inside it, with
 * the status written only after the bytes have moved: a hide and a show
 * racing on one photo run one after the other, and a move that failed half
 * way leaves the row as it was, so pressing the button again finishes it.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { ids, action } = await readBodyAs(event, Body);
  const db = useDb();
  const rows = await db.select({ id: media.id }).from(media).where(and(eq(media.eventId, ev.id), inArray(media.id, ids)));
  let n = 0;
  for (const { id } of rows) {
    const done = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`media:${id}`}))`);
      const [m] = await tx.select().from(media).where(eq(media.id, id));
      if (!m || m.status === 'deleted') return false;
      const served = [m.key, m.thumbKey, m.posterKey].filter((k, i, a): k is string => !!k && a.indexOf(k) === i);
      if (action === 'delete') {
        await tx.update(media).set({ status: 'deleted', key: null, thumbKey: null, posterKey: null }).where(eq(media.id, id));
        await Promise.all([delEverywhere(served), del([m.originalKey], 'private')]);
        return true;
      }
      const toHidden = action === 'hide';
      if ((toHidden && m.status !== 'ready') || (!toHidden && m.status !== 'hidden')) return false;
      await Promise.all(served.map(k => (toHidden ? move(k, 'public', 'private') : move(k, 'private', 'public'))));
      await tx.update(media).set({ status: toHidden ? 'hidden' : 'ready' }).where(eq(media.id, id));
      return true;
    });
    if (done) n++;
  }
  return { ok: true, n };
});
