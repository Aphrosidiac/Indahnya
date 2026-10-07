import { createHash } from 'node:crypto';
import { and, desc, eq, gt, inArray } from 'drizzle-orm';
import { useDb, media, guests } from '../../db';
import { publicUrl } from '../../utils/storage';
import { eventRowBySlug } from '../../utils/public';
import { sameSecret } from '../../utils/ids';

/**
 * The slideshow feed. Bearer is the event's tvToken (in the URL the host
 * copies to the venue laptop). `since` returns only what landed after that
 * id, so the screen polls cheaply every few seconds and new photos join the
 * rotation as they arrive.
 *
 * `live` is every id still on show. The screen drops anything not in it,
 * so a photo the host hides mid-majlis leaves the TV within one poll — not
 * whenever the laptop is next reloaded. It is sent only when it changed:
 * the screen passes back `liveTag`, and an unchanged list is just the tag
 * (3,000 ids every few seconds is most of a poll's bytes).
 */
const LIVE_MAX = 3000;

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!.toLowerCase();
  const q = getQuery(event);
  const ev = await eventRowBySlug(slug);
  if (!ev || ev.purgedAt || ev.deletedAt || typeof q.token !== 'string' || !sameSecret(q.token, ev.tvToken)) throw createError({ statusCode: 404, statusMessage: 'Link TV tak sah' });
  const base = [eq(media.eventId, ev.id), eq(media.status, 'ready')];
  /**
   * `ids` fetches specific photos: ones that are live but OLDER than the
   * newest on screen — approved in approval mode, shown again after a hide,
   * a video that finished processing after a later photo. `since` alone
   * would never return them.
   */
  const ids = typeof q.ids === 'string' ? q.ids.split(',').filter(Boolean).slice(0, 100) : [];
  const where = ids.length ? [...base, inArray(media.id, ids)]
    : typeof q.since === 'string' && q.since ? [...base, gt(media.id, q.since)] : base;
  const [rows, live] = await Promise.all([
    useDb().select({ m: media, guestName: guests.name }).from(media)
      .leftJoin(guests, eq(guests.id, media.guestId))
      .where(and(...where)).orderBy(desc(media.id)).limit(500),
    useDb().select({ id: media.id }).from(media).where(and(...base)).orderBy(desc(media.id)).limit(LIVE_MAX),
  ]);
  const ids2 = live.map(r => r.id);
  const liveTag = createHash('sha1').update(ids2.join(',')).digest('base64url').slice(0, 16);
  return {
    event: { title: ev.title, names: ev.names, type: ev.type, slug: ev.slug, locale: ev.settings.locale, settings: ev.settings.slideshow },
    items: rows.filter(r => r.m.key).map(({ m, guestName }) => ({
      id: m.id, kind: m.kind, width: m.width, height: m.height, guestName,
      url: publicUrl(m.key!), poster: m.posterKey ? publicUrl(m.posterKey) : null,
    })),
    liveTag,
    ...(q.liveTag === liveTag ? {} : { live: ids2 }),
  };
});
