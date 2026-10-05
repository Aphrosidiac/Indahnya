import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb, messages, guests } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { ensureGuest } from '../../../../utils/guest';
import { newId } from '../../../../utils/ids';
import { readBodyAs } from '../../../../utils/validate';
import { rateLimit, clientIp } from '../../../../utils/rate';

const Body = z.object({ name: z.string().trim().max(60).optional(), body: z.string().trim().min(1, 'Tulis sesuatu dulu').max(500) });

/** A written wish. In approval mode it waits, hidden, for the host. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.ucapan || ev.settings.demo) throw createError({ statusCode: 403, statusMessage: 'Ucapan ditutup' });
  const b = await readBodyAs(event, Body);
  // per IP first (a dewan is one wifi, so generous): a client that drops its cookie is a new guest every time
  await rateLimit(`ucapan:ip:${clientIp(event)}`, 120, 10 * 60_000);
  const g = await ensureGuest(event, ev.id);
  await rateLimit(`ucapan:${g.id}`, 10, 10 * 60_000);
  const name = b.name || g.name || null;
  if (b.name && b.name !== g.name) await useDb().update(guests).set({ name: b.name }).where(eq(guests.id, g.id));
  const status = ev.settings.approvalMode ? 'hidden' as const : 'visible' as const;
  const [m] = await useDb().insert(messages).values({ id: newId(), eventId: ev.id, guestId: g.id, name, kind: 'text', body: b.body, status }).returning();
  return { id: m!.id, status };
});
