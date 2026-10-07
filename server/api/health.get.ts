import { sql } from 'drizzle-orm';
import { useDb } from '../db';

/**
 * For an uptime monitor: 200 when the app, the database and the media worker
 * are all well, 503 (with what is wrong) when not. Nothing in it is personal.
 *
 *   db      — answers a query
 *   worker  — some worker process stamped its heartbeat in the last 3 minutes
 *   queue   — no photo has waited more than 10 minutes to be processed
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store');
  const out: { ok: boolean; db: boolean; worker: { lastBeatSec: number | null; ok: boolean }; queue: { waiting: number; oldestSec: number; ok: boolean } } = {
    ok: false, db: false, worker: { lastBeatSec: null, ok: false }, queue: { waiting: 0, oldestSec: 0, ok: false },
  };
  try {
    const db = useDb();
    const [beat] = (await db.execute(sql`select extract(epoch from now() - max(at))::int as sec from heartbeats where name like 'worker:%'`)).rows as { sec: number | null }[];
    const [q] = (await db.execute(sql`
      select count(*)::int as waiting, coalesce(extract(epoch from now() - min(run_after))::int, 0) as oldest
      from jobs where done_at is null and lane = 'photo' and run_after <= now()`)).rows as { waiting: number; oldest: number }[];
    out.db = true;
    out.worker = { lastBeatSec: beat?.sec ?? null, ok: beat?.sec !== null && beat?.sec !== undefined && beat.sec < 180 };
    out.queue = { waiting: q?.waiting ?? 0, oldestSec: q?.oldest ?? 0, ok: (q?.oldest ?? 0) < 600 };
  } catch { /* db down: everything stays false */ }
  out.ok = out.db && out.worker.ok && out.queue.ok;
  if (!out.ok) setResponseStatus(event, 503);
  return out;
});
