import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';

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
    ...(opts.filename ? { ResponseContentDisposition: `attachment; filename="${opts.filename.replace(/["\\\r\n]/g, '')}"` } : {}),
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

export async function put(key: string, body: Buffer, contentType: string, where: Where, cacheControl = 'public, max-age=31536000, immutable') {
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
