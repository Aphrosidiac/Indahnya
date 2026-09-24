import type { H3Event } from 'h3';
import type { z } from 'zod';

/**
 * Parse a JSON body against a schema. A bad body is the caller's mistake,
 * so it is a 400 with the fields that failed — never the 500 a bare
 * `Schema.parse` turns into.
 */
export async function readBodyAs<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try { raw = await readBody(event); } catch { raw = undefined; }
  const r = schema.safeParse(raw ?? {});
  if (!r.success) {
    throw createError({
      statusCode: 400, statusMessage: 'Maklumat tak lengkap atau tak sah',
      data: { issues: r.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  return r.data;
}
