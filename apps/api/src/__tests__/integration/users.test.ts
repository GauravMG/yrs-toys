import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, loginTestUser, authHeader } from "../helpers/factories.js";

describe("user routes", () => {
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

  it("updates the current user's profile", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "profile@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me",
      headers: authHeader(accessToken),
      payload: { fullName: "Updated Name", phone: "9876543210" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fullName).toBe("Updated Name");
    expect(body.phone).toBe("9876543210");
    expect(body.email).toBe("profile@example.com");
  });

  it("allows a partial update (fullName only)", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "partial@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me",
      headers: authHeader(accessToken),
      payload: { fullName: "Only Name Changed" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().fullName).toBe("Only Name Changed");
  });

  it("rejects an invalid phone number", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "badphone@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me",
      headers: authHeader(accessToken),
      payload: { phone: "12345" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects the request without authentication", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me",
      payload: { fullName: "No Auth" },
    });
    expect(res.statusCode).toBe(401);
  });
});
