// Sets CORS on the dev buckets so the browser can PUT to presigned URLs
// (originals go to the private bucket) and read the public one.
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
const raw = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
/** NUXT_S3_* (the app's names) or the bare S3_* ones. */
const env = new Proxy(raw, { get: (o, k) => o[`NUXT_${String(k)}`] ?? o[k] });
const c = new S3Client({ region: env.S3_REGION, endpoint: env.S3_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } });
const origin = env.PUBLIC_SITE_URL || 'http://localhost:3180';
for (const Bucket of [env.S3_BUCKET, env.S3_PRIVATE_BUCKET || 'indahnya-private']) {
  await c.send(new PutBucketCorsCommand({ Bucket, CORSConfiguration: { CORSRules: [{ AllowedOrigins: [origin], AllowedMethods: ['GET', 'PUT', 'HEAD'], AllowedHeaders: ['content-type', 'content-length'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 3600 }] } }));
  console.log('cors set on', Bucket, 'for', origin);
}
