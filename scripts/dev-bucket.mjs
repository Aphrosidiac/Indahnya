// Sets CORS on the dev bucket so the browser can PUT to presigned URLs.
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => l.split('=')));
const c = new S3Client({ region: env.S3_REGION, endpoint: env.S3_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } });
await c.send(new PutBucketCorsCommand({ Bucket: env.S3_BUCKET, CORSConfiguration: { CORSRules: [{ AllowedOrigins: ['*'], AllowedMethods: ['GET', 'PUT', 'HEAD'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 3600 }] } }));
console.log('cors set on', env.S3_BUCKET);
