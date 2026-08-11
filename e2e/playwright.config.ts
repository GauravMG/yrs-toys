import { defineConfig, devices } from "@playwright/test";

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:8080";
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL ?? "http://localhost:8081";
const MAILHOG_URL = process.env.MAILHOG_URL ?? "http://localhost:8025";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // golden-path specs share seeded/mutated data; keep deterministic
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "web",
      use: { ...devices["Desktop Chrome"], baseURL: WEB_BASE_URL },
      testMatch: /web\/.*\.spec\.ts/,
    },
    {
      name: "admin",
      use: { ...devices["Desktop Chrome"], baseURL: ADMIN_BASE_URL },
      testMatch: /admin\/.*\.spec\.ts/,
    },
  ],
  metadata: { mailhogUrl: MAILHOG_URL },
});

export { WEB_BASE_URL, ADMIN_BASE_URL, MAILHOG_URL };
