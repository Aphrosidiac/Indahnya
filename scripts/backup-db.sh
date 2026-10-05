#!/usr/bin/env bash
#
# Nightly Postgres backup: a compressed custom-format dump, kept 14 days on
# the box and copied OFF the box (a backup on the same disk is not a backup).
#
#   /etc/cron.d/indahnya-backup:
#   15 3 * * * indahnya /srv/indahnya/scripts/backup-db.sh >> /var/log/indahnya-backup.log 2>&1
#
# Needs: pg_dump; for the off-box copy, the AWS CLI with a profile that can
# write to a SEPARATE R2 bucket (not the media buckets), e.g.
#   BACKUP_S3_URI=s3://indahnya-backups  AWS_PROFILE=indahnya-backup
#   AWS_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
# Give that bucket a lifecycle rule deleting objects after 30 days.
#
# Restore (see docs/deploy.md): pg_restore --clean --if-exists -d "$DATABASE_URL" <file>
set -euo pipefail
ENV_FILE="${ENV_FILE:-/etc/indahnya/env}"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
: "${DATABASE_URL:?DATABASE_URL is not set}"
DIR="${BACKUP_DIR:-/var/backups/indahnya}"
mkdir -p "$DIR"
FILE="$DIR/indahnya-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --compress=6 --no-owner --file="$FILE" "$DATABASE_URL"
# a dump that cannot be listed is not a backup
pg_restore --list "$FILE" > /dev/null
echo "$(date -u +%FT%TZ) dumped $(du -h "$FILE" | cut -f1) → $FILE"
if [ -n "${BACKUP_S3_URI:-}" ]; then
  aws s3 cp "$FILE" "$BACKUP_S3_URI/$(basename "$FILE")" --only-show-errors
  echo "$(date -u +%FT%TZ) copied off the box to $BACKUP_S3_URI"
else
  echo "WARNING: BACKUP_S3_URI not set — this backup exists only on this machine" >&2
fi
find "$DIR" -name 'indahnya-*.dump' -mtime +14 -delete
