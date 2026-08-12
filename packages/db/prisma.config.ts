import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Loads the monorepo ROOT .env (not a packages/db-local one) regardless of
// the current working directory — `pnpm --filter @yrs/db exec prisma ...`
// runs with cwd=packages/db, so a relative "./.env" would silently miss
// the single .env everyone actually edits (see DEPLOY.md / README.md).
loadEnv({ path: path.join(import.meta.dirname, "../../.env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
