import { readdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, eq, inArray, isNull, isNotNull, lt, gte, or } from 'drizzle-orm';
import { useDb, jobs, media, sessions, loginTokens, heartbeats } from '../db';
import { pruneRateLimits } from '../utils/rate';
import { opsAlert } from '../utils/alert';

export const MAX_ATTEMPTS = 3;
/** A running job refreshes its lock every minute; one silent for this long died with its process. */
export const LOCK_STALE_MIN = 5;

/**
 * Jobs whose last allowed attempt died with the process (an OOM kill, a
 * power cut): the claim no longer takes them (attempts are spent), so they
 * are closed here, their photo failed instead of "processing" forever, and
 * someone told.
 */
export async function closeAbandonedJobs() {
  const db = useDb();
  const dead = await db.update(jobs).set({ doneAt: new Date(), lockedAt: null, error: 'abandoned: the process died during its last attempt' })
    .where(and(isNull(jobs.doneAt), gte(jobs.attempts, MAX_ATTEMPTS), or(isNull(jobs.lockedAt), lt(jobs.lockedAt, new Date(Date.now() - LOCK_STALE_MIN * 60_000)))))
    .returning({ kind: jobs.kind, ref: jobs.ref });
  if (!dead.length) return;
  const mediaIds = dead.filter(d => d.kind === 'process_media').map(d => d.ref);
  if (mediaIds.length) await db.update(media).set({ status: 'failed', error: 'Gagal proses' }).where(and(inArray(media.id, mediaIds), eq(media.status, 'uploaded')));
  opsAlert('Worker abandoned jobs', dead.map(d => `${d.kind} ${d.ref}`).join('\n'));
}

/** Rows nothing reads any more: finished jobs, expired sessions, spent or dead sign-in links, finished rate-limit windows. */
export async function pruneHousekeeping() {
  const db = useDb();
  const now = Date.now();
  await db.delete(jobs).where(and(isNotNull(jobs.doneAt), lt(jobs.doneAt, new Date(now - 14 * 86_400_000))));
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date(now)));
  await db.delete(loginTokens).where(lt(loginTokens.expiresAt, new Date(now - 86_400_000)));
  await db.delete(heartbeats).where(lt(heartbeats.at, new Date(now - 7 * 86_400_000)));
  await pruneRateLimits();
}

/** Temp dirs left by a process that died mid-encode. Only ours, only old ones. */
export async function cleanTmp() {
  const dir = tmpdir();
  for (const name of await readdir(dir).catch(() => [] as string[])) {
    if (!name.startsWith('indahnya-')) continue;
    const p = join(dir, name);
    try { if (Date.now() - (await stat(p)).mtimeMs > 2 * 3_600_000) await rm(p, { recursive: true, force: true }); }
    catch { /* gone already */ }
  }
}
