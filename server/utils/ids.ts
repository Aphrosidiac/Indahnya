import { ulid } from 'ulid';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export const newId = () => ulid();
/** 32 url-safe chars, ~190 bits — for cookies and bearer tokens. */
export const newToken = () => randomBytes(24).toString('base64url');
/** What the database stores for a bearer token: its SHA-256. A leaked table or backup holds no usable token. */
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
/** Compare two secrets without leaking, through timing, how much of one matched. */
export function sameSecret(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
