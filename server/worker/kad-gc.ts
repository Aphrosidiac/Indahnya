import { and, eq, isNull } from 'drizzle-orm';
import { useDb, jobs, kad } from '../db';
import { enqueue } from '../utils/jobs';
import { KadFields, kadKeys, kadPrefix } from '../utils/kad';
import { del, delEverywhere, listDated, PUT_TTL_SEC } from '../utils/storage';

const DAY = 86_400_000;

/**
 * A host can upload kad photos and never save them. Those files are public
 * the moment they are processed, so something other than the next save must
 * remove them: every kad upload books one GC run for its event a day later
 * (one pending run per event, however many uploads).
 */
export async function scheduleKadGc(eventId: string) {
  const [pending] = await useDb().select({ id: jobs.id }).from(jobs)
    .where(and(eq(jobs.kind, 'kad_gc'), eq(jobs.ref, eventId), isNull(jobs.doneAt))).limit(1);
  if (!pending) await enqueue('kad_gc', eventId, DAY);
}

/** Deletes what the saved kad does not point at: processed files older than a day, raw uploads past their PUT window. */
export async function kadGc(eventId: string) {
  const [row] = await useDb().select().from(kad).where(eq(kad.eventId, eventId));
  const f = KadFields.safeParse(row?.fields ?? {});
  const keep = new Set([...(f.success ? kadKeys(f.data) : []), row?.ogKey].filter(Boolean) as string[]);
  const now = Date.now();
  const prefix = kadPrefix(eventId);
  const stale = (await listDated(prefix, 'public')).filter(o => !keep.has(o.key) && now - o.at.getTime() > DAY).map(o => o.key);
  if (stale.length) await delEverywhere(stale);
  const src = (await listDated(`events/${eventId.toLowerCase()}/kad-src/`, 'private')).filter(o => now - o.at.getTime() > PUT_TTL_SEC * 1000 + 3_600_000).map(o => o.key);
  if (src.length) await del(src, 'private');
}
