// Apply database migrations on a server, with production dependencies only
// (drizzle-kit is a dev tool; drizzle-orm's migrator is not). Run from the
// repo checkout with the server's env:
//   node --env-file=/etc/indahnya/env scripts/migrate.mjs
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set'); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: new URL('../server/db/migrations', import.meta.url).pathname });
  console.log('migrations applied');
} finally { await pool.end(); }
