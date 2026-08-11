# syntax=docker/dockerfile:1

# ---- builder: installs workspace deps (incl. native argon2 bindings) and generates the Prisma client ----
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc tsconfig.base.json ./
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY packages/db packages/db
COPY packages/shared packages/shared
COPY packages/ui packages/ui
COPY apps/api apps/api

RUN pnpm --filter @yrs/db exec prisma generate

# ---- runtime: same alpine/musl target as the builder so the compiled argon2 binding is compatible ----
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && addgroup -S yrs && adduser -S yrs -G yrs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app
# Matches UPLOAD_DIR (docker-compose.yml) and the `api_uploads` volume mount
# point exactly — chowning the wrong path here (e.g. apps/api/uploads,
# relative to the app's WORKDIR) leaves the actual mount point root-owned,
# and the non-root `yrs` user gets EACCES on every upload. Docker seeds a
# fresh named volume's initial content/ownership from whatever already
# exists at its mount point in the image, so this directory must exist
# (with correct ownership) here, before the volume ever attaches.
RUN mkdir -p /app/uploads && chown -R yrs:yrs /app

USER yrs
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1:4000/healthz || exit 1

# Runs the TypeScript entrypoint directly via tsx rather than a separate
# `tsc` build step — keeps dev/prod execution identical and avoids
# cross-package build-order complexity in this monorepo. tsx (esbuild under
# the hood) is fast enough that this is a legitimate production pattern at
# this application's scale.
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
