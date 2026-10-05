import { RESERVED } from '../utils/slug';
import { eventRowBySlug } from '../utils/public';

/**
 * A guest page opened by a slug the event has since given up (a paid rename)
 * is sent, permanently, to the event's current address — so a printed QR or
 * a WhatsApp link from before the rename lands on the right kad, and search
 * engines learn the new one. Only GETs of the guest page shapes are looked at.
 */
const PAGE = /^\/(?:(tv|embed)\/)?([a-z0-9-]{3,60})(\/(?:gambar|rsvp|ucapan|tempat))?\/?$/;

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') return;
  const [path, query = ''] = (event.node.req.url ?? '').split('?');
  const m = PAGE.exec(path!);
  if (!m) return;
  const [, prefix, slug, sub = ''] = m;
  if (!prefix && RESERVED.has(slug!)) return;
  const ev = await eventRowBySlug(slug!);
  if (!ev || ev.slug === slug || ev.deletedAt || ev.purgedAt) return;
  return sendRedirect(event, `${prefix ? `/${prefix}` : ''}/${ev.slug}${sub}${query ? `?${query}` : ''}`, 301);
});
