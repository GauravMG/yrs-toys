import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, createTestProduct, loginTestUser, authHeader } from "../helpers/factories.js";

describe("wishlist routes", () => {
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
    return authHeader(accessToken);
  }

  it("rejects listing the wishlist without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/wishlist" });
    expect(res.statusCode).toBe(401);
  });

  it("returns an empty wishlist initially", async () => {
    const headers = await setupUser("empty@example.com");
    const res = await app.inject({ method: "GET", url: "/api/v1/wishlist", headers });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("adds a product to the wishlist and returns it in the list", async () => {
    const headers = await setupUser("add@example.com");
    const product = await createTestProduct(testPrisma, { name: "Wooden Blocks" });

    const addRes = await app.inject({ method: "POST", url: `/api/v1/wishlist/${product.id}`, headers });
    expect(addRes.statusCode).toBe(201);
    expect(addRes.json().productId).toBe(product.id);
    expect(addRes.json().product.name).toBe("Wooden Blocks");

    const listRes = await app.inject({ method: "GET", url: "/api/v1/wishlist", headers });
    expect(listRes.json()).toHaveLength(1);
  });

  it("is idempotent when adding the same product twice", async () => {
    const headers = await setupUser("twice@example.com");
    const product = await createTestProduct(testPrisma);

    const first = await app.inject({ method: "POST", url: `/api/v1/wishlist/${product.id}`, headers });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({ method: "POST", url: `/api/v1/wishlist/${product.id}`, headers });
    expect(second.statusCode).toBe(201);

    const listRes = await app.inject({ method: "GET", url: "/api/v1/wishlist", headers });
    expect(listRes.json()).toHaveLength(1);
  });

  it("returns 404 when adding a non-existent product", async () => {
    const headers = await setupUser("missingproduct@example.com");
    const res = await app.inject({ method: "POST", url: "/api/v1/wishlist/does-not-exist", headers });
    expect(res.statusCode).toBe(404);
  });

  it("removes a product from the wishlist and is idempotent on repeat delete", async () => {
    const headers = await setupUser("remove@example.com");
    const product = await createTestProduct(testPrisma);
    await app.inject({ method: "POST", url: `/api/v1/wishlist/${product.id}`, headers });

    const firstDelete = await app.inject({ method: "DELETE", url: `/api/v1/wishlist/${product.id}`, headers });
    expect(firstDelete.statusCode).toBe(204);

    const secondDelete = await app.inject({ method: "DELETE", url: `/api/v1/wishlist/${product.id}`, headers });
    expect(secondDelete.statusCode).toBe(204);

    const listRes = await app.inject({ method: "GET", url: "/api/v1/wishlist", headers });
    expect(listRes.json()).toEqual([]);
  });
});
