import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { useDb, tables } from '../../../../db';
import { requireEventAccess } from '../../../../utils/session';
import { readBodyAs } from '../../../../utils/validate';
import { newId } from '../../../../utils/ids';

const Body = z.union([
  z.object({ name: z.string().trim().min(1).max(40), capacity: z.number().int().min(1).max(100).default(10) }),
  /** "Buat 30 meja sekali gus": Meja 1 … Meja 30, numbered after the last one. */
  z.object({ count: z.number().int().min(1).max(200), capacity: z.number().int().min(1).max(100).default(10), prefix: z.string().trim().max(20).default('Meja') }),
]);

export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const b = await readBodyAs(event, Body);
  const db = useDb();
  const [{ n, max, top }] = await db.select({
    n: sql<number>`count(*)`, max: sql<number>`coalesce(max(${tables.sort}), 0)`,
    // the highest "<prefix> N" so far: numbering continues after it, never repeats one after a delete
    top: sql<number>`coalesce(max(nullif(substring(${tables.name} from '(\\d+)\\s*$'), '')::int), 0)`,
  }).from(tables).where(eq(tables.eventId, ev.id)) as [{ n: number; max: number; top: number }];
  const want = 'count' in b ? b.count : 1;
  if (Number(n) + want > 300) throw createError({ statusCode: 400, statusMessage: 'Maksimum 300 meja' });
  const start = Number(max);
  const values = 'count' in b
    ? Array.from({ length: b.count }, (_, i) => ({ id: newId(), eventId: ev.id, name: `${b.prefix} ${Number(top) + i + 1}`, capacity: b.capacity, sort: start + i + 1 }))
    : [{ id: newId(), eventId: ev.id, name: b.name, capacity: b.capacity, sort: start + 1 }];
  return db.insert(tables).values(values).returning();
});
