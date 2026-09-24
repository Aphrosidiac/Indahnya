import { eq } from 'drizzle-orm';
import { useDb, kad } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { KadFields, kadDefaults, kadKeys } from '../../../../utils/kad';
import { publicUrl } from '../../../../utils/storage';

/**
 * The editor's view: the stored fields as they are (undefined = "use the
 * default"), the defaults for this majlis type and language, and a URL for
 * every asset key so the preview can show them.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().select().from(kad).where(eq(kad.eventId, ev.id));
  const fields = KadFields.parse(row?.fields ?? {});
  return {
    template: row?.template ?? 'garden',
    fields,
    defaults: kadDefaults(ev),
    assets: Object.fromEntries(kadKeys(fields).map(k => [k, publicUrl(k)])),
    ogUrl: row?.ogKey ? publicUrl(row.ogKey) : null,
    updatedAt: row?.updatedAt ?? null,
  };
});
