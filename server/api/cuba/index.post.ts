import { z } from 'zod';
import { useDb, guests } from '../../db';
import { currentGuest, adoptGuest } from '../../utils/guest';
import { newId, newToken } from '../../utils/ids';
import { sandboxEvent, sandboxGuest, SANDBOX } from '../../utils/sandbox';
import { readBodyAs } from '../../utils/validate';
import { rateLimit, clientIp } from '../../utils/rate';

const Body = z.object({ k: z.string().max(64).optional() });

/**
 * Start (or join) a "cuba sekarang" session. Without `k`: this browser
 * becomes a sandbox visitor and gets back the token the landing puts in its
 * QR. With `k` (the phone that scanned it): this browser adopts that visitor.
 */
export default defineEventHandler(async (event) => {
  await rateLimit(`cuba:ip:${clientIp(event)}`, 30, 60 * 60_000);
  const { k } = await readBodyAs(event, Body);
  const ev = await sandboxEvent();
  if (k) {
    const g = await sandboxGuest(k);
    if (!g) throw createError({ statusCode: 410, statusMessage: 'QR ni dah tamat. Refresh page tu dan scan semula.' });
    adoptGuest(event, ev.id, g.token);
    return { slug: SANDBOX.slug, name: g.name, expiresAt: new Date(g.createdAt.getTime() + SANDBOX.ttlMs), perVisitor: SANDBOX.perVisitor };
  }
  // the same visitor while its hour has room left; otherwise a fresh one, never a token about to die
  let g = await currentGuest(event, ev.id);
  if (!g || Date.now() - g.createdAt.getTime() >= SANDBOX.ttlMs - 10 * 60_000) {
    const [fresh] = await useDb().insert(guests).values({ id: newId(), eventId: ev.id, token: newToken() }).returning();
    g = fresh!;
    adoptGuest(event, ev.id, g.token);
  }
  return { slug: SANDBOX.slug, k: g.token, name: g.name, expiresAt: new Date(g.createdAt.getTime() + SANDBOX.ttlMs), perVisitor: SANDBOX.perVisitor };
});
