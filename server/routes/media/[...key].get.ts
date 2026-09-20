import { getStream, head } from '../../utils/storage';

/**
 * DEV ONLY: streams objects out of the local bucket so the browser has a
 * public URL to load. In production S3_PUBLIC_BASE is the R2 custom domain
 * and this route is never reached.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  const key = getRouterParam(event, 'key')!;
  const h = await head(key);
  if (!h) throw createError({ statusCode: 404 });
  setHeader(event, 'content-type', h.ContentType || 'application/octet-stream');
  if (h.ContentLength) setHeader(event, 'content-length', h.ContentLength);
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return sendStream(event, await getStream(key));
});
