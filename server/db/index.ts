import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL || 'postgres://localhost:5432/indahnya';
    const pool = new Pool({ connectionString: url, max: 10 });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
export * from './schema';
