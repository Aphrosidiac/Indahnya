import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { useDb, media, reactions } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { ensureGuest } from '../../../../../utils/guest';

const Body = z.object({ kind: z.enum(['love', 'party', 'cry']).nullable() });

/** One reaction per browser per photo; null takes it back. Returns the new tallies. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const { kind } = Body.parse(await readBody(event));
  const id = getRouterParam(event, 'id')!;
  const db = useDb();
  const [m] = await db.select({ id: media.id }).from(media).where(and(eq(media.id, id), eq(media.eventId, ev.id), eq(media.status, 'ready')));
  if (!m) throw createError({ statusCode: 404 });
  const g = await ensureGuest(event, ev.id);
  if (kind) {
    await db.insert(reactions).values({ mediaId: id, guestId: g.id, kind })
      .onConflictDoUpdate({ target: [reactions.mediaId, reactions.guestId], set: { kind } });
  } else {
    await db.delete(reactions).where(and(eq(reactions.mediaId, id), eq(reactions.guestId, g.id)));
  }
  const rows = await db.select({ kind: reactions.kind, n: sql<number>`count(*)` }).from(reactions).where(eq(reactions.mediaId, id)).groupBy(reactions.kind);
  return { mine: kind, reactions: Object.fromEntries(rows.map(r => [r.kind, Number(r.n)])) };
});
