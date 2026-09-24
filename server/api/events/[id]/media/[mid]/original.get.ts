import { and, eq } from 'drizzle-orm';
import { useDb, media, guests } from '../../../../../db';
import { requireEventAccess } from '../../../../../utils/session';
import { presignGet } from '../../../../../utils/storage';
import { downloadName, extOf, servedWhere } from '../../../../../utils/media';

/** The host's "Download": the original for a photo, the playable copy for a video, as an attachment. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(eq(media.id, getRouterParam(event, 'mid')!), eq(media.eventId, ev.id)));
  if (!row || !['ready', 'hidden'].includes(row.m.status)) throw createError({ statusCode: 404 });
  const { m } = row;
  const [key, where] = m.kind === 'photo' ? [m.originalKey, 'private' as const] : m.key ? [m.key, servedWhere(m.status)] : [m.originalKey, 'private' as const];
  return sendRedirect(event, await presignGet(key, where, { seconds: 300, filename: downloadName(m, extOf(key), row.guestName) }));
});
