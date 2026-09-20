import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { enqueue } from '../../../utils/jobs';

/** Deleting a majlis frees its slug at once; the purge job walks the bucket. */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  if (ev.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Hanya pemilik boleh padam' });
  await useDb().update(events).set({ purgedAt: new Date(), slug: `deleted-${ev.id.toLowerCase()}` }).where(eq(events.id, ev.id));
  await enqueue('purge_event', ev.id);
  return { ok: true };
});
