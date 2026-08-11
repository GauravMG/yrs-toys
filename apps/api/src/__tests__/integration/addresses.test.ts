import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, loginTestUser, authHeader } from "../helpers/factories.js";

const sampleAddress = {
  fullName: "Jane Doe",
  phone: "9876543210",
  line1: "123 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
};

describe("address routes", () => {
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

  async function setupUser(email: string) {
    const { user, password } = await createTestUser(testPrisma, { email });
    const { accessToken } = await loginTestUser(app, user.email, password);
    return { user, accessToken };
  }

  it("returns an empty list for a user with no addresses", async () => {
    const { accessToken } = await setupUser("noaddr@example.com");
    const res = await app.inject({ method: "GET", url: "/api/v1/users/me/addresses", headers: authHeader(accessToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("rejects listing addresses without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users/me/addresses" });
    expect(res.statusCode).toBe(401);
  });

  it("forces the first address to be default regardless of payload", async () => {
    const { accessToken } = await setupUser("first@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: { ...sampleAddress, isDefault: false },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().isDefault).toBe(true);
  });

  it("unsets the previous default when a new default address is created", async () => {
    const { accessToken } = await setupUser("second@example.com");
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: sampleAddress,
    });
    expect(first.json().isDefault).toBe(true);

    const second = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: { ...sampleAddress, line1: "456 Brigade Road", isDefault: true },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().isDefault).toBe(true);

    const list = await app.inject({ method: "GET", url: "/api/v1/users/me/addresses", headers: authHeader(accessToken) });
    const items = list.json() as Array<{ id: string; isDefault: boolean }>;
    const defaults = items.filter((a) => a.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]!.id).toBe(second.json().id);
  });

  it("rejects an invalid address payload", async () => {
    const { accessToken } = await setupUser("invalid@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: { ...sampleAddress, postalCode: "abc" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("updates an owned address", async () => {
    const { accessToken } = await setupUser("update@example.com");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: sampleAddress,
    });
    const id = created.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/me/addresses/${id}`,
      headers: authHeader(accessToken),
      payload: { city: "Mumbai" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().city).toBe("Mumbai");
  });

  it("sets a specific address as default via the /default endpoint", async () => {
    const { accessToken } = await setupUser("setdefault@example.com");
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: sampleAddress,
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: { ...sampleAddress, line1: "789 Church Street" },
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/me/addresses/${first.json().id}/default`,
      headers: authHeader(accessToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().isDefault).toBe(true);

    const secondFetch = await app.inject({
      method: "GET",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
    });
    const items = secondFetch.json() as Array<{ id: string; isDefault: boolean }>;
    expect(items.find((a) => a.id === second.json().id)?.isDefault).toBe(false);
  });

  it("deletes an owned address", async () => {
    const { accessToken } = await setupUser("delete@example.com");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(accessToken),
      payload: sampleAddress,
    });
    const id = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/me/addresses/${id}`,
      headers: authHeader(accessToken),
    });
    expect(res.statusCode).toBe(204);

    const list = await app.inject({ method: "GET", url: "/api/v1/users/me/addresses", headers: authHeader(accessToken) });
    expect(list.json()).toEqual([]);
  });

  it("returns 404 (not 403) when a user tries to modify another user's address", async () => {
    const owner = await setupUser("owner@example.com");
    const intruder = await setupUser("intruder@example.com");

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/addresses",
      headers: authHeader(owner.accessToken),
      payload: sampleAddress,
    });
    const id = created.json().id;

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/me/addresses/${id}`,
      headers: authHeader(intruder.accessToken),
      payload: { city: "Hacked City" },
    });
    expect(patchRes.statusCode).toBe(404);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/me/addresses/${id}`,
      headers: authHeader(intruder.accessToken),
    });
    expect(deleteRes.statusCode).toBe(404);

    const defaultRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/me/addresses/${id}/default`,
      headers: authHeader(intruder.accessToken),
    });
    expect(defaultRes.statusCode).toBe(404);
  });
});
