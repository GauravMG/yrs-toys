import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __yrsPrisma: PrismaClient | undefined;
}

// A single PrismaClient instance is reused across hot-reloads in dev so we
// don't exhaust the Postgres connection pool with every file-watch restart.
export const prisma =
  globalThis.__yrsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__yrsPrisma = prisma;
}

export * from "@prisma/client";
