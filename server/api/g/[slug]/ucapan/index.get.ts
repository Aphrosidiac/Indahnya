import { and, desc, eq, lt } from 'drizzle-orm';
import { useDb, messages } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { currentGuest } from '../../../../utils/guest';
import { publicUrl } from '../../../../utils/storage';

/** The wishes feed: visible ucapan only, newest first, 30 a page. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  if (!ev.settings.modules.ucapan) throw createError({ statusCode: 404, statusMessage: 'Ucapan ditutup' });
  const q = getQuery(event);
  const me = await currentGuest(event, ev.id);
  const limit = Math.min(Math.max(Math.trunc(Number(q.limit)) || 30, 1), 60);
  const where = [eq(messages.eventId, ev.id), eq(messages.status, 'visible')];
  if (typeof q.cursor === 'string' && q.cursor) where.push(lt(messages.id, q.cursor));
  const rows = await useDb().select().from(messages).where(and(...where)).orderBy(desc(messages.id)).limit(limit + 1);
  const deleteWindow = ev.settings.guestDeleteHours * 3_600_000;
  const items = rows.slice(0, limit).map(m => ({
    id: m.id, name: m.name, kind: m.kind, body: m.body, createdAt: m.createdAt, durationSec: m.durationSec,
    audio: m.audioKey ? publicUrl(m.audioKey) : null,
    canDelete: !!me && m.guestId === me.id && Date.now() - m.createdAt.getTime() < deleteWindow,
  }));
  return { items, next: rows.length > limit ? items[items.length - 1]!.id : null };
});
