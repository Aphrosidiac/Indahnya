#!/usr/bin/env bash
# Indahnya analytics from the Mac (docs/ANALYTICS.md): runs the metrics CLI on the box, as the indahnya user, with the server env.
#   scripts/metrics.sh report [days]      markdown report (default 7 days)
#   scripts/metrics.sh json [days]        the same report as JSON
#   scripts/metrics.sh ingest             read the traffic log now (normally every 10 minutes)
#   scripts/metrics.sh search             pull Google Search Console and Bing now (normally twice a day)
#   scripts/metrics.sh sql "SELECT …"     any read-only query, rows as JSON
set -euo pipefail
HOST="${INDAHNYA_HOST:-indahnya}"
cmd="${1:-report}"; shift || true
case "$cmd" in
  report) args="report --days ${1:-7}" ;;
  json) args="report --days ${1:-7} --json" ;;
  ingest|search) args="$cmd" ;;
  sql) args="sql $(printf '%q' "$*")" ;;
  *) sed -n '2,7p' "$0"; exit 1 ;;
esac
ssh "$HOST" "cd /srv/indahnya/current && sudo -n -u indahnya /opt/node22/bin/node --env-file=/etc/indahnya/env --import tsx scripts/metrics-cli.ts $args"
