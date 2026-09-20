import { eq } from 'drizzle-orm';
import { useDb, events } from '../../../db';
import { requireEventAccess } from '../../../utils/session';
import { newToken } from '../../../utils/ids';

/** Rotate the TV page's bearer: every screen showing the old link goes blank on its next poll. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().update(events).set({ tvToken: newToken() }).where(eq(events.id, ev.id)).returning({ tvToken: events.tvToken });
  return row;
});
