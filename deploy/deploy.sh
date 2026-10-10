#!/usr/bin/env bash
#
# Ship main to indahnya.my. Run on the Mac, from the repo:
#
#   deploy/deploy.sh             build HEAD of main on the server and switch to it
#   deploy/deploy.sh --first     the same, then seed the landing's sample majlis
#   deploy/deploy.sh --rollback  switch back to the previous release (no build)
#   deploy/deploy.sh --status    what is live, PM2, health
#
# Pushing to GitHub deploys nothing; this does, and only when run. Each release
# is built on the server (sharp's native binary must be Linux) in its own folder
# while the live one keeps serving. Migrations run before the switch (they only
# ever add, so the old build runs on the new schema). If the new release fails
# its health check, the previous one is switched back in automatically.
#
# INDAHNYA_HOST (default: indahnya) is the ssh alias of the server: root, or a
# user with passwordless sudo.
set -euo pipefail
HOST="${INDAHNYA_HOST:-indahnya}"
SITE="https://indahnya.my"
cd "$(dirname "$0")/.."

# sudo -n: works the same for an ssh login as root and as a sudoer (a shared box)
remote() { ssh "$HOST" "sudo -n MODE='$1' SHA='${2:-}' bash -s" < deploy/remote.sh; }

case "${1:-}" in
  --status) remote status; exit ;;
  --rollback) remote rollback; curl -fsS -m 10 "$SITE/api/health" && echo; exit ;;
  ""|--first) ;;
  *) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = main ] || { echo "on '$branch': deploys go from main" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "uncommitted changes: commit or stash first" >&2; git status --short; exit 1; }
git fetch -q origin main
[ -z "$(git rev-list HEAD..origin/main)" ] || { echo "origin/main has commits you don't: pull first" >&2; exit 1; }
git push -q origin main
SHA=$(git rev-parse HEAD)
echo "== deploying $(git log -1 --format='%h %s' "$SHA")"

remote "${1:-deploy}" "$SHA"
echo "== public check"
sleep 2
curl -fsS -m 15 "$SITE/api/health" && echo || { echo "  ✗ $SITE/api/health did not answer 200 (DNS/Cloudflare/nginx?)" >&2; exit 1; }
