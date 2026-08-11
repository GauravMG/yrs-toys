import path from "node:path";
import { config as loadDotenv } from "dotenv";

// Runs as a Vitest `setupFiles` entry, guaranteed to execute before any test
// file (and therefore before app.ts / @yrs/db) is imported. Redirecting
// DATABASE_URL here — before the Prisma client singleton in @yrs/db is ever
// constructed — is what makes the whole suite run against the disposable
// test database instead of dev data.
loadDotenv({ path: path.join(process.cwd(), "../../.env") });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is not set — copy .env.example to .env at the repo root first.");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = "test";
process.env.SMTP_HOST = process.env.SMTP_HOST ?? "localhost";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret_at_least_16_chars";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret_at_least_16_chars";
