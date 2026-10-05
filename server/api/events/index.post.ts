import { z } from 'zod';
import { useDb, events, eventMembers, kad } from '../../db';
import { requireUser } from '../../utils/session';
import { newId, newToken } from '../../utils/ids';
import { slugify, RESERVED, slugTaken, isUniqueViolation } from '../../utils/slug';
import { defaultSettings } from '../../utils/events';
import { planClocks } from '../../utils/plans';
import { readBodyAs } from '../../utils/validate';
import { rateLimit } from '../../utils/rate';
import { parseEventDate } from '../../utils/dates';

const Body = z.object({
  type: z.enum(['kahwin', 'aqiqah', 'birthday', 'corporate', 'graduation', 'lain']).default('kahwin'),
  names: z.object({ a: z.string().trim().min(1).max(60), b: z.string().trim().max(60).optional() }),
  title: z.string().trim().max(120).optional(),
  date: z.string().max(40).nullable().optional(),
  venue: z.object({ name: z.string().trim().max(120).optional(), address: z.string().trim().max(300).optional() }).default({}),
  locale: z.enum(['ms', 'en']).default('ms'),
});

/**
 * The create wizard. A slug is minted from the names; a collision — with a
 * live majlis or with one any event ever gave up — gets a short suffix, and
 * two wizards racing for the same slug both succeed, one with a suffix.
 */
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const b = await readBodyAs(event, Body);
  await rateLimit(`create:${u.id}`, 20, 3_600_000);
  const db = useDb();
  const names = { a: b.names.a, ...(b.names.b ? { b: b.names.b } : {}) };
  const title = b.title || (names.b ? `${names.a} & ${names.b}` : names.a);
  let base = slugify(names.b ? `${names.a}-${names.b}` : names.a) || 'majlis';
  if (base.length < 3 || RESERVED.has(base)) base = `majlis-${base}`.replace(/-$/, '');
  const date = parseEventDate(b.date);
  const settings = { ...defaultSettings(), locale: b.locale };
  const suffixed = () => `${base}-${newId().slice(-4).toLowerCase()}`;
  let slug = base;
  for (let i = 0; i < 6 && await slugTaken(slug); i++) slug = suffixed();
  let ev: typeof events.$inferSelect | undefined;
  for (let attempt = 0; !ev; attempt++) {
    try {
      ev = await db.transaction(async (tx) => {
        const [row] = await tx.insert(events).values({
          id: newId(), ownerId: u.id, slug, type: b.type, title, names,
          date, venue: b.venue, settings, tvToken: newToken(), ...planClocks('free', new Date(), date),
        }).returning();
        await tx.insert(eventMembers).values({ eventId: row!.id, userId: u.id, role: 'owner' });
        await tx.insert(kad).values({ eventId: row!.id, template: 'garden' });
        return row!;
      });
    } catch (e) {
      if (!isUniqueViolation(e) || attempt >= 4) throw e;
      slug = suffixed();
    }
  }
  const { tvToken: _t, ...out } = ev;
  return out;
});
