/**
 * The analytics beacon's endpoint (app/plugins/traffic-beacon.client.ts → POST /_e?p=…). It records nothing here:
 * nginx logs the request line, query included, and answers 204 itself (deploy/nginx.conf); the ingest job reads
 * the log. This route is the same answer for dev and for any run without that nginx rule. Never cached.
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 204);
  setHeader(event, 'cache-control', 'no-store');
  return null;
});
