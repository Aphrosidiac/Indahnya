import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { enqueue } from '../../../utils/jobs';
import { UNDO_DAYS } from '../../../utils/retention';

/**
 * Deleting a majlis takes it off the guests' links and the host's list at
 * once; the bytes go after a 7-day undo window (the purge job is queued for
 * then, and re-checks before it runs). The slug stays with the event for
 * good, so nobody else can take over its printed QR.
 */
export default defineEventHandler(async (event) => {
  const { ev, user } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  if (ev.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Hanya pemilik boleh padam' });
  const purgeAfter = new Date(Date.now() + UNDO_DAYS * 86_400_000);
  await useDb().update(events).set({ deletedAt: new Date(), purgeAfter }).where(eq(events.id, ev.id));
  await enqueue('purge_event', ev.id, { delayMs: purgeAfter.getTime() - Date.now() + 60_000 });
  return { ok: true, purgeAfter };
});
