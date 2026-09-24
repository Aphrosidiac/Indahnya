import { eq } from 'drizzle-orm';
import { useDb, kad } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { kadView } from '../../../utils/kad';
import { publicUrl } from '../../../utils/storage';

/** The e-kad as guests see it — only while the kad module is on. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  // switched off: nothing of the kad (contacts, bank numbers) leaves the server
  if (!ev.settings.modules.kad) return { kad: null, ogUrl: null, enabled: false };
  const [row] = await useDb().select().from(kad).where(eq(kad.eventId, ev.id));
  return { kad: kadView(ev, row), ogUrl: row?.ogKey ? publicUrl(row.ogKey) : null, enabled: true };
});
