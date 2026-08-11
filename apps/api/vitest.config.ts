import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./src/__tests__/helpers/setup-env.ts"],
    include: ["src/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Integration tests share one Postgres test database and truncate it
    // between files, so files must not run as parallel workers against it.
    fileParallelism: false,
  },
});
