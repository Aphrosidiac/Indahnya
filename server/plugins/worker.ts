import { hostname } from 'node:os';
import { eq, sql } from 'drizzle-orm';
import { useDb, jobs, media, heartbeats, type JobLane } from '../db';
import { processMedia } from '../worker/process-media';
import { purgeEvent, sweep } from '../worker/purge';
import { notifyExpiring } from '../worker/notify';
import { kadGc } from '../worker/kad-gc';
import { sweepSandbox } from '../utils/sandbox';
import { opsAlert } from '../utils/alert';
import { MAX_ATTEMPTS, LOCK_STALE_MIN, closeAbandonedJobs, pruneHousekeeping, cleanTmp } from '../worker/housekeeping';

/**
 * The media worker. In production it runs as its own PM2 process (WORKER=1,
 * see ecosystem.config.cjs) and the web processes run with WORKER=0, so an
 * encode never competes with a guest's request for the event loop. In dev
 * one process does both.
 *
 * Jobs are claimed per LANE with SKIP LOCKED (any number of worker processes
 * is safe), lowest priority first:
 *   photo — guests' photos (and the landing's sandbox, behind them)
 *   video — encodes, one at a time by default: a 100 MB video never holds up
 *           the photos on the TV
 *   maint — purges and kad clean-up
 *
 * A running job refreshes its lock every minute; a lock silent for five
 * minutes belonged to a process that died, and the job is taken again — at
 * most MAX_ATTEMPTS times in all, so a file that crashes the process cannot
 * crash it forever.
 */
const LANES: Record<JobLane, number> = {
  photo: Number(process.env.WORKER_PHOTO_CONCURRENCY) || 2,
  video: Number(process.env.WORKER_VIDEO_CONCURRENCY) || 1,
  maint: 1,
};

export default defineNitroPlugin((nitro) => {
  if (process.env.WORKER === '0' || import.meta.prerender) return;
  const db = useDb();
  const busy: Record<JobLane, number> = { photo: 0, video: 0, maint: 0 };
  const running = new Set<Promise<void>>();
  let stopping = false;

  async function claim(lane: JobLane) {
    return db.transaction(async (tx) => {
      const [j] = await tx.execute(sql`
        select id, kind, ref, attempts from jobs
        where lane = ${lane} and done_at is null and run_after <= now() and attempts < ${MAX_ATTEMPTS}
          and (locked_at is null or locked_at < now() - make_interval(mins => ${LOCK_STALE_MIN}))
        order by priority, run_after limit 1 for update skip locked`).then(r => r.rows as { id: string; kind: string; ref: string; attempts: number }[]);
      if (!j) return null;
      await tx.update(jobs).set({ lockedAt: new Date(), attempts: j.attempts + 1 }).where(eq(jobs.id, j.id));
      return j;
    });
  }

  async function runJob(j: { id: string; kind: string; ref: string; attempts: number }) {
    const beat = setInterval(() => { db.update(jobs).set({ lockedAt: new Date() }).where(eq(jobs.id, j.id)).catch(() => {}); }, 60_000);
    try {
      if (j.kind === 'process_media') await processMedia(j.ref);
      else if (j.kind === 'purge_event') await purgeEvent(j.ref);
      else if (j.kind === 'kad_gc') await kadGc(j.ref);
      await db.update(jobs).set({ doneAt: new Date(), lockedAt: null, error: null }).where(eq(jobs.id, j.id));
    } catch (e) {
      const msg = (e as Error).message?.slice(0, 500) ?? 'error';
      console.error(`[worker] ${j.kind} ${j.ref}:`, msg);
      const giveUp = j.attempts + 1 >= MAX_ATTEMPTS;
      await db.update(jobs).set({ lockedAt: null, error: msg, doneAt: giveUp ? new Date() : null, runAfter: new Date(Date.now() + 60_000 * (j.attempts + 1)) }).where(eq(jobs.id, j.id));
      if (giveUp) {
        // a photo whose job is abandoned must not sit "processing" forever, holding a slot of the cap
        if (j.kind === 'process_media') await db.update(media).set({ status: 'failed', error: 'Gagal proses' }).where(sql`${media.id} = ${j.ref} and ${media.status} = 'uploaded'`);
        opsAlert(`Worker gave up: ${j.kind}`, `${j.ref}\n${msg}`);
      }
    } finally { clearInterval(beat); }
  }

  async function tick(lane: JobLane) {
    while (!stopping && busy[lane] < LANES[lane]) {
      // reserve the slot BEFORE awaiting the claim: two ticks overlapping must not both pass the check
      busy[lane]++;
      const j = await claim(lane).catch((e) => { console.error('[worker] claim', (e as Error).message); return null; });
      if (!j || stopping) {
        busy[lane]--;
        // claimed while shutting down: hand it straight back for the next process
        if (j) await db.update(jobs).set({ lockedAt: null, attempts: j.attempts }).where(eq(jobs.id, j.id)).catch(() => {});
        break;
      }
      const p = runJob(j).catch(e => console.error('[worker] bookkeeping', (e as Error).message)).finally(() => {
        busy[lane]--; running.delete(p);
        if (!stopping) setTimeout(() => void tick(lane), 0);
      });
      running.add(p);
    }
  }
  const tickAll = () => { for (const lane of Object.keys(LANES) as JobLane[]) void tick(lane); };

  const hourly = () => {
    sweep().catch(e => console.error('[sweep]', e));
    notifyExpiring().catch(e => console.error('[notify]', e));
    closeAbandonedJobs().catch(e => console.error('[jobs]', e));
    pruneHousekeeping().catch(e => console.error('[prune]', e));
  };
  void cleanTmp();
  /** Liveness for /api/health: one stamp a minute. */
  const beat = () => db.insert(heartbeats).values({ name: `worker:${hostname()}`, at: new Date() })
    .onConflictDoUpdate({ target: heartbeats.name, set: { at: new Date() } }).catch(e => console.error('[worker] heartbeat', (e as Error).message));
  void beat();
  const timers = [
    setInterval(tickAll, 1000),
    setInterval(beat, 60_000),
    setInterval(() => { sweepSandbox().catch(e => console.error('[sandbox]', e)); }, 10 * 60_000),
    setInterval(hourly, 3_600_000),
  ];
  const first = setTimeout(hourly, 15_000);

  /**
   * PM2 reload / SIGTERM: stop claiming, let what is running finish (PM2's
   * kill_timeout is set above this wait). Anything still running past it is
   * taken again by the next process once its lock goes quiet.
   */
  nitro.hooks.hook('close', async () => {
    stopping = true;
    timers.forEach(clearInterval); clearTimeout(first);
    if (!running.size) return;
    console.log(`[worker] waiting for ${running.size} job(s) to finish`);
    await Promise.race([Promise.allSettled([...running]), new Promise(r => setTimeout(r, 25_000))]);
  });
});
