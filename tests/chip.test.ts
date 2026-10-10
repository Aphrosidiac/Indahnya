import { describe, it, expect } from 'vitest';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { verifySignature, isPaid, isDead } from '../server/utils/chip';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const sign = (body: string) => createSign('RSA-SHA256').update(body).sign(privateKey, 'base64');

describe('CHIP signatures (RSA PKCS#1 v1.5, SHA-256 over the raw body)', () => {
  const body = JSON.stringify({ id: 'p1', status: 'paid', event_type: 'purchase.paid' });

  it('accepts the raw body it was signed over', () => {
    expect(verifySignature(Buffer.from(body), sign(body), pem)).toBe(true);
  });

  it('accepts a key stored on one line with literal \\n (how env files carry it)', () => {
    expect(verifySignature(Buffer.from(body), sign(body), pem.trim().replace(/\n/g, '\\n'))).toBe(true);
  });

  it('rejects a body changed after signing, even if it parses to the same JSON', () => {
    const reformatted = JSON.stringify(JSON.parse(body), null, 1);
    expect(verifySignature(Buffer.from(reformatted), sign(body), pem)).toBe(false);
    expect(verifySignature(Buffer.from(body.replace('paid', 'p4id')), sign(body), pem)).toBe(false);
  });

  it('rejects a missing or garbage signature, and a missing key, without throwing', () => {
    expect(verifySignature(Buffer.from(body), undefined, pem)).toBe(false);
    expect(verifySignature(Buffer.from(body), 'not-base64!!', pem)).toBe(false);
    expect(verifySignature(Buffer.from(body), sign(body), '')).toBe(false);
    expect(verifySignature(Buffer.from(body), sign(body), 'not a key')).toBe(false);
  });

  it('rejects a signature from another key', () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    expect(verifySignature(Buffer.from(body), createSign('RSA-SHA256').update(body).sign(other, 'base64'), pem)).toBe(false);
  });
});

describe('CHIP statuses', () => {
  it('counts the later states of a paid card purchase as paid', () => {
    expect(['paid', 'cleared', 'settled'].every(s => isPaid(s as never))).toBe(true);
    expect(isPaid('pending_execute')).toBe(false);
    expect(isPaid('refunded')).toBe(false);
  });

  it('never treats a failed attempt as the end: the buyer can retry on the same checkout', () => {
    expect(isDead('error')).toBe(false);
    expect(isDead('pending_execute')).toBe(false);
    expect(['cancelled', 'expired', 'blocked'].every(s => isDead(s as never))).toBe(true);
  });
});
