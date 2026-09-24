import { getStream, head } from '../../utils/storage';

/**
 * DEV ONLY: stands in for the public bucket's custom domain, so the browser
 * has a URL to load. It reads the PUBLIC bucket and nothing else — exactly
 * what media.indahnya.my will expose — so a leak of the private bucket shows
 * up here as a 404, in dev, before it ships. In production S3_PUBLIC_BASE is
 * the R2 custom domain and this route is never reached.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  const key = getRouterParam(event, 'key')!;
  const h = await head(key, 'public');
  if (!h) throw createError({ statusCode: 404 });
  setHeader(event, 'content-type', h.ContentType || 'application/octet-stream');
  if (h.ContentLength) setHeader(event, 'content-length', h.ContentLength);
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return sendStream(event, await getStream(key, 'public'));
});
