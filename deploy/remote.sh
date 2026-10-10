#!/usr/bin/env bash
#
# The server half of deploy/deploy.sh; runs as root ON THE SERVER (sudo), fed over ssh
# with MODE (deploy | --first | rollback | status) and SHA. Not meant to be run by hand.
set -euo pipefail
APP=indahnya
BASE=/srv/indahnya
ENV_FILE=/etc/indahnya/env
LOG=$BASE/deploys.log
KEEP=3
PORT=3250  # indahnya-web (ecosystem.config.cjs)
as_app() { sudo -u $APP -H bash -lc "$1"; }
current() { readlink -f $BASE/current 2>/dev/null || true; }

health() {
  # the worker reports its heartbeat a few seconds after it starts
  for _ in $(seq 1 30); do
    if out=$(curl -fsS -m 5 http://127.0.0.1:$PORT/api/health 2>/dev/null); then echo "  ✓ health: $out"; return 0; fi
    sleep 2
  done
  echo "  ✗ health check failed:"; curl -sS -m 5 http://127.0.0.1:$PORT/api/health || true; echo
  return 1
}

activate() { # release dir
  ln -sfn "$1" $BASE/current.tmp && mv -T $BASE/current.tmp $BASE/current
  if as_app "pm2 describe indahnya-web >/dev/null 2>&1"; then
    as_app "pm2 reload $BASE/current/ecosystem.config.cjs --update-env >/dev/null"
  else
    as_app "pm2 start $BASE/current/ecosystem.config.cjs >/dev/null && pm2 save >/dev/null"
  fi
}

install_nginx() { # release dir
  local src="$1/deploy/nginx.conf" dst=/etc/nginx/sites-available/indahnya
  if ! cmp -s "$src" "$dst"; then
    [ -f "$dst" ] && cp "$dst" "$dst.prev"
    cp "$src" "$dst" && ln -sfn "$dst" /etc/nginx/sites-enabled/indahnya
    if ! nginx -t -q; then
      echo "  ✗ nginx config rejected; restoring the previous one"; [ -f "$dst.prev" ] && cp "$dst.prev" "$dst" || rm -f /etc/nginx/sites-enabled/indahnya
      return 1
    fi
    systemctl reload nginx && echo "  ✓ nginx config updated"
  fi
}

case "$MODE" in
status)
  echo "live: $(current)"; [ -f "$(current)/REVISION" ] && echo "rev:  $(cat "$(current)/REVISION")"
  tail -5 $LOG 2>/dev/null | sed 's/^/  /'
  as_app "pm2 ls"
  curl -sS -m 5 http://127.0.0.1:$PORT/api/health; echo
  ;;

rollback)
  cur=$(current)
  prev=$(ls -1dt $BASE/releases/*/ 2>/dev/null | sed 's:/$::' | grep -vx "$cur" | head -1 || true)
  [ -n "$prev" ] || { echo "no previous release to go back to"; exit 1; }
  echo "== rolling back $(basename "$cur") → $(basename "$prev")"
  install_nginx "$prev" || true
  activate "$prev"
  health
  echo "$(date -u +%FT%TZ) rollback $(basename "$prev") (from $(basename "$cur"))" >> $LOG
  ;;

deploy|--first)
  [ -n "$SHA" ] || { echo "no SHA"; exit 1; }
  [ -s /etc/ssl/cloudflare/indahnya.my.pem ] || { echo "origin certificate missing: run node deploy/cloudflare.mjs and deploy/env.sh push"; exit 1; }
  R=$BASE/releases/${SHA:0:12}
  prev=$(current)
  as_app "git -C $BASE/repo fetch -q origin && git -C $BASE/repo cat-file -e $SHA^{commit}"
  if [ -f "$R/.output/server/index.mjs" ] && [ "$(cat "$R/REVISION" 2>/dev/null)" = "$SHA" ]; then
    echo "== $SHA already built, switching to it"
  else
    echo "== building ${SHA:0:12} in $R"
    rm -rf "$R"; as_app "mkdir -p $R && git -C $BASE/repo archive $SHA | tar -x -C $R"
    # the build runs at the lowest CPU and disk priority: the live release (and,
    # on a shared box, everyone else's apps) keep the machine while it works
    as_app "cd $R && nice -n 19 ionice -c3 npm ci --no-audit --no-fund --loglevel=error"
    as_app "cd $R && NODE_OPTIONS=--max-old-space-size=1536 nice -n 19 ionice -c3 npx nuxt build >build.log 2>&1" || { tail -40 "$R/build.log"; exit 1; }
    as_app "echo $SHA > $R/REVISION"
  fi
  # hashed assets of every release stay reachable for tabs opened before this deploy
  as_app "cp -rf $R/.output/public/_nuxt/. $BASE/shared/_nuxt/"  # -f refreshes mtimes: the sweep below keeps them
  echo "== migrations"
  as_app "cd $R && node --env-file=$ENV_FILE scripts/migrate.mjs"
  install_nginx "$R"
  echo "== switching"
  activate "$R"
  if ! health; then
    as_app "pm2 logs --nostream --lines 40" || true
    if [ -n "$prev" ] && [ "$prev" != "$R" ]; then
      echo "== rolling back to $(basename "$prev")"; activate "$prev"; health || true
      echo "$(date -u +%FT%TZ) FAILED ${SHA:0:12}, rolled back to $(basename "$prev")" >> $LOG
    fi
    exit 1
  fi
  if [ "$MODE" = "--first" ]; then
    echo "== seeding the sample majlis"
    as_app "cd $R && node --env-file=$ENV_FILE --import tsx scripts/seed-demo.ts"
  fi
  echo "$(date -u +%FT%TZ) deploy ${SHA:0:12}" >> $LOG
  # keep the newest $KEEP releases (the live one is always among them)
  ls -1dt $BASE/releases/*/ | sed 's:/$::' | tail -n +$((KEEP + 1)) | { grep -vx "$R" || true; } | xargs -r rm -rf  # nothing to prune is fine
  # assets no release has referenced for a month
  find $BASE/shared/_nuxt -type f -mtime +30 -delete
  echo "  ✓ live: ${SHA:0:12}"
  ;;
*) echo "unknown MODE $MODE"; exit 1 ;;
esac
