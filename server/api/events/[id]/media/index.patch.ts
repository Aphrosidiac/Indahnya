import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { useDb, media } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { move } from '../../../../utils/storage';

const Body = z.object({ ids: z.array(z.string()).min(1).max(500), action: z.enum(['hide', 'show', 'delete']) });

/**
 * Bulk moderation. Hiding moves the served copies under hidden/ so a link
 * someone already copied stops working; showing moves them back. Deleting
 * marks the row and leaves the bytes to the purge sweep.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const { ids, action } = Body.parse(await readBody(event));
  const db = useDb();
  const rows = await db.select().from(media).where(and(eq(media.eventId, ev.id), inArray(media.id, ids)));
  let n = 0;
  for (const m of rows) {
    if (action === 'delete') {
      if (m.status === 'deleted') continue;
      await db.update(media).set({ status: 'deleted' }).where(eq(media.id, m.id));
      n++;
      continue;
    }
    const toHidden = action === 'hide';
    if ((toHidden && m.status !== 'ready') || (!toHidden && m.status !== 'hidden')) continue;
    const swap = async (k: string | null) => {
      if (!k) return k;
      const nk = toHidden ? `hidden/${k}` : k.replace(/^hidden\//, '');
      if (nk !== k) await move(k, nk);
      return nk;
    };
    const [key, thumbKey, posterKey] = await Promise.all([swap(m.key), swap(m.thumbKey), swap(m.posterKey)]);
    await db.update(media).set({ status: toHidden ? 'hidden' : 'ready', key, thumbKey, posterKey }).where(eq(media.id, m.id));
    n++;
  }
  return { ok: true, n };
});
