import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestAdmin, loginTestUser, authHeader } from "../helpers/factories.js";

describe("coupon admin routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  async function asAdmin() {
    const { user, password } = await createTestAdmin(testPrisma);
    const { accessToken } = await loginTestUser(app, user.email, password);
    return authHeader(accessToken);
  }

  it("rejects non-admin access", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/admin/coupons" });
    expect(res.statusCode).toBe(401);
  });

  it("creates, lists, updates and deletes a coupon", async () => {
    const headers = await asAdmin();

    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/admin/coupons",
      headers,
      payload: { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderAmountInPaise: 50000 },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().code).toBe("WELCOME10");

    const listRes = await app.inject({ method: "GET", url: "/api/v1/admin/coupons", headers });
    expect(listRes.json()).toHaveLength(1);

    const id = createRes.json().id;
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/coupons/${id}`,
      headers,
      payload: { isActive: false },
    });
    expect(updateRes.json().isActive).toBe(false);

    const deleteRes = await app.inject({ method: "DELETE", url: `/api/v1/admin/coupons/${id}`, headers });
    expect(deleteRes.statusCode).toBe(204);
  });

  it("rejects a percentage coupon with value over 100", async () => {
    const headers = await asAdmin();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/coupons",
      headers,
      payload: { code: "TOOBIG", type: "PERCENTAGE", value: 150 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("404s when updating a coupon that doesn't exist", async () => {
    const headers = await asAdmin();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/admin/coupons/does-not-exist",
      headers,
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(404);
  });
});
