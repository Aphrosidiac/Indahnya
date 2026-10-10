/**
 * PM2: two processes from the same build.
 *
 *   indahnya-web     the site and API. WORKER=0: never processes media, so a
 *                    video encode cannot slow a guest's request. Cluster mode
 *                    lets `pm2 reload` swap processes with no downtime; raise
 *                    `instances` when one is not enough (rate limits and job
 *                    claims are shared through Postgres).
 *   indahnya-worker  photos, videos, purges, retention mails. Listens on a
 *                    loopback port nobody proxies to (Nitro always starts a
 *                    server); /api/health on the web side reports its heartbeat.
 *
 * Both read the same env file, which the server STARTS with (runtime config
 * is read from NUXT_* names at startup, never from the build machine).
 * kill_timeout covers the 25 s the worker waits for running jobs and Nitro's
 * graceful shutdown of open requests (zips, voice wishes).
 *
 *   pm2 start ecosystem.config.cjs && pm2 save
 *   pm2 reload ecosystem.config.cjs      # after a deploy (deploy/deploy.sh does both)
 */
const path = require('node:path');

/**
 * On the server each build is /srv/indahnya/releases/<sha> and
 * /srv/indahnya/current points at the live one. PM2 runs the symlink, so a
 * reload starts whatever `current` points at (Node resolves it when the
 * process starts); a reload never needs the process definition changed.
 */
const releases = path.dirname(__dirname);
const cwd = path.basename(releases) === 'releases' ? path.join(path.dirname(releases), 'current') : __dirname;

const common = {
  script: '.output/server/index.mjs',
  cwd,
  node_args: '--env-file=/etc/indahnya/env',
  kill_timeout: 35_000,
  max_memory_restart: '1500M',
  time: true,
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'indahnya-web',
      exec_mode: 'cluster',
      instances: 1,
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3000', WORKER: '0' },
    },
    {
      ...common,
      name: 'indahnya-worker',
      exec_mode: 'fork',
      instances: 1,
      // encodes hold big buffers; restart before the box swaps, never mid-wedding by surprise
      max_memory_restart: '2500M',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3001', WORKER: '1', WORKER_PHOTO_CONCURRENCY: '2', WORKER_VIDEO_CONCURRENCY: '1', FFMPEG_THREADS: '2' },
    },
  ],
};
