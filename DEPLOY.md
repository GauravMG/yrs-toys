# Deploying YRS Toys to the EC2 box (temporary sslip.io URLs)

This deploys the full stack (Postgres, Mailhog, API, storefront, admin) via
Docker Compose on the existing EC2 instance, fronted by nginx on three
`*.54.234.227.84.sslip.io` subdomains — no real domain needed yet, and it
sits alongside the box's existing `chatbot-api`, `school-id-card` and
`maxproducts` sites without touching them.

Run everything below **on the EC2 instance** (`ssh` in first), not locally.

## 0. Prerequisites

```bash
docker --version && docker compose version   # Docker Engine + the compose plugin
nginx -v
certbot --version
```

If any are missing:

```bash
# Docker (skip if already installed — chatbot-api already needs it)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in once for this to take effect

# certbot, if not already present from the chatbot-api setup
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
```

## 1. Get the code onto the server

```bash
sudo mkdir -p /var/www/yrs-toys
sudo chown $USER:$USER /var/www/yrs-toys
git clone <your-repo-url> /var/www/yrs-toys
cd /var/www/yrs-toys
```

## 2. Configure production environment

```bash
cp deploy/.env.production.example .env
```

Generate real secrets and drop them in:

```bash
# Run each of these and paste the output into the matching line in .env
openssl rand -hex 24   # -> POSTGRES_PASSWORD (also update DATABASE_URL to match)
openssl rand -hex 32   # -> JWT_ACCESS_SECRET
openssl rand -hex 32   # -> JWT_REFRESH_SECRET
```

Edit `.env` (`nano .env` or your editor of choice) and replace every
`CHANGE_ME_...` placeholder. Double-check `POSTGRES_PASSWORD` and the
`DATABASE_URL` password segment match exactly.

The CORS/API URLs in the template already point at:

- `https://yrstoys.54.234.227.84.sslip.io` (storefront)
- `https://yrstoys-admin.54.234.227.84.sslip.io` (admin)
- `https://yrstoys-api.54.234.227.84.sslip.io` (API)

If your EC2 instance's public IP isn't `54.234.227.84`, replace it
everywhere in `.env` **and** in `deploy/nginx-yrs-toys.conf` before
continuing (find/replace is safe — it's the same string throughout both
files).

## 3. Build and start the stack

```bash
docker compose build
docker compose up -d postgres mailhog
```

Wait for Postgres to report healthy, then run migrations and seed the
catalog:

```bash
docker compose ps postgres   # wait for "healthy"

# Prisma commands run from the host against the port-forwarded Postgres
# (127.0.0.1:5533, per .env) — pnpm needs to be available on the host for
# this one step. If pnpm isn't installed on the server:
#   curl -fsSL https://get.pnpm.io/install.sh | sh -
#   source ~/.bashrc
pnpm install
pnpm --filter @yrs/db exec prisma migrate deploy
pnpm --filter @yrs/db exec tsx prisma/seed.ts
```

Now bring up the API and both frontends:

```bash
docker compose up -d
docker compose ps   # all 5 services should show "healthy" within ~15s
```

Sanity-check locally on the box before touching nginx:

```bash
curl -s http://127.0.0.1:4100/healthz          # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8180/   # 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8181/   # 200
```

## 4. Install the nginx site (HTTP first, HTTPS comes from certbot in step 5)

```bash
sudo cp deploy/nginx-yrs-toys.conf /etc/nginx/sites-available/yrs-toys
sudo ln -s /etc/nginx/sites-available/yrs-toys /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

At this point the three sites should already respond over plain HTTP —
worth checking from your own machine before adding HTTPS:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://yrstoys.54.234.227.84.sslip.io/
curl -s -o /dev/null -w "%{http_code}\n" http://yrstoys-admin.54.234.227.84.sslip.io/
curl -s -o /dev/null -w "%{http_code}\n" http://yrstoys-api.54.234.227.84.sslip.io/healthz
```

## 5. Add HTTPS

```bash
sudo certbot --nginx \
  -d yrstoys.54.234.227.84.sslip.io \
  -d yrstoys-admin.54.234.227.84.sslip.io \
  -d yrstoys-api.54.234.227.84.sslip.io
```

This issues one certificate covering all three subdomains, rewrites
`/etc/nginx/sites-available/yrs-toys` to add the `:443` blocks and a
`:80 → :443` redirect for each (same pattern as the existing `chatbot-api`
site), and reloads nginx for you.

**This step matters, not just for the padlock**: the API sets its
auth cookies with `Secure`, so login/session persistence silently breaks
over plain HTTP. Don't skip it.

## 6. Verify

- Storefront: `https://yrstoys.54.234.227.84.sslip.io`
- Admin: `https://yrstoys-admin.54.234.227.84.sslip.io` — log in with
  `admin@yrstoys.in` / `Admin@12345` (**change this password** via
  Settings once you've confirmed it works — it's the same seed value used
  in local dev).
- API docs: `https://yrstoys-api.54.234.227.84.sslip.io/docs`

Click through both golden paths once by hand (browse → add to cart →
guest checkout; admin login → create a product → progress an order) the
same way they were verified locally.

To check outgoing emails (order confirmations, password resets) — they go
to Mailhog, not a real inbox, until you wire up real SMTP (see below):

```bash
ssh -L 8225:127.0.0.1:8225 <your-ec2-ssh-alias>
# then open http://localhost:8225 in your own browser
```

## Redeploying after code changes

```bash
cd /var/www/yrs-toys
git pull
docker compose build
docker compose up -d
# only if the Prisma schema changed:
pnpm --filter @yrs/db exec prisma migrate deploy
```

## Before real customers use this

This setup is intentionally demo/staging-grade in two ways:

1. **Email is fake.** Mailhog catches everything instead of sending it.
   Replace `SMTP_HOST`/`SMTP_PORT` (and add auth if needed) in `.env` with
   a real provider (SES, Postmark, etc.), then `docker compose up -d api`.
2. **Payments are COD-only**, by design at this stage — see the
   "Adding a real payment gateway later" section of `README.md` when
   you're ready for that.

Also rotate `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` and
`POSTGRES_PASSWORD` to values only this deployment knows (not reused from
any other project on this box), and change the seeded admin password.
