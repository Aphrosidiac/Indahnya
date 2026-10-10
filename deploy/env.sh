#!/usr/bin/env bash
#
# Production config lives on the Mac in ~/.config/indahnya/production.env
# (mode 600, outside the repo: the repo is public) and on the server in
# /etc/indahnya/env. This merges the first into the second.
#
#   deploy/env.sh push [--reload]   merge the Mac's keys (blank values are skipped,
#                                   keys only the server has are kept) + install the
#                                   origin certificate; --reload restarts the app
#   deploy/env.sh check             list required keys that are missing or blank (names only)
#
# INDAHNYA_HOST (default: indahnya) is the ssh alias of the server: root, or a
# user with passwordless sudo.
set -euo pipefail
HOST="${INDAHNYA_HOST:-indahnya}"
CONF="$HOME/.config/indahnya"
PROD="$CONF/production.env"

REQUIRED="DATABASE_URL NUXT_PUBLIC_SITE_URL NUXT_S3_ENDPOINT NUXT_S3_REGION NUXT_S3_BUCKET NUXT_S3_PRIVATE_BUCKET
NUXT_S3_ACCESS_KEY_ID NUXT_S3_SECRET_ACCESS_KEY NUXT_S3_PUBLIC_BASE NUXT_STRIPE_SECRET_KEY NUXT_STRIPE_WEBHOOK_SECRET
NUXT_SMTP_URL NUXT_PUBLIC_LEGAL_NAME NUXT_PUBLIC_LEGAL_REG NUXT_PUBLIC_LEGAL_ADDRESS"
ADVISED="NUXT_ALERT_EMAIL NUXT_CLOUDFLARE_ZONE_ID NUXT_CLOUDFLARE_API_TOKEN AWS_ACCESS_KEY_ID BACKUP_S3_URI NUXT_GOOGLE_CLIENT_ID"

check() {
  # shellcheck disable=SC2029
  ssh "$HOST" "sudo -n REQUIRED='$REQUIRED' ADVISED='$ADVISED' bash -s" <<'SH'
set -euo pipefail
f=/etc/indahnya/env
[ -f $f ] || { echo "no $f: run deploy/setup-server.sh first"; exit 1; }
val() { grep -E "^$1=" $f | tail -1 | cut -d= -f2-; }
miss=0
for k in $REQUIRED; do [ -n "$(val $k)" ] || { echo "  ✗ $k (required)"; miss=1; }; done
for k in $ADVISED;  do [ -n "$(val $k)" ] || echo "  · $k (optional, not set)"; done
case "$(val NUXT_STRIPE_SECRET_KEY)" in sk_test_*|rk_test_*) echo "  · Stripe is in TEST mode";; esac
[ -s /etc/ssl/cloudflare/indahnya.my.pem ] || { echo "  ✗ origin certificate not installed"; miss=1; }
[ $miss = 0 ] && echo "  ✓ every required key is set" || exit 1
SH
}

push() {
  [ -f "$PROD" ] || { echo "no $PROD (node deploy/cloudflare.mjs writes it; see docs/deployment.md)" >&2; exit 1; }
  chmod 600 "$PROD"
  # into a private folder in the login's home, then moved into place as root
  local stage; stage=$(ssh "$HOST" 'umask 077; mktemp -d "$HOME/.indahnya-push.XXXXXX"')
  scp -q "$PROD" "$HOST:$stage/env"
  if [ -s "$CONF/origin.pem" ] && [ -s "$CONF/origin.key" ]; then
    scp -q "$CONF/origin.pem" "$HOST:$stage/origin.pem"
    scp -q "$CONF/origin.key" "$HOST:$stage/origin.key"
  fi
  ssh "$HOST" "sudo -n STAGE='$stage' bash -s" <<'SH'
set -euo pipefail
in=$STAGE/env; f=/etc/indahnya/env
trap 'shred -u $STAGE/* 2>/dev/null; rm -rf "$STAGE"' EXIT
if [ -s $STAGE/origin.key ]; then
  install -o root -g root -m 644 $STAGE/origin.pem /etc/ssl/cloudflare/indahnya.my.pem
  install -o root -g root -m 600 $STAGE/origin.key /etc/ssl/cloudflare/indahnya.my.key
fi
touch $f
# merge: incoming non-blank values win; every other line of the server file stays
awk -F= '
  NR==FNR { if ($0 ~ /^[A-Z0-9_]+=/) { k=$1; v=substr($0, length(k)+2); if (v != "") { nv[k]=v; order[++n]=k } } next }
  /^[A-Z0-9_]+=/ { k=$1; if (k in nv) { print k "=" nv[k]; done[k]=1; next } }
  { print }
  END { for (i=1; i<=n; i++) { k=order[i]; if (!(k in done)) { print k "=" nv[k]; done[k]=1 } } }
' $in $f > $f.new
mv $f.new $f && chown indahnya:indahnya $f && chmod 600 $f
echo "  ✓ merged $(grep -cE '^[A-Z0-9_]+=.' $in) keys into $f"
SH
  check || true
  if [ "${1:-}" = "--reload" ]; then
    ssh "$HOST" "sudo -n -u indahnya -H bash -lc 'cd /srv/indahnya/current && pm2 reload ecosystem.config.cjs --update-env'" && echo "  ✓ reloaded"
  fi
}

case "${1:-}" in
  push) shift; push "$@" ;;
  check) check ;;
  *) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
