#!/usr/bin/env bash
# One-time provisioning for the Finding Global app. Run as root:
#
#   bash setup-vps.sh <domain>            e.g.  bash setup-vps.sh findingglobal.com
#
# Designed to be SAFE ON A SERVER THAT ALREADY HOSTS OTHER SITES. It is purely additive: it
# only installs what's missing, adds its own nginx site file, creates its own unprivileged user
# and directory, and never touches existing sites, the default nginx site, or the firewall. The
# nginx change is validated before it is applied and undone automatically if validation fails.
# Works on Red Hat-family (dnf) and Debian-family (apt) systems. Safe to re-run.
set -euo pipefail

DOMAIN="${1:?usage: setup-vps.sh <domain>}"
APP=/opt/findingglobal
PORT=4100   # 4000 is often taken on shared hosts; keep in sync with ecosystem.config.cjs / nginx.conf / release.sh
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root."; exit 1; }

if command -v dnf >/dev/null; then PM=dnf; elif command -v apt-get >/dev/null; then PM=apt; else echo "Unsupported distro (need dnf or apt)."; exit 1; fi
install_pkgs() { if [ "$PM" = dnf ]; then dnf install -y "$@"; else DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"; fi; }

echo "==> Base packages (only what's missing)"
[ "$PM" = apt ] && apt-get update -y
for pkg in curl rsync git; do command -v "$pkg" >/dev/null || install_pkgs "$pkg"; done
command -v nginx >/dev/null || install_pkgs nginx

echo "==> Node.js (need >= 18)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  if [ "$PM" = dnf ]; then curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -; else curl -fsSL https://deb.nodesource.com/setup_20.x | bash -; fi
  install_pkgs nodejs
fi
echo "    node $(node -v)"

echo "==> PM2"
command -v pm2 >/dev/null || npm install -g pm2

echo "==> deploy user + directories"
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
command -v restorecon >/dev/null && restorecon -R /home/deploy/.ssh 2>/dev/null || true
install -d -o deploy -g deploy "$APP" "$APP/releases" "$APP/shared"

echo "==> nginx site for $DOMAIN (additive; validated before it takes effect)"
if [ -d /etc/nginx/conf.d ] && [ ! -d /etc/nginx/sites-enabled ]; then
  SITE=/etc/nginx/conf.d/findingglobal.conf
else
  SITE=/etc/nginx/sites-available/findingglobal
fi
[ -e "$SITE" ] && cp -a "$SITE" "$SITE.bak.$(date +%s)"
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$PORT/g" "$HERE/nginx.conf" > "$SITE"
[ "$SITE" = /etc/nginx/sites-available/findingglobal ] && ln -sf "$SITE" /etc/nginx/sites-enabled/findingglobal
if nginx -t; then
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl reload nginx
else
  echo "!! nginx config test failed — removing the site I just added so nothing else is affected."
  rm -f "$SITE" /etc/nginx/sites-enabled/findingglobal
  nginx -t
  exit 1
fi

echo "==> PM2 auto-start on boot, for the deploy user only (does not affect other PM2 instances)"
env PATH="$PATH:/usr/bin:/usr/local/bin" pm2 startup systemd -u deploy --hp /home/deploy >/dev/null

cat <<EOF

Provisioning done (firewall untouched — make sure ports 80/443 are open if you run one).
Remaining one-time steps:

  1. Create $APP/shared/server.env from deploy/server.env.example (real secrets), owned by deploy, mode 600
  2. In MongoDB Atlas > Network Access, allow this server's IP: $(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo '<this server IP>')
  3. Deploy a release (GitHub Actions workflow, or release.sh by hand)
  4. Point DNS (A records for $DOMAIN and www.$DOMAIN) here, then get the certificate:
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --redirect -n -m <your-email>

EOF
