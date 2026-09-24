import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { enqueue } from '../../../utils/jobs';

/** Deleting a majlis frees its slug at once and leaves the host's list; the purge job walks the buckets. */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  if (ev.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Hanya pemilik boleh padam' });
  const now = new Date();
  // purgedAt is left to the purge job: it is the sweep's "bytes are gone" mark, and a job that gives up is re-queued until it is set
  await useDb().update(events).set({ deletedAt: now, slug: `deleted-${ev.id.toLowerCase()}` }).where(eq(events.id, ev.id));
  await enqueue('purge_event', ev.id);
  return { ok: true };
});
