import { and, eq, sql } from 'drizzle-orm';
import { useDb, jobs, media } from '../db';
import { processMedia } from '../worker/process-media';
import { purgeEvent, sweep } from '../worker/purge';
import { notifyExpiring } from '../worker/notify';

/**
 * The worker lives inside the app process: one VPS, one PM2 entry. Jobs are
 * claimed with SKIP LOCKED so two instances never take the same one. Set
 * WORKER=0 on a web-only instance.
 */
export default defineNitroPlugin((nitro) => {
  if (process.env.WORKER === '0' || import.meta.prerender) return;
  const db = useDb();
  let busy = 0;
  const MAX = 2;
  const MAX_ATTEMPTS = 3;

  async function claim() {
    return db.transaction(async (tx) => {
      const [j] = await tx.execute(sql`
        select id, kind, ref, attempts from jobs
        where done_at is null and run_after <= now() and (locked_at is null or locked_at < now() - interval '15 minutes')
        order by run_after limit 1 for update skip locked`).then(r => r.rows as { id: string; kind: string; ref: string; attempts: number }[]);
      if (!j) return null;
      await tx.update(jobs).set({ lockedAt: new Date(), attempts: j.attempts + 1 }).where(eq(jobs.id, j.id));
      return j;
    });
  }

  async function tick() {
    while (busy < MAX) {
      const j = await claim().catch((e) => { console.error('[worker] claim', e); return null; });
      if (!j) break;
      busy++;
      (async () => {
        try {
          if (j.kind === 'process_media') await processMedia(j.ref);
          else if (j.kind === 'purge_event') await purgeEvent(j.ref);
          await db.update(jobs).set({ doneAt: new Date(), lockedAt: null, error: null }).where(eq(jobs.id, j.id));
        } catch (e) {
          const msg = (e as Error).message?.slice(0, 500);
          console.error(`[worker] ${j.kind} ${j.ref}:`, msg);
          const giveUp = j.attempts + 1 >= MAX_ATTEMPTS;
          await db.update(jobs).set({ lockedAt: null, error: msg, doneAt: giveUp ? new Date() : null, runAfter: new Date(Date.now() + 60_000 * (j.attempts + 1)) }).where(eq(jobs.id, j.id));
          // a photo whose job is abandoned must not sit "processing" forever, holding a slot of the cap
          if (giveUp && j.kind === 'process_media') {
            await db.update(media).set({ status: 'failed', error: 'Gagal proses' }).where(and(eq(media.id, j.ref), eq(media.status, 'uploaded')));
          }
        } finally { busy--; setTimeout(tick, 0); }
      })();
    }
  }

  const timers = [
    setInterval(() => { void tick(); }, 2000),
    setInterval(() => { sweep().catch(e => console.error('[sweep]', e)); notifyExpiring().catch(e => console.error('[notify]', e)); }, 3_600_000),
  ];
  const first = setTimeout(() => {
    sweep().catch(e => console.error('[sweep]', e));
    notifyExpiring().catch(e => console.error('[notify]', e));
  }, 15_000);
  nitro.hooks.hook('close', () => { timers.forEach(clearInterval); clearTimeout(first); });
});
