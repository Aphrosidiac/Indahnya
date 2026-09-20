import { ulid } from 'ulid';
import { randomBytes } from 'node:crypto';

export const newId = () => ulid();
/** 32 url-safe chars, ~190 bits — for cookies and bearer tokens. */
export const newToken = () => randomBytes(24).toString('base64url');
