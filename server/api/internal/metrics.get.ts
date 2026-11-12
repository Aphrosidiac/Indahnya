import { requireStaff } from '../../utils/traffic/auth';
import { trafficConfig } from '../../utils/traffic/config';
import { buildReport, reportMarkdown } from '../../utils/traffic/report';

/**
 * GET /api/internal/metrics?days=30[&format=md]: the analytics report (docs/ANALYTICS.md).
 * Staff session only (NUXT_STAFF_EMAILS); never open to anyone else.
 */
export default defineEventHandler(async (event) => {
  await requireStaff(event);
  const q = getQuery(event);
  const report = await buildReport(trafficConfig(useRuntimeConfig()), { days: Number(q.days) || 30 });
  setHeader(event, 'cache-control', 'no-store');
  if (q.format === 'md') {
    setHeader(event, 'content-type', 'text/markdown; charset=utf-8');
    return reportMarkdown(report);
  }
  return report;
});
