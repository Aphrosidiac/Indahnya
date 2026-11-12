/**
 * Indahnya analytics from a terminal (docs/ANALYTICS.md). On the box it runs as the app user with the server env,
 * from the live release (tsx is a dev dependency, installed by the release's `npm ci`):
 *   cd /srv/indahnya/current && node --env-file=/etc/indahnya/env --import tsx scripts/metrics-cli.ts report --days 7 [--json]
 * From the Mac: scripts/metrics.sh report 7 | json 30 | ingest | search | sql "SELECT …"
 *
 *   report [--days N] [--json]   the full report (markdown, or JSON with --json)
 *   ingest                        read the traffic log now (normally every 10 minutes)
 *   search                        pull Google and Bing now (normally twice a day)
 *   sql "<SELECT …>"              any read-only query; rows as JSON. Tables: traffic_hits, traffic_daily,
 *                                 search_daily, collector_runs, users (signup_* columns), events, payments …
 */
import { sql } from 'drizzle-orm';
import { useDb } from '../server/db';
import { trafficConfigFromEnv } from '../server/utils/traffic/config';
import { buildReport, reportMarkdown } from '../server/utils/traffic/report';
import { ingestTraffic } from '../server/utils/traffic/ingest';
import { pullSearch } from '../server/utils/traffic/search';

const [cmd = 'report', ...rest] = process.argv.slice(2);
const flag = (name: string) => rest.includes(`--${name}`);
const value = (name: string) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const json = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? Number(x) : x), 2);

async function main() {
  const cfg = trafficConfigFromEnv();
  if (cmd === 'report') {
    const r = await buildReport(cfg, { days: Number(value('days') ?? rest.find(a => /^\d+$/.test(a)) ?? 30) });
    process.stdout.write(flag('json') ? json(r) : reportMarkdown(r));
  } else if (cmd === 'ingest') process.stdout.write(json(await ingestTraffic(cfg, value('file'))));
  else if (cmd === 'search') process.stdout.write(json(await pullSearch(cfg, Number(value('days') ?? 16))));
  else if (cmd === 'sql') {
    const q = rest.filter(a => !a.startsWith('--')).join(' ').trim();
    if (!/^\s*(select|with)\b/i.test(q)) throw new Error('Only SELECT / WITH queries.');
    // a read-only transaction: even a WITH … DELETE is refused by Postgres
    const rows = await useDb().transaction(async (tx) => {
      await tx.execute(sql`SET TRANSACTION READ ONLY`);
      return (await tx.execute(sql.raw(q))).rows;
    });
    process.stdout.write(json(rows));
  } else throw new Error(`Unknown command ${cmd}. Use report, ingest, search or sql.`);
  process.stdout.write('\n');
}

main().then(() => process.exit(0)).catch((err) => { console.error(String(err?.message ?? err)); process.exit(1); });
