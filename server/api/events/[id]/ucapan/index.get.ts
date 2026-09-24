import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { useDb, messages } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { publicUrl, presignGet } from '../../../../utils/storage';

const STATES = ['visible', 'hidden', 'failed'] as const;

/** The host's wishes: visible and hidden (hidden voice notes through a signed URL), newest first. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const q = getQuery(event);
  const wanted = typeof q.status === 'string' && (STATES as readonly string[]).includes(q.status) ? [q.status as typeof STATES[number]] : ['visible', 'hidden'] as const;
  const where = [eq(messages.eventId, ev.id), inArray(messages.status, [...wanted])];
  if (typeof q.cursor === 'string' && q.cursor) where.push(lt(messages.id, q.cursor));
  const limit = 60;
  const rows = await useDb().select().from(messages).where(and(...where)).orderBy(desc(messages.id)).limit(limit + 1);
  const items = await Promise.all(rows.slice(0, limit).map(async m => ({
    id: m.id, name: m.name, kind: m.kind, body: m.body, status: m.status, createdAt: m.createdAt, durationSec: m.durationSec,
    audio: !m.audioKey ? null : m.status === 'visible' ? publicUrl(m.audioKey) : await presignGet(m.audioKey, 'private'),
  })));
  return { items, next: rows.length > limit ? items[items.length - 1]!.id : null };
});
