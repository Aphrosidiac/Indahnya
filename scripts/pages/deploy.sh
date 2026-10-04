#!/usr/bin/env bash
#
# Deploy the public preview to Cloudflare Pages: https://indahnya-86v.pages.dev
#
#   npm run deploy:pages                      # production
#   FF_BRANCH=preview npm run deploy:pages    # preview alias, production untouched
#
# Same pattern as the FF portfolio demos (ff-siena, ff-frames, ...): a DIRECT
# UPLOAD project on Fakhrul's personal Cloudflare account, no git connection,
# so pushing deploys nothing. Pages has no server, so this is a snapshot:
# the committed HEAD is built in .pages/src (the dev server's .nuxt is left
# alone), run once with NUXT_PUBLIC_PREVIEW=true against the local Postgres
# and Garage (the sample event, scripts/seed-demo.ts), and captured by
# snapshot.mjs. Sign-up is closed in the preview (/mula). Not the launch:
# the real app still needs its VPS.
set -euo pipefail
cd "$(dirname "$0")/../.."

PROJECT="indahnya"
SITE="https://indahnya-86v.pages.dev"
BRANCH="${FF_BRANCH:-main}"
PORT="${PAGES_PORT:-3189}"
CF_ENV="${FF_ENV:-$HOME/Desktop/dev/ffdevstudio/.env}"
[ -f "$CF_ENV" ] || { echo "✗ no Cloudflare credentials at $CF_ENV"; exit 1; }
[ -f .env ] || { echo "✗ no .env (DATABASE_URL and Garage keys for the sample)"; exit 1; }
[ -z "$(git status --porcelain -- app server shared nuxt.config.ts)" ] || echo "! uncommitted app changes are NOT in this build (it builds HEAD)"

rm -rf .pages && mkdir -p .pages/src
git archive HEAD | tar -x -C .pages/src
ln -s "$PWD/node_modules" .pages/src/node_modules
(cd .pages/src && npx nuxt build >/dev/null)

set -a; . ./.env; set +a
export NUXT_PUBLIC_PREVIEW=true NUXT_PUBLIC_SITE_URL="$SITE" NUXT_S3_PUBLIC_BASE="$SITE/media" PORT="$PORT" HOST=127.0.0.1
node .pages/src/.output/server/index.mjs > .pages/server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 60); do curl -sf "http://127.0.0.1:$PORT/robots.txt" >/dev/null && break; sleep 0.5; done

(cd .pages/src && node ../../scripts/pages/snapshot.mjs "http://127.0.0.1:$PORT" "$SITE" ..)
kill $SERVER; trap - EXIT

set -a; . "$CF_ENV"; set +a
: "${CLOUDFLARE_API_TOKEN:?missing in $CF_ENV}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing in $CF_ENV}"
[ "${PAGES_DRY:-}" = 1 ] && { echo "built .pages/dist (not deployed)"; exit 0; }
cd .pages && npx --yes wrangler@latest pages deploy dist --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true
