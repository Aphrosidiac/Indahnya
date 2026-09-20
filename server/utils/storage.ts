import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';

/**
 * R2 through the S3 API. Locally this is MinIO; the code does not know.
 * Uploads never pass through the app: the browser PUTs to a presigned URL.
 */
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

export const bucket = () => cfg().bucket;
export const publicUrl = (key: string) => `${cfg().publicBase}/${key}`;

/** Content-Length is deliberately NOT signed: the size is enforced by a HEAD on completion instead. */
export async function presignPut(key: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: 900 });
}

export async function head(key: string) {
  try { return await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key })); }
  catch (e: unknown) { if ((e as { name?: string }).name === 'NotFound') return null; throw e; }
}

export async function getBuffer(key: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const chunks: Buffer[] = [];
  for await (const c of r.Body as Readable) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

export async function getStream(key: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return r.Body as Readable;
}

export async function put(key: string, body: Buffer, contentType: string, cacheControl = 'public, max-age=31536000, immutable') {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
}

export async function move(from: string, to: string) {
  await s3().send(new CopyObjectCommand({ Bucket: bucket(), CopySource: `${bucket()}/${from}`, Key: to }));
  await del([from]);
}

export async function del(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const slice = keys.slice(i, i + 1000);
    if (!slice.length) continue;
    await s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: slice.map(Key => ({ Key })), Quiet: true } }));
  }
}

export async function listAll(prefix: string) {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const r = await s3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}
