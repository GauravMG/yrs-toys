# YRS Toys — E-Commerce Platform

A full-featured e-commerce platform for YRS Toys (India-based toy store): product catalog with search/filters, cart, guest & authenticated checkout, order tracking, reviews, wishlist, coupons, and a full admin dashboard. Payment gateways are not wired up yet — checkout runs on Cash on Delivery today, with a `PaymentProvider` interface (`apps/api/src/payments/`) designed so Razorpay/Stripe/Paytm can be plugged in later without touching order logic.

## Stack

- **`apps/api`** — Fastify + TypeScript REST API, Prisma ORM, PostgreSQL. Zod-validated requests/responses, OpenAPI docs auto-generated from the same schemas.
- **`apps/web`** — Customer storefront: React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS.
- **`apps/admin`** — Admin dashboard for the client to run the store: same stack as `apps/web`, separate deployable.
- **`packages/db`** — Prisma schema, migrations, seed script.
- **`packages/shared`** — Zod schemas + TypeScript types shared between the API and both frontends (the API contract, single source of truth).
- **`packages/ui`** — Design-system tokens (colors/type/radius/shadow) + shared Tailwind preset + accessible primitive components (`Button`, `Input`, `Modal`, `Drawer`, `Toast`, etc.), used by both frontends for visual consistency.
- **`docker/`** — Production Dockerfiles + nginx config.
- **`e2e/`** — Playwright end-to-end tests spanning the storefront and admin apps.

## Prerequisites

- Node.js 20+, [pnpm](https://pnpm.io) 9+ (`corepack enable` will pick up the pinned version automatically)
- Docker + Docker Compose (for Postgres/Mailhog locally, and for the full prod-like stack)

## Setup

```bash
cp .env.example .env          # defaults work out of the box for local dev
pnpm install
docker compose up -d postgres mailhog
pnpm --filter @yrs/db migrate:dev
pnpm --filter @yrs/db seed
```

Seed data: an admin account (`admin@yrstoys.in` / `Admin@12345`), a demo customer (`customer@example.com` / `Customer@12345`), 6 categories, 18 products across all age bands, an active coupon `WELCOME10`, and a handful of approved reviews.

## Running it

**Local development** (fast iteration, hot reload via each tool's own dev server):

```bash
pnpm --filter @yrs/api dev     # http://localhost:4000  (API docs at /docs)
pnpm --filter @yrs/web dev     # http://localhost:5173  (storefront)
pnpm --filter @yrs/admin dev   # http://localhost:5174  (admin dashboard)
```

Run these in separate terminals (or `pnpm dev` at the root to run all workspaces in parallel), with `docker compose up -d postgres mailhog` already running. Mailhog's web UI (captures all outgoing email in dev — order confirmations, status updates, password resets) is at http://localhost:8025.

**Full stack via Docker** (production-like, what actually ships):

```bash
docker compose up --build
```

This builds and runs everything: Postgres, Mailhog, the API (port 4000), the storefront (port 8080, nginx-served static build), and the admin dashboard (port 8081, nginx-served static build). Run the migrate/seed commands above against this stack too if starting from a fresh volume (`docker compose exec api pnpm --filter @yrs/db migrate:deploy`, etc., or run them from the host against `localhost:5433` as above — either works, they hit the same Postgres).

## Testing

```bash
pnpm --filter @yrs/api test          # unit + integration (real Postgres test DB, auto-truncated between files)
pnpm --filter @yrs/web test          # component tests (Vitest + Testing Library + MSW)
pnpm --filter @yrs/admin test        # component tests
pnpm --filter @yrs/shared test       # shared schema/util unit tests

# End-to-end (requires the full stack running — see below)
cd e2e && pnpm install && pnpm install-browsers && pnpm test
```

The API integration suite needs a dedicated test database (`yrs_toys_test`, separate from dev data) — see `.env.example`'s `TEST_DATABASE_URL`. Create it once with `createdb`/`psql` against the same Postgres instance and run `DATABASE_URL=$TEST_DATABASE_URL pnpm --filter @yrs/db exec prisma migrate deploy`.

E2E tests expect `apps/web`, `apps/admin`, and `apps/api` reachable at the ports the Docker Compose stack uses (8080/8081/4000) with Mailhog at 8025 — run `docker compose up --build` first.

## Environment variables

See `.env.example` for the full list with defaults. Key ones: `DATABASE_URL`/`TEST_DATABASE_URL` (Postgres), `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (change these before any real deployment), `SMTP_HOST`/`SMTP_PORT`/`MAIL_FROM` (Mailhog in dev, a real SMTP provider in production), `CORS_ORIGIN_WEB`/`CORS_ORIGIN_ADMIN`, `VITE_API_BASE_URL` (baked into each frontend's build).

## Adding a real payment gateway later

Implement `PaymentProvider` (`apps/api/src/payments/payment-provider.interface.ts`: `createPaymentIntent`, `verifyPayment`, `refund`) in a new `<name>.provider.ts` file alongside `cod.provider.ts`, then register it in `apps/api/src/payments/provider-registry.ts`. The `PaymentMethod` enum (`packages/db/prisma/schema.prisma`) already reserves `RAZORPAY`/`STRIPE`/`PAYTM` values, order/payment records already support per-method tracking (`Payment` is its own transaction-log table), and the checkout flow (`apps/api/src/modules/orders/service.ts`) already calls through the provider interface rather than a concrete implementation — no changes needed there.

## Project structure

```
apps/
  api/      Fastify API — src/modules/<domain>/{routes,service,repository}.ts
  web/      Customer storefront
  admin/    Admin dashboard
packages/
  db/       Prisma schema, migrations, seed
  shared/   Zod schemas/types shared by api+web+admin (the API contract)
  ui/       Design tokens, Tailwind preset, shared components
docker/     Production Dockerfiles + nginx.conf
e2e/        Playwright end-to-end tests
design-reference/   Original client-provided HTML mockups (visual reference only, not built/served)
```
