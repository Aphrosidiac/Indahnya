/**
 * Reads nginx's analytics log (one JSON line per request, deploy/nginx.conf `indahnya_json`), classifies every
 * request (classify.ts) and stores it. Runs every 10 minutes from the worker (server/worker/traffic.ts) and is
 * safe to run twice, even at once: one transaction holds an advisory lock, and a cursor (inode + byte offset)
 * records how far it got. It follows logrotate's rename to `<file>.1`.
 */
import { randomBytes } from 'node:crypto';
import { open, stat } from 'node:fs/promises';
import { sql, eq, gte } from 'drizzle-orm';
import { useDb, trafficHits, trafficDaily, trafficCursor, trafficStaffIps, trafficSalts, collectorRuns } from '../../db';
import { prepare, myDay, type ClassifyContext, type HitRow, type LogLine } from './classify';
import type { TrafficConfig } from './config';

type Db = ReturnType<typeof useDb>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const CURSOR = 'traffic-log';
const LOCK = 7_342_001;
const MAX = 32 * 1024 * 1024;

async function readFrom(file: string, from: bigint, max: number): Promise<{ text: string; end: bigint } | null> {
  const fh = await open(file, 'r').catch(() => null);
  if (!fh) return null;
  try {
    const size = BigInt((await fh.stat()).size);
    if (from >= size) return { text: '', end: from };
    const len = Number(size - from > BigInt(max) ? BigInt(max) : size - from);
    const buf = Buffer.alloc(len);
    await fh.read(buf, 0, len, Number(from));
    const lastNl = buf.lastIndexOf(10);
    if (lastNl < 0) return { text: '', end: from };
    return { text: buf.subarray(0, lastNl + 1).toString('utf8'), end: from + BigInt(lastNl + 1) };
  } finally { await fh.close(); }
}

/** New lines since the last run, across a rotation. The cursor moves only past complete lines. */
async function newLines(tx: Tx, file: string) {
  const [cur] = await tx.select().from(trafficCursor).where(eq(trafficCursor.id, CURSOR));
  const st = await stat(file).catch(() => null);
  if (!st) return null;
  const inode = BigInt(st.ino);
  const chunks: string[] = [];
  let offset = BigInt(0);
  if (cur && cur.inode !== inode) {
    // rotated since the last run: finish the old file (now <file>.1) first
    const old = await stat(`${file}.1`).catch(() => null);
    if (old && BigInt(old.ino) === cur.inode) { const r = await readFrom(`${file}.1`, cur.offset, MAX); if (r) chunks.push(r.text); }
  } else if (cur) offset = cur.offset > BigInt(st.size) ? BigInt(0) : cur.offset;
  const r = await readFrom(file, offset, MAX);
  if (r) chunks.push(r.text);
  const end = r?.end ?? offset;
  return {
    lines: chunks.join('').split('\n').filter(Boolean),
    save: () => tx.insert(trafficCursor).values({ id: CURSOR, inode, offset: end })
      .onConflictDoUpdate({ target: trafficCursor.id, set: { inode, offset: end, updatedAt: new Date() } }),
  };
}

/** The day's salt, created on first use. Three days are kept, so a late log line still finds its day's. */
async function saltFor(db: Db | Tx, day: string) {
  const [row] = await db.select().from(trafficSalts).where(eq(trafficSalts.day, day));
  if (row) return row.salt;
  await db.insert(trafficSalts).values({ day, salt: randomBytes(24).toString('hex') }).onConflictDoNothing();
  const [again] = await db.select().from(trafficSalts).where(eq(trafficSalts.day, day));
  return again!.salt;
}

/** IPs a staff account signed in from in the last 30 days: their visits are not customer traffic. */
export async function staffIps(db: Db | Tx = useDb()) {
  const rows = await db.select({ ip: trafficStaffIps.ip }).from(trafficStaffIps).where(gte(trafficStaffIps.seenAt, new Date(Date.now() - 30 * 86_400_000)));
  return new Set(rows.map(r => r.ip));
}

/**
 * Mark page views whose beacon arrived (human), and turn floods and probing into automation and scanners.
 * Windows are 10 minutes.
 */
export async function confirmPages(db: Db | Tx, since: Date) {
  const confirmed = await db.execute(sql`
    UPDATE traffic_hits p SET beacon = true, class = CASE WHEN b.class = 'automation' THEN 'automation' WHEN p.class = 'unconfirmed' THEN 'human' ELSE p.class END
    FROM traffic_hits b
    WHERE p.kind = 'page' AND p.grp = 'marketing' AND p.beacon = false AND p.at >= ${since} AND p.class IN ('unconfirmed', 'staff')
      AND b.kind = 'beacon' AND b.visitor = p.visitor AND b.data->>'p' = p.path
      AND b.at >= p.at AND b.at <= p.at + interval '30 minutes'`);
  const flooded = await db.execute(sql`
    UPDATE traffic_hits SET class = 'automation'
    WHERE kind IN ('page', 'beacon') AND grp IN ('marketing', 'beacon') AND class IN ('unconfirmed', 'human') AND at >= ${since}
      AND (visitor, date_trunc('hour', at) + floor(date_part('minute', at) / 10) * interval '10 minutes') IN (
        SELECT visitor, date_trunc('hour', at) + floor(date_part('minute', at) / 10) * interval '10 minutes'
        FROM traffic_hits WHERE kind = 'page' AND grp = 'marketing' AND at >= ${since} GROUP BY 1, 2 HAVING count(*) > 60)`);
  // a visitor that collects 10+ not-founds in 10 minutes is probing for files, whatever its User-Agent says
  const probing = await db.execute(sql`
    UPDATE traffic_hits SET class = 'scanner'
    WHERE class IN ('unconfirmed', 'automation', 'other-bot', 'datacenter') AND at >= ${since}
      AND (visitor, date_trunc('hour', at) + floor(date_part('minute', at) / 10) * interval '10 minutes') IN (
        SELECT visitor, date_trunc('hour', at) + floor(date_part('minute', at) / 10) * interval '10 minutes'
        FROM traffic_hits WHERE status = 404 AND at >= ${since} GROUP BY 1, 2 HAVING count(*) >= 10)`);
  return { confirmed: confirmed.rowCount ?? 0, flooded: flooded.rowCount ?? 0, probing: probing.rowCount ?? 0 };
}

export async function recordRun(db: Db, id: string, ok: boolean, rows: number, detail: string) {
  await db.insert(collectorRuns).values({ id, ok, rows, detail: detail.slice(0, 500) })
    .onConflictDoUpdate({ target: collectorRuns.id, set: { ok, rows, detail: detail.slice(0, 500), ranAt: new Date() } });
}

/** Retention for the analytics tables (called from the hourly prune). */
export async function pruneTraffic(db: Db = useDb()) {
  const now = Date.now();
  await db.delete(trafficHits).where(sql`${trafficHits.at} < ${new Date(now - 120 * 86_400_000)}`);
  await db.delete(trafficSalts).where(sql`${trafficSalts.day} < ${myDay(new Date(now - 3 * 86_400_000))}`);
  await db.delete(trafficStaffIps).where(sql`${trafficStaffIps.seenAt} < ${new Date(now - 60 * 86_400_000)}`);
}

let running = false;

export async function ingestTraffic(cfg: TrafficConfig, file = cfg.logPath) {
  // a run that outlasts the 10-minute schedule just skips a tick
  if (running) return { skipped: 'already running' };
  running = true;
  const db = useDb();
  const started = Date.now();
  try {
    const res = await db.transaction(async (tx) => {
      const got = (await tx.execute(sql`select pg_try_advisory_xact_lock(${LOCK}) as ok`)).rows[0] as { ok: boolean };
      if (!got.ok) return { skipped: 'another process is ingesting' };
      const src = await newLines(tx, file);
      if (!src) return { skipped: `no log file at ${file}` };
      const ctx: ClassifyContext = {
        siteUrl: cfg.siteUrl, staffIps: await staffIps(tx), cache: new Map(),
        salt: (() => { const m = new Map<string, string>(); return async (day: string) => m.get(day) ?? (m.set(day, await saltFor(tx, day)), m.get(day)!); })(),
      };
      const hits: HitRow[] = [];
      const daily = new Map<string, { date: string; host: string; grp: string; class: string; n: number }>();
      let bad = 0;
      let first: Date | null = null;
      for (const line of src.lines) {
        let l: LogLine;
        try { l = JSON.parse(line); } catch { bad++; continue; }
        const p = await prepare(l, ctx);
        if (!p) { bad++; continue; }
        const k = `${p.daily.date}|${p.daily.host}|${p.daily.grp}|${p.daily.class}`;
        const d = daily.get(k) ?? { ...p.daily, n: 0 };
        d.n++; daily.set(k, d);
        if (p.hit) { hits.push(p.hit); if (!first || p.hit.at < first) first = p.hit.at; }
      }
      for (let i = 0; i < hits.length; i += 1000) await tx.insert(trafficHits).values(hits.slice(i, i + 1000));
      for (const d of daily.values()) {
        await tx.insert(trafficDaily).values({ date: d.date, host: d.host, grp: d.grp, class: d.class, requests: d.n })
          .onConflictDoUpdate({ target: [trafficDaily.date, trafficDaily.host, trafficDaily.grp, trafficDaily.class], set: { requests: sql`${trafficDaily.requests} + ${d.n}` } });
      }
      await src.save();
      const since = new Date(Math.min(first?.getTime() ?? Date.now(), Date.now() - 2 * 3_600_000) - 30 * 60_000);
      const conf = await confirmPages(tx, since);
      return { lines: src.lines.length, stored: hits.length, bad, ...conf, ms: Date.now() - started };
    });
    // beacon matching upgrades unconfirmed → human after the daily counters were written; the report reads people
    // from traffic_hits, so the counters carry volume (assets, app and API traffic) only.
    if ('skipped' in res) { await recordRun(db, 'traffic', false, 0, String(res.skipped)); return res; }
    await recordRun(db, 'traffic', true, res.stored, JSON.stringify(res));
    return res;
  } catch (err) {
    console.error('[traffic] ingest failed:', (err as Error).message);
    await recordRun(db, 'traffic', false, 0, String(err)).catch(() => {});
    throw err;
  } finally {
    running = false;
  }
}
