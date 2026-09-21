#!/usr/bin/env bash
# One-time provisioning for a fresh Ubuntu 22.04/24.04 (or Debian 12) VPS. Run as root:
#
#   sudo bash setup-vps.sh <domain> <letsencrypt-email>
#   e.g. sudo bash setup-vps.sh findingglobal.com you@example.com
#
# Safe to re-run. It installs Node 20, nginx, PM2 and a firewall, creates the unprivileged
# `deploy` user that GitHub Actions connects as, and lays out /var/www/findingglobal. It does
# NOT request the TLS certificate — that needs DNS already pointing at this server, so it's the
# last manual step (the command is printed at the end).
set -euo pipefail

DOMAIN="${1:?usage: setup-vps.sh <domain> <letsencrypt-email>}"
EMAIL="${2:?usage: setup-vps.sh <domain> <letsencrypt-email>}"
APP=/var/www/findingglobal
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }

echo "==> Base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg nginx certbot python3-certbot-nginx ufw rsync

echo "==> Node.js 20"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> PM2"
command -v pm2 >/dev/null || npm install -g pm2

echo "==> deploy user + directories"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
install -d -o deploy -g deploy "$APP" "$APP/releases" "$APP/shared"

echo "==> nginx site for $DOMAIN"
sed "s/__DOMAIN__/$DOMAIN/g" "$HERE/nginx.conf" > /etc/nginx/sites-available/findingglobal
ln -sf /etc/nginx/sites-available/findingglobal /etc/nginx/sites-enabled/findingglobal
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "==> Firewall (SSH + web only)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> PM2 auto-start on boot, as the deploy user"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u deploy --hp /home/deploy >/dev/null

cat <<EOF

Provisioning done. Remaining one-time steps:

  1. Put GitHub Actions' PUBLIC deploy key in /home/deploy/.ssh/authorized_keys
  2. Create the secrets file:   cp deploy/server.env.example $APP/shared/server.env
        then edit it, and:     chown deploy:deploy $APP/shared/server.env && chmod 600 $APP/shared/server.env
  3. In MongoDB Atlas > Network Access, allow this server's IP: $(curl -fsS https://api.ipify.org 2>/dev/null || echo '<this server IP>')
  4. Trigger the first deploy (GitHub > Actions > "Build & Deploy to VPS" > Run workflow)
  5. Point DNS (A records for $DOMAIN and www.$DOMAIN) at this server, then get the certificate:
        certbot --nginx -d $DOMAIN -d www.$DOMAIN -m $EMAIL --agree-tos --redirect -n

EOF
