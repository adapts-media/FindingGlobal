#!/usr/bin/env bash
# Runs ON THE VPS, invoked by .github/workflows/deploy-vps.yml after it has rsynced a freshly
# built release into /opt/findingglobal/releases/<id>/ . Activates that release with no
# downtime window that serves a half-built site: it installs dependencies inside the new
# release directory first, flips the `current` symlink atomically, reloads the app, and rolls
# back to the previous release by itself if the new one doesn't come up healthy.
#
# Usage: release.sh <release-id>
set -euo pipefail

APP=/opt/findingglobal
REL="${1:?usage: release.sh <release-id>}"
DIR="$APP/releases/$REL"

[ -d "$DIR/dist" ] && [ -d "$DIR/server" ] || { echo "Release $REL is missing dist/ or server/"; exit 1; }
[ -f "$APP/shared/server.env" ] || { echo "Missing $APP/shared/server.env — create it from deploy/server.env.example first"; exit 1; }

# Secrets live outside the release (never in git, never rsynced) and are linked in.
ln -sfn "$APP/shared/server.env" "$DIR/server/.env"

echo "==> Installing server dependencies for $REL"
(cd "$DIR/server" && npm ci --omit=dev --no-audit --no-fund)

PREVIOUS="$(readlink -f "$APP/current" 2>/dev/null || true)"

echo "==> Switching current -> $REL"
ln -sfn "$DIR" "$APP/current.next"
mv -Tf "$APP/current.next" "$APP/current"   # rename(2) is atomic — readers never see a gap

echo "==> Reloading app"
pm2 startOrReload "$APP/current/deploy/ecosystem.config.cjs" --update-env
pm2 save >/dev/null

echo "==> Health check"
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:4100/api/health >/dev/null 2>&1; then
    echo "Healthy after ${i}s — release $REL is live."
    # Keep the 5 most recent releases for quick rollback; delete the rest.
    ls -1dt "$APP"/releases/*/ | tail -n +6 | xargs -r rm -rf
    exit 0
  fi
  sleep 1
done

echo "!! Release $REL failed its health check."
if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
  echo "==> Rolling back to $PREVIOUS"
  ln -sfn "$PREVIOUS" "$APP/current.next"
  mv -Tf "$APP/current.next" "$APP/current"
  pm2 startOrReload "$APP/current/deploy/ecosystem.config.cjs" --update-env || true
else
  echo "No previous release to roll back to."
fi
pm2 logs findingglobal --lines 40 --nostream || true
exit 1
