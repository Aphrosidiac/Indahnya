import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, guests } from '../../../db';
import { eventBySlug } from '../../../utils/public';
import { ensureGuest } from '../../../utils/guest';
import { readBodyAs } from '../../../utils/validate';
import { rateLimit, clientIp } from '../../../utils/rate';

const Body = z.object({ name: z.string().trim().max(60).transform(v => v.replace(/[\u0000-\u001f\u007f]/g, '')) });

/** The optional "nama anda" on first upload. Empty clears it. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event, { sandbox: true });
  const { name } = await readBodyAs(event, Body);
  // per address before a guest row can be minted: a client that drops its cookie is a new guest every time
  await rateLimit(`name:ip:${clientIp(event)}`, 120, 10 * 60_000);
  const g = await ensureGuest(event, ev.id);
  const [row] = await useDb().update(guests).set({ name: name || null }).where(eq(guests.id, g.id)).returning();
  return { id: row!.id, name: row!.name };
});
