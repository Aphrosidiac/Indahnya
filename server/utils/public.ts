import { eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { useDb, events } from '../db';

/** Resolve a public slug to a live event, or 404. Purged and deleted events are gone to guests. */
export async function eventBySlug(event: H3Event) {
  const slug = getRouterParam(event, 'slug')!.toLowerCase();
  const [ev] = await useDb().select().from(events).where(eq(events.slug, slug));
  if (!ev || ev.purgedAt || ev.deletedAt) throw createError({ statusCode: 404, statusMessage: 'Majlis tak jumpa' });
  return ev;
}
