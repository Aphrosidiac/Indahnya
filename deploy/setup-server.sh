#!/usr/bin/env bash
#
# First-time provisioning of an Ubuntu 24.04 VPS for indahnya.my, run as root
# on the server, from the Mac:
#
#   ssh indahnya 'sudo bash -s' < deploy/setup-server.sh              # a box of its own
#   ssh indahnya 'sudo bash -s -- --shared' < deploy/setup-server.sh  # a box with other apps
#
# --shared leaves the box's own setup alone: no firewall, fail2ban, automatic
# upgrades or swap changes, no nginx default-site removal, nothing global.
# Either way Indahnya runs on its own Node 22 (/opt/node22, on the indahnya
# user's PATH only) under its own PM2 (pm2-indahnya.service), so the box's
# Node, PM2 and other apps are never touched; its systemd unit gets a lower
# CPU weight and a memory ceiling, so a video encode cannot starve the rest.
#
# Idempotent: safe to re-run. Writes no secrets except the database password it
# generates itself (into /etc/indahnya/env). Everything else comes from the Mac
# with deploy/env.sh push.
#
# Layout it creates:
#   /srv/indahnya/repo          a clone of the public repo; releases are cut from it
#   /srv/indahnya/releases/<sha> one build per deploy (deploy/deploy.sh)
#   /srv/indahnya/current       symlink to the live release
#   /srv/indahnya/shared/_nuxt  hashed assets of every release, so a tab opened
#                               before a deploy still finds its chunks
#   /etc/indahnya/env           runtime config (mode 600, owner indahnya)
#   /etc/ssl/cloudflare/        the Cloudflare origin certificate (deploy/cloudflare.mjs)
set -euo pipefail
SHARED=0; [ "${1:-}" = "--shared" ] && SHARED=1
NODE_VERSION=22
NODE_DIR=/opt/node22
REPO="${REPO:-https://github.com/Aphrosidiac/Indahnya.git}"
APP=indahnya
HOME_DIR=/srv/indahnya
ENV_FILE=/etc/indahnya/env
export DEBIAN_FRONTEND=noninteractive

[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }
. /etc/os-release
[ "${VERSION_ID:-}" = "24.04" ] || echo "WARNING: written for Ubuntu 24.04, this is ${PRETTY_NAME:-unknown}" >&2

echo "== packages"
apt-get update -y
if [ $SHARED = 1 ]; then
  # never upgrade what the box already has, and never let needrestart bounce
  # its services (it restarted Postgres and Redis under other apps once)
  export NEEDRESTART_MODE=l NEEDRESTART_SUSPEND=1
  apt-get install -y --no-upgrade curl git unzip xz-utils ca-certificates nginx postgresql postgresql-contrib \
    ffmpeg libheif-examples libheif-plugin-libde265
else
  apt-get install -y curl git unzip xz-utils ca-certificates nginx postgresql postgresql-contrib \
    ffmpeg libheif-examples libheif-plugin-libde265 ufw unattended-upgrades fail2ban
fi

echo "== Node $NODE_VERSION for Indahnya only ($NODE_DIR)"
if ! "$NODE_DIR/bin/node" -v 2>/dev/null | grep -q "^v$NODE_VERSION\."; then
  arch=$(uname -m); case $arch in x86_64) arch=x64;; aarch64) arch=arm64;; esac
  base="https://nodejs.org/dist/latest-v$NODE_VERSION.x"
  tarball=$(curl -fsSL "$base/SHASUMS256.txt" | awk -v a="linux-$arch.tar.xz" '$2 ~ a"$" {print $2}')
  t=$(mktemp -d)
  curl -fsSL "$base/$tarball" -o "$t/$tarball"
  (cd "$t" && curl -fsSL "$base/SHASUMS256.txt" | grep " $tarball\$" | sha256sum -c --quiet)
  rm -rf "$NODE_DIR" && mkdir -p "$NODE_DIR" && tar -xJf "$t/$tarball" -C "$NODE_DIR" --strip-components=1 && rm -rf "$t"
fi
export PATH="$NODE_DIR/bin:$PATH"
[ -x "$NODE_DIR/bin/pm2" ] || npm install -g --prefix "$NODE_DIR" pm2@latest >/dev/null
# AWS CLI v2 for the off-box database copies (Ubuntu 24.04 has no apt package)
if ! command -v aws >/dev/null; then
  t=$(mktemp -d); arch=$(uname -m)
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${arch}.zip" -o "$t/aws.zip"
  unzip -q "$t/aws.zip" -d "$t" && "$t/aws/install" && rm -rf "$t"
fi

echo "== swap (a Nuxt build next to a running worker needs headroom)"
if [ $SHARED = 0 ] && ! swapon --show | grep -q . ; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10 >/dev/null && echo 'vm.swappiness=10' > /etc/sysctl.d/99-indahnya.conf
fi

echo "== app user and folders"
id -u $APP >/dev/null 2>&1 || useradd -m -s /bin/bash $APP
# its own Node first on its PATH (login shells: deploy runs `bash -lc` as this user)
grep -q "$NODE_DIR/bin" /home/$APP/.profile 2>/dev/null || echo "export PATH=\"$NODE_DIR/bin:\$PATH\"" >> /home/$APP/.profile
chown $APP:$APP /home/$APP/.profile
mkdir -p $HOME_DIR/releases $HOME_DIR/shared/_nuxt /var/backups/indahnya /etc/indahnya /etc/ssl/cloudflare
touch /var/log/indahnya-backup.log
chown -R $APP:$APP $HOME_DIR /var/backups/indahnya /var/log/indahnya-backup.log
chmod 750 /etc/ssl/cloudflare
[ -d $HOME_DIR/repo/.git ] || sudo -u $APP git clone -q "$REPO" $HOME_DIR/repo

echo "== database"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$APP'" | grep -q 1; then
  DB_PW=$(openssl rand -hex 24)
  sudo -u postgres psql -qc "CREATE ROLE $APP LOGIN PASSWORD '$DB_PW'"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$APP'" | grep -q 1 || sudo -u postgres createdb -O $APP $APP

echo "== runtime config"
if [ ! -f $ENV_FILE ]; then
  [ -n "${DB_PW:-}" ] || { DB_PW=$(openssl rand -hex 24); sudo -u postgres psql -qc "ALTER ROLE $APP PASSWORD '$DB_PW'"; }
  cat > $ENV_FILE <<ENV
# Indahnya production config. Read by Node when a process STARTS
# (node --env-file); see .env.example and docs/deployment.md.
# Secrets arrive from the Mac with deploy/env.sh push; this file keeps any key
# the push does not carry.
DATABASE_URL=postgres://$APP:$DB_PW@127.0.0.1:5432/$APP
NUXT_PUBLIC_SITE_URL=https://indahnya.my
NUXT_S3_REGION=auto
NUXT_S3_BUCKET=indahnya-media
NUXT_S3_PRIVATE_BUCKET=indahnya-private
NUXT_S3_PUBLIC_BASE=https://media.indahnya.my
NUXT_SMTP_FROM=Indahnya <hello@indahnya.my>
BACKUP_S3_URI=s3://indahnya-backups
ENV
fi
chown $APP:$APP $ENV_FILE && chmod 600 $ENV_FILE

echo "== nginx"
# Cloudflare's addresses, so CF-Connecting-IP is trusted from them only; refreshed weekly
cat > /usr/local/sbin/indahnya-cf-ips <<'SH'
#!/usr/bin/env bash
set -euo pipefail
out=/etc/nginx/indahnya-cloudflare-ips.conf; tmp=$(mktemp)
{ echo "# generated by indahnya-cf-ips from https://www.cloudflare.com/ips/"
  for v in 4 6; do curl -fsS "https://www.cloudflare.com/ips-v$v" | sed -E 's/^(.+)$/set_real_ip_from \1;/'; echo; done
  echo "real_ip_header CF-Connecting-IP;"; } > "$tmp"
grep -q set_real_ip_from "$tmp" || { echo "empty list, keeping the old one" >&2; exit 1; }
mv "$tmp" "$out" && chmod 644 "$out"
nginx -t -q 2>/dev/null && systemctl reload nginx || true
SH
chmod 755 /usr/local/sbin/indahnya-cf-ips
[ -f /etc/nginx/indahnya-cloudflare-ips.conf ] || touch /etc/nginx/indahnya-cloudflare-ips.conf  # nginx -t needs the file even if the first fetch fails
/usr/local/sbin/indahnya-cf-ips || echo "WARNING: could not fetch Cloudflare IPs; rerun /usr/local/sbin/indahnya-cf-ips" >&2
echo '17 4 * * 1 root /usr/local/sbin/indahnya-cf-ips >/dev/null 2>&1' > /etc/cron.d/indahnya-cf-ips
[ $SHARED = 1 ] || rm -f /etc/nginx/sites-enabled/default
# the vhost itself is installed by deploy/deploy.sh from the release (it needs the origin cert first)

if [ $SHARED = 0 ]; then
  echo "== firewall"
  ufw allow OpenSSH >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable >/dev/null
  systemctl enable --now fail2ban >/dev/null 2>&1 || true
fi

echo "== PM2 (its own daemon, started by systemd so the limits below hold)"
app_pm2() { sudo -u $APP -H env PATH="$PATH" pm2 "$@"; }
env PATH="$PATH" pm2 startup systemd -u $APP --hp /home/$APP >/dev/null
mkdir -p /etc/systemd/system/pm2-$APP.service.d
cat > /etc/systemd/system/pm2-$APP.service.d/limits.conf <<'UNIT'
[Service]
# under contention Indahnya gets half the CPU share of a normal service, and the
# whole tree (web + worker + ffmpeg) is held under 2 GB
CPUWeight=50
MemoryHigh=1700M
MemoryMax=2G
UNIT
systemctl daemon-reload
# a daemon started outside systemd (an earlier run, a manual pm2 call) would sit outside the limits
if ! systemctl is-active -q pm2-$APP; then app_pm2 kill >/dev/null 2>&1 || true; fi
systemctl enable -q pm2-$APP && systemctl start pm2-$APP
app_pm2 describe pm2-logrotate >/dev/null 2>&1 || app_pm2 install pm2-logrotate >/dev/null

echo "== nightly backup at 03:15 Malaysia time"
# cron runs on the box's clock: UTC on most VPSs, UTC+8 on some (Tencent)
off=$(date +%z); off_h=$((10#${off:1:2})); [ "${off:0:1}" = - ] && off_h=$((-off_h))
hour=$(( ( (3 - 8 + off_h) % 24 + 24 ) % 24 ))
# cron's PATH has no /usr/local/bin, where the AWS CLI lives
printf 'PATH=/usr/local/bin:/usr/bin:/bin\n15 %s * * * %s %s/current/scripts/backup-db.sh >> /var/log/indahnya-backup.log 2>&1\n' $hour $APP $HOME_DIR > /etc/cron.d/indahnya-backup

echo
echo "Provisioned$([ $SHARED = 1 ] && echo ' (shared box)'). Versions: node $(node -v) for indahnya, $(psql --version | cut -d' ' -f1,3), $(nginx -v 2>&1 | cut -d/ -f2), ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3)"
echo "Next, from the Mac: node deploy/cloudflare.mjs, deploy/env.sh push, deploy/deploy.sh --first"
