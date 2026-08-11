import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { disconnectTestDb } from "../helpers/test-db.js";

describe("security headers", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDb();
  });

  it("sets a cross-origin Cross-Origin-Resource-Policy so <img> tags on apps/web and apps/admin can load /uploads/* assets", async () => {
    // Regression test: @fastify/helmet's default `same-origin` CORP header
    // silently blocks image rendering (not the network request itself) when
    // this API is embedded by a different-origin frontend — exactly the
    // deployment shape both frontends use.
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});
