/**
 * One-off, for any environment that holds media from before the two-bucket
 * split (2026-09-24): moves every original, and the served copies of hidden
 * media (then stored as `hidden/<key>` in the public bucket), into the
 * private bucket, and strips the `hidden/` prefix from the rows. Idempotent:
 * objects already moved are skipped.
 *
 *   node --env-file=.env --import tsx scripts/migrate-split-buckets.ts
 */
import { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { useDb, media } from '../server/db';

const env = process.env;
const v = (k: string) => env[`NUXT_${k}`] ?? env[k];
const s3 = new S3Client({
  region: v('S3_REGION') || 'auto', endpoint: v('S3_ENDPOINT'), forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: v('S3_ACCESS_KEY_ID')!, secretAccessKey: v('S3_SECRET_ACCESS_KEY')! },
});
const PUB = v('S3_BUCKET') || 'indahnya-media';
const PRIV = v('S3_PRIVATE_BUCKET') || 'indahnya-private';
const exists = (Bucket: string, Key: string) => s3.send(new HeadObjectCommand({ Bucket, Key })).then(() => true, () => false);

async function mv(key: string, newKey = key) {
  if (!(await exists(PUB, key))) return false;
  await s3.send(new CopyObjectCommand({ Bucket: PRIV, CopySource: `${PUB}/${key}`, Key: newKey }));
  await s3.send(new DeleteObjectCommand({ Bucket: PUB, Key: key }));
  return true;
}

const db = useDb();
let moved = 0;
for (const m of await db.select().from(media)) {
  if (await mv(m.originalKey)) moved++;
  const strip = (k: string | null) => k?.replace(/^hidden\//, '') ?? null;
  if (m.status === 'hidden') {
    for (const k of [m.key, m.thumbKey, m.posterKey].filter((k, i, a): k is string => !!k && a.indexOf(k) === i)) if (await mv(k, strip(k)!)) moved++;
  }
  if ([m.key, m.thumbKey, m.posterKey].some(k => k?.startsWith('hidden/'))) {
    await db.update(media).set({ key: strip(m.key), thumbKey: strip(m.thumbKey), posterKey: strip(m.posterKey) }).where(eq(media.id, m.id));
  }
}
console.log(`moved ${moved} objects to ${PRIV}`);
process.exit(0);
