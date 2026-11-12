import { ingestTraffic } from '../utils/traffic/ingest';
import { pullSearchIfDue } from '../utils/traffic/search';
import { trafficConfig } from '../utils/traffic/config';

/**
 * Every 10 minutes, from the worker process (server/plugins/worker.ts): read what nginx logged since last time
 * (docs/ANALYTICS.md), then pull Google/Bing if the last pull is over 12 hours old. Both are quiet when there is
 * nothing to do: no log file (dev), no credentials ("not configured" is recorded and shown in the report).
 */
export async function trafficTick() {
  const cfg = trafficConfig(useRuntimeConfig());
  await ingestTraffic(cfg).catch(e => console.error('[traffic]', (e as Error).message));
  await pullSearchIfDue(cfg).catch(e => console.error('[search]', (e as Error).message));
}
