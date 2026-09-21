# Deploying to a VPS

Everything runs on one Ubuntu/Debian VPS: nginx → Node (Express + the prerendered site) under
PM2. **Nobody builds by hand.** GitHub Actions builds on its own runners and ships the result;
the VPS only has to run it.

```
git push / WordPress publish / nightly / manual
        │
        ▼
GitHub Actions  ── npm run build (sitemap + vite + prerender) ──►  rsync ──►  VPS
                                                                     │
                                          release.sh: npm ci → atomic symlink switch
                                                      → pm2 reload → health check
                                                      → automatic rollback if unhealthy
```

## What updates when

| You change…                                   | Goes live                                              |
|-----------------------------------------------|--------------------------------------------------------|
| Blog **SEO title / meta description** (Yoast) | within ~5 min — the server refreshes it, no deploy     |
| Blog post body, new blog posts                | on the next deploy (WordPress publish trigger, below)  |
| Code (push to `main`)                         | ~5–8 min (build + deploy)                              |
| New / approved agencies                       | next deploy — at the latest the nightly 02:00 UTC one  |

## One-time setup

**1. VPS.** A fresh Ubuntu 22.04/24.04 (or Debian 12) box, 1 GB RAM is enough (builds happen on
GitHub, not here). Copy this `deploy/` folder to it and run:

```bash
sudo bash setup-vps.sh findingglobal.com you@example.com
```

**2. Deploy key.** On your computer: `ssh-keygen -t ed25519 -f deploy_key -N ""`. Append
`deploy_key.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS.

**3. Server secrets.** On the VPS:

```bash
cp server.env.example /var/www/findingglobal/shared/server.env
nano /var/www/findingglobal/shared/server.env     # fill in real values
chown deploy:deploy /var/www/findingglobal/shared/server.env && chmod 600 /var/www/findingglobal/shared/server.env
```

Use your existing production values (Mongo URI, JWT secret, SMTP, Ziina, Google client ID).
Keep `JWT_SECRET` the same as today so nobody is logged out at cutover. In **MongoDB Atlas →
Network Access**, allow the VPS's IP address.

**4. GitHub secrets** (repo → Settings → Secrets and variables → Actions):

| Secret              | Value                                                                    |
|---------------------|--------------------------------------------------------------------------|
| `VPS_HOST`          | the VPS IP or hostname                                                   |
| `VPS_USER`          | `deploy`                                                                 |
| `VPS_SSH_KEY`       | contents of the **private** `deploy_key`                                 |
| `VPS_KNOWN_HOSTS`   | output of `ssh-keyscan -H <VPS_HOST>` (pins the server's identity)       |
| `VPS_PORT`          | *(optional)* only if SSH isn't on 22                                     |
| `PRERENDER_API_ORIGIN` | *(optional)* API to prerender against; default = the live site        |

**5. First deploy.** GitHub → Actions → **Build & Deploy to VPS** → Run workflow. When it's green,
check the site on the VPS before touching DNS:
`curl --resolve findingglobal.com:80:<VPS_IP> http://findingglobal.com/api/health`

**6. Cutover.** Lower your DNS TTL a day ahead. Point the `A` records for `findingglobal.com`
and `www` at the VPS, then get the certificate:

```bash
sudo certbot --nginx -d findingglobal.com -d www.findingglobal.com -m you@example.com --agree-tos --redirect -n
```

Certificates renew automatically. Keep the old host untouched for a few days as a fallback.
The old cPanel workflow (`deploy-frontend.yml`) is now manual-only so it can't fight this one.

**7. WordPress → GitHub trigger** (so publishing a post rebuilds the site). Create a
fine-grained GitHub token limited to this repo with **Contents: Read and write**, and have
WordPress send, on post publish/update (a webhook plugin such as *WP Webhooks* does this):

```
POST https://api.github.com/repos/adapts-media/FindingGlobal/dispatches
Authorization: Bearer <token>
Accept: application/vnd.github+json
{"event_type": "wp-publish"}
```

Bursts of publishes collapse into one rebuild.

## Day to day

- **Logs:** `sudo -u deploy pm2 logs findingglobal`
- **Status:** `sudo -u deploy pm2 status`
- **Manual rebuild:** Actions → Build & Deploy to VPS → Run workflow
- **Roll back:** the last 5 releases are kept. On the VPS:
  ```bash
  ls -1dt /var/www/findingglobal/releases/*      # newest first
  sudo -u deploy bash /var/www/findingglobal/releases/<older-id>/deploy/release.sh <older-id>
  ```
- A failed deploy **rolls itself back** — the old release keeps serving and the Actions run goes red.

## Things worth knowing

- Secrets exist only in `/var/www/findingglobal/shared/server.env`. They are never in git and
  never uploaded by the workflow.
- The frontend is built with a relative API address (`/api`, from the tracked `.env.production`),
  so the site and API must share one domain — which this layout does.
- Cookies are `Secure` + `SameSite=None` in production, so the site must be served over HTTPS
  (step 6) before login will work.
