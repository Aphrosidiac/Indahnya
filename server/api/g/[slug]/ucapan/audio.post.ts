import { z } from 'zod';
import { and, count, eq } from 'drizzle-orm';
import { useDb, messages } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { ensureGuest } from '../../../../utils/guest';
import { newId } from '../../../../utils/ids';
import { presignPut } from '../../../../utils/storage';
import { readBodyAs } from '../../../../utils/validate';
import { rateLimit, clientIp } from '../../../../utils/rate';
import { MEDIA_LIMITS } from '../../../../utils/plans';

const TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav'];
const Body = z.object({ name: z.string().trim().max(60).optional(), type: z.string().max(80), bytes: z.number().int().positive() });

/** Step 1 of a voice ucapan: a pending wish and a signed slot for the recording. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.ucapan || ev.settings.demo) throw createError({ statusCode: 403, statusMessage: 'Ucapan ditutup' });
  const b = await readBodyAs(event, Body);
  const type = b.type.toLowerCase().split(';')[0]!.trim();
  if (!TYPES.includes(type)) throw createError({ statusCode: 400, statusMessage: 'Format rakaman tak disokong' });
  if (b.bytes > MEDIA_LIMITS.audioBytes) throw createError({ statusCode: 413, statusMessage: 'Rakaman terlalu besar' });
  // per IP first (a dewan is one wifi, so generous): a client that drops its cookie is a new guest every time
  await rateLimit(`ucapan:ip:${clientIp(event)}`, 120, 10 * 60_000);
  const g = await ensureGuest(event, ev.id);
  await rateLimit(`ucapan:${g.id}`, 10, 10 * 60_000);
  const [open] = await useDb().select({ n: count() }).from(messages).where(and(eq(messages.guestId, g.id), eq(messages.status, 'pending')));
  if (Number(open?.n ?? 0) >= 3) throw createError({ statusCode: 429, statusMessage: 'Tunggu rakaman tadi siap dulu' });
  const id = newId();
  const audioSrcKey = `events/${ev.id.toLowerCase()}/ucapan-src/${id.toLowerCase()}`;
  await useDb().insert(messages).values({ id, eventId: ev.id, guestId: g.id, name: b.name || g.name || null, kind: 'audio', status: 'pending', audioSrcKey });
  return { id, url: await presignPut(audioSrcKey, type, b.bytes), type };
});
