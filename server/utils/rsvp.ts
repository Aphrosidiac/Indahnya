import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import type { events } from '../db';
import { useDb, rsvps } from '../db';

type Ev = typeof events.$inferSelect;

/** The RSVP form's rules for this majlis, defaults filled in. Sides (pihak lelaki / perempuan) only make sense for a wedding. */
export function rsvpSettings(ev: Pick<Ev, 'type' | 'settings'>) {
  return { deadline: null as string | null, maxPax: 5, meals: [] as string[], sides: ev.type === 'kahwin', ...(ev.settings.rsvp ?? {}) };
}

/** The deadline is a calendar day: replies are taken until the end of it, Malaysian time. */
export function rsvpDeadlinePassed(deadline: string | null, now = Date.now()) {
  if (!deadline) return false;
  return now > Date.parse(`${deadline}T23:59:59.999+08:00`);
}

export function rsvpOpen(ev: Ev) {
  return ev.settings.modules.rsvp && !ev.purgedAt && !ev.deletedAt && !ev.settings.demo && !rsvpDeadlinePassed(rsvpSettings(ev).deadline);
}

/** Totals the host reads first: who is coming, how many mouths to feed, from which side. */
export async function rsvpSummary(eventId: string) {
  const [r] = await useDb().select({
    replies: sql<number>`count(*)`,
    yes: sql<number>`count(*) filter (where ${rsvps.attending})`,
    no: sql<number>`count(*) filter (where not ${rsvps.attending})`,
    pax: sql<number>`coalesce(sum(${rsvps.pax}) filter (where ${rsvps.attending}), 0)`,
    lelaki: sql<number>`coalesce(sum(${rsvps.pax}) filter (where ${rsvps.attending} and ${rsvps.side} = 'lelaki'), 0)`,
    perempuan: sql<number>`coalesce(sum(${rsvps.pax}) filter (where ${rsvps.attending} and ${rsvps.side} = 'perempuan'), 0)`,
    rakan: sql<number>`coalesce(sum(${rsvps.pax}) filter (where ${rsvps.attending} and ${rsvps.side} in ('rakan','lain')), 0)`,
    seated: sql<number>`coalesce(sum(${rsvps.pax}) filter (where ${rsvps.attending} and ${rsvps.tableId} is not null), 0)`,
  }).from(rsvps).where(eq(rsvps.eventId, eventId));
  const n = (v: unknown) => Number(v ?? 0);
  return { replies: n(r?.replies), yes: n(r?.yes), no: n(r?.no), pax: n(r?.pax), lelaki: n(r?.lelaki), perempuan: n(r?.perempuan), rakan: n(r?.rakan), seated: n(r?.seated) };
}

/**
 * A guest's own reply: the one this browser made. A phone number only
 * claims a reply nobody's browser owns — one the host typed in from a call,
 * or one whose browser is gone. Matching any reply by number would let
 * anyone who knows a number rewrite that person's RSVP (or a sibling on
 * mum's number silently replace hers); those submissions become their own
 * reply instead, and the host sees both.
 */
export async function findOwnRsvp(eventId: string, guestId: string | null, phoneKey: string | null, db: Pick<ReturnType<typeof useDb>, 'select'> = useDb()) {
  if (guestId) {
    const [r] = await db.select().from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.guestId, guestId))).limit(1);
    if (r) return r;
  }
  if (phoneKey) {
    const [r] = await db.select().from(rsvps)
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.phoneKey, phoneKey), or(eq(rsvps.source, 'host'), isNull(rsvps.guestId))))
      .orderBy(desc(rsvps.updatedAt)).limit(1);
    if (r) return r;
  }
  return null;
}
