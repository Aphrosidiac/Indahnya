import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, kad } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { KadFields, kadKeys, kadPrefix, kadView } from '../../../../utils/kad';
import { renderKadOg } from '../../../../utils/kad-og';
import { put, delEverywhere, listDated, publicUrl, head, getBuffer } from '../../../../utils/storage';
import { readBodyAs } from '../../../../utils/validate';
import { KAD_TEMPLATES } from '../../../../../shared/utils/kad-templates';

const Body = z.object({ template: z.enum(KAD_TEMPLATES), fields: KadFields, baseUpdatedAt: z.string().nullable().optional() });

/** Which file type each slot may point at. */
const SLOT_EXT = (k: string, ext: 'webp' | 'png' | 'm4a') => k.endsWith(`.${ext}`);

/**
 * Save the kad. Every asset key must be one of this event's own processed
 * uploads (a key is never taken on trust: it would put anything in the
 * bucket on a public page). Then the WhatsApp preview is re-drawn, and
 * whatever the kad no longer points at is removed — anything younger than
 * two hours is left alone, so an upload still open in another tab survives.
 */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  if (ev.purgedAt) throw createError({ statusCode: 410, statusMessage: 'Majlis ni dah tamat simpanan' });
  const { template, fields, baseUpdatedAt } = await readBodyAs(event, Body);
  const prefix = kadPrefix(ev.id);
  const keys = kadKeys(fields);
  for (const k of keys) {
    if (!k.startsWith(prefix) || !/^[a-z0-9]+\.(webp|png|m4a)$/.test(k.slice(prefix.length))) {
      throw createError({ statusCode: 400, statusMessage: 'Fail kad tak sah' });
    }
  }
  const slotsOk = [...fields.photos, fields.coverKey].every(k => !k || SLOT_EXT(k, 'webp'))
    && (!fields.gift.qrKey || SLOT_EXT(fields.gift.qrKey, 'png')) && (!fields.music || SLOT_EXT(fields.music.key, 'm4a'));
  if (!slotsOk) throw createError({ statusCode: 400, statusMessage: 'Fail kad tak sah' });
  const missing = (await Promise.all(keys.map(async k => ((await head(k, 'public')) ? null : k)))).filter(Boolean);
  if (missing.length) throw createError({ statusCode: 400, statusMessage: 'Ada fail kad yang dah tak wujud — upload semula' });

  const db = useDb();
  const view = kadView(ev, { template, fields });
  let freshOg: string | null = null;
  try {
    const cover = fields.coverKey ? await getBuffer(fields.coverKey, 'public').catch(() => null) : null;
    const og = await renderKadOg(view, cover);
    freshOg = `${prefix}og-${Date.now().toString(36)}.jpg`;
    await put(freshOg, og, 'image/jpeg', 'public');
  } catch (e) {
    // a kad that saves without a fresh preview beats a kad that does not save
    console.error('[kad] og render failed', (e as Error).message);
  }

  /**
   * One save at a time per kad (row lock), and a save based on an older
   * version is refused rather than silently overwriting a co-host's work.
   */
  const now = new Date();
  const saved = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(kad).where(eq(kad.eventId, ev.id)).for('update');
    if (row && baseUpdatedAt && row.updatedAt.toISOString() !== new Date(baseUpdatedAt).toISOString()) {
      throw createError({ statusCode: 409, statusMessage: 'Kad ni dah diubah kat tempat lain — muat semula dulu' });
    }
    const ogKey = freshOg ?? row?.ogKey ?? null;
    await tx.insert(kad).values({ eventId: ev.id, template, fields, ogKey, updatedAt: now })
      .onConflictDoUpdate({ target: kad.eventId, set: { template, fields, ogKey, updatedAt: now } });
    return { ogKey };
  }).catch(async (e) => { if (freshOg) await delEverywhere([freshOg]); throw e; });

  // clean up after the write, against what the row points at NOW; young files are left for a save still in flight
  const keep = new Set([...keys, saved.ogKey].filter(Boolean) as string[]);
  const assetCutoff = Date.now() - 2 * 3_600_000, ogCutoff = Date.now() - 10 * 60_000;
  const stale = (await listDated(prefix, 'public'))
    .filter(o => !keep.has(o.key) && o.at.getTime() < (o.key.includes('/og-') ? ogCutoff : assetCutoff)).map(o => o.key);
  if (stale.length) await delEverywhere(stale);

  return { ok: true, ogUrl: saved.ogKey ? publicUrl(saved.ogKey) : null, updatedAt: now };
});
