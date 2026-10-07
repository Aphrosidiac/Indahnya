import {
  S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, CopyObjectCommand,
  CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';
import { contentDisposition } from './disposition';

/**
 * R2 through the S3 API. Locally this is Garage; the code does not know.
 * Uploads never pass through the app: the browser PUTs to a presigned URL.
 *
 * TWO buckets, because a public R2 custom domain serves everything in its
 * bucket and a key is only as secret as the least careful person holding a
 * link to its neighbour:
 *
 *   public  — the served copies of `ready` media and nothing else. This is
 *             the one behind media.indahnya.my.
 *   private — originals (full EXIF, GPS included) and the served copies of
 *             `hidden` media. Reached only through the app: presigned GETs
 *             for the host, streamed for the zip.
 *
 * Hiding a photo MOVES its served copies from public to private, so a link
 * someone already copied stops working, and cannot be guessed back.
 */
export type Where = 'public' | 'private';

let _client: S3Client | undefined;
function cfg() { return useRuntimeConfig().s3; }
export function s3() {
  if (!_client) {
    const c = cfg();
    _client = new S3Client({
      region: c.region,
      endpoint: c.endpoint,
      forcePathStyle: true,
      /** Flexible checksums would sign a CRC the browser never sends; Garage and R2 both reject the PUT. */
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
    });
  }
  return _client;
}

export const bucket = (w: Where) => (w === 'public' ? cfg().bucket : cfg().privateBucket);
export const publicUrl = (key: string) => `${cfg().publicBase}/${key}`;

/** How long a guest's phone has to finish a PUT. Long enough to wait out a dead venue wifi. */
export const PUT_TTL_SEC = 3 * 3600;

/**
 * Served copies are cached for an hour, not a year. Hiding, deleting and
 * purging remove the object, and a long-lived edge or browser copy would
 * keep it reachable: an hour is the most a hidden photo can outlive its
 * hide (and Cloudflare's copy goes at once when cdnPurge is configured).
 */
export const MEDIA_CACHE = 'public, max-age=3600';

/** Files over this go up in parts, so a dropped connection retries one part, not 100 MB. */
export const MULTIPART_MIN = 16 * 1024 * 1024;
export const PART_SIZE = 8 * 1024 * 1024;

/**
 * Originals only, so always the private bucket. Content-Length IS signed:
 * the browser sends the file's exact size, and a PUT of any other size is
 * refused by the store — nobody can turn a 3 MB slot into a 5 GB one.
 */
export async function presignPut(key: string, contentType: string, bytes: number) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket('private'), Key: key, ContentType: contentType, ContentLength: bytes }), {
    expiresIn: PUT_TTL_SEC,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
}

/** A short-lived read for something the public cannot see (a hidden photo, an original). */
export async function presignGet(key: string, where: Where, opts: { seconds?: number; filename?: string } = {}) {
  return getSignedUrl(s3(), new GetObjectCommand({
    Bucket: bucket(where), Key: key,
    ...(opts.filename ? { ResponseContentDisposition: contentDisposition(opts.filename) } : {}),
  }), { expiresIn: opts.seconds ?? 3600 });
}

export async function head(key: string, where: Where) {
  try { return await s3().send(new HeadObjectCommand({ Bucket: bucket(where), Key: key })); }
  catch (e: unknown) { if ((e as { name?: string }).name === 'NotFound' || (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null; throw e; }
}

export async function getBuffer(key: string, where: Where) {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(where), Key: key }));
  const chunks: Buffer[] = [];
  for await (const c of r.Body as Readable) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

export async function getStream(key: string, where: Where) {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(where), Key: key }));
  return r.Body as Readable;
}

export async function put(key: string, body: Buffer, contentType: string, where: Where, cacheControl = MEDIA_CACHE) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(where), Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
}

/**
 * Same key, other bucket. Copy then delete, so a crash in between leaves two
 * copies, never none — and re-running a half-done move finishes it: a source
 * that is already gone is fine when the destination has the object.
 */
export async function move(key: string, from: Where, to: Where) {
  if (from === to) return;
  try {
    await s3().send(new CopyObjectCommand({ Bucket: bucket(to), CopySource: `${bucket(from)}/${encodeURIComponent(key).replace(/%2F/g, '/')}`, Key: key }));
  } catch (e) {
    if (await head(key, to)) return;
    throw e;
  }
  await del([key], from);
}

export async function del(keys: string[], where: Where) {
  for (let i = 0; i < keys.length; i += 1000) {
    const slice = keys.slice(i, i + 1000);
    if (!slice.length) continue;
    await s3().send(new DeleteObjectsCommand({ Bucket: bucket(where), Delete: { Objects: slice.map(Key => ({ Key })), Quiet: true } }));
  }
}

/** Delete wherever it is. For rows whose last status we no longer trust (deleted, purged). */
export async function delEverywhere(keys: string[]) {
  await Promise.all([del(keys, 'public'), del(keys, 'private')]);
}

/** Keys with their age, for cleaning up what nothing points at any more. */
export async function listDated(prefix: string, where: Where) {
  const out: { key: string; at: Date }[] = [];
  let token: string | undefined;
  do {
    const r = await s3().send(new ListObjectsV2Command({ Bucket: bucket(where), Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents ?? []) if (o.Key) out.push({ key: o.Key, at: o.LastModified ?? new Date(0) });
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function listAll(prefix: string, where: Where) {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const r = await s3().send(new ListObjectsV2Command({ Bucket: bucket(where), Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/**
 * Multipart upload for large originals. Each part URL signs that part's exact
 * Content-Length, so the same rule as a single PUT holds: nobody sends more
 * than they declared. The bucket's CORS must expose ETag (the browser hands
 * each part's ETag back to complete the upload).
 */
export async function createMultipart(key: string, contentType: string) {
  const r = await s3().send(new CreateMultipartUploadCommand({ Bucket: bucket('private'), Key: key, ContentType: contentType }));
  if (!r.UploadId) throw new Error('no UploadId');
  return r.UploadId;
}

export function partPlan(bytes: number) {
  const parts: { n: number; size: number }[] = [];
  for (let off = 0, n = 1; off < bytes; off += PART_SIZE, n++) parts.push({ n, size: Math.min(PART_SIZE, bytes - off) });
  return parts;
}

export async function presignParts(key: string, uploadId: string, bytes: number) {
  return Promise.all(partPlan(bytes).map(async p => ({
    n: p.n, size: p.size,
    url: await getSignedUrl(s3(), new UploadPartCommand({ Bucket: bucket('private'), Key: key, UploadId: uploadId, PartNumber: p.n, ContentLength: p.size }), {
      expiresIn: PUT_TTL_SEC, signableHeaders: new Set(['content-length']),
    }),
  })));
}

export async function completeMultipart(key: string, uploadId: string, parts: { n: number; etag: string }[]) {
  await s3().send(new CompleteMultipartUploadCommand({
    Bucket: bucket('private'), Key: key, UploadId: uploadId,
    MultipartUpload: { Parts: [...parts].sort((a, b) => a.n - b.n).map(p => ({ PartNumber: p.n, ETag: p.etag })) },
  }));
}

export async function abortMultipart(key: string, uploadId: string) {
  try { await s3().send(new AbortMultipartUploadCommand({ Bucket: bucket('private'), Key: key, UploadId: uploadId })); }
  catch { /* already completed or aborted */ }
}

/**
 * Drop public URLs from Cloudflare's edge cache at once, when a zone id and a
 * token with Cache Purge permission are configured. Best effort: with
 * MEDIA_CACHE the copies expire within the hour anyway. 30 URLs a call is
 * what every Cloudflare plan accepts.
 */
export async function cdnPurge(keys: string[]) {
  const { cloudflare } = useRuntimeConfig();
  if (!cloudflare.zoneId || !cloudflare.apiToken || !keys.length) return;
  const urls = [...new Set(keys)].map(publicUrl);
  for (let i = 0; i < urls.length; i += 30) {
    try {
      const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${cloudflare.zoneId}/purge_cache`, {
        method: 'POST',
        headers: { authorization: `Bearer ${cloudflare.apiToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ files: urls.slice(i, i + 30) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) console.error('[cdn] purge failed', r.status, (await r.text()).slice(0, 200));
    } catch (e) { console.error('[cdn] purge failed', (e as Error).message); }
  }
}
