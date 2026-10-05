import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * One pool per process. DATABASE_URL is required outside dev (the startup
 * check refuses to boot without it). An idle client that errors — Postgres
 * restarting, a network blip — is logged and replaced; unhandled, pg's
 * `error` event would take the whole process down.
 */
export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL || 'postgres://localhost:5432/indahnya';
    const pool = new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX) || 10, idleTimeoutMillis: 30_000 });
    pool.on('error', e => console.error('[db] idle client error:', e.message));
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
export * from './schema';
