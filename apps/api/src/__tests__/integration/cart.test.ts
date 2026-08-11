import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestCategory, createTestProduct, createTestUser, loginTestUser, authHeader } from "../helpers/factories.js";

describe("cart routes", () => {
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

  it("creates a guest cart and issues a guest token header on first access", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/cart" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-guest-cart-token"]).toBeTypeOf("string");
    expect(res.json().items).toEqual([]);
  });

  it("exposes X-Guest-Cart-Token via CORS so cross-origin browser fetch() can read it", async () => {
    // Regression test: @fastify/cors only sets Access-Control-Expose-Headers
    // when it sees an Origin header, so this must be sent explicitly — a
    // plain same-origin inject() (no Origin header) would pass even if
    // `exposedHeaders` were missing from the CORS plugin config.
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/cart",
      headers: { origin: "http://localhost:5173" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-expose-headers"]).toContain("X-Guest-Cart-Token");
  });

  it("adds an item to a guest cart and computes totals", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 20000, stock: 10 });

    const first = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = first.headers["x-guest-cart-token"] as string;

    const addRes = await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: { "x-guest-cart-token": guestToken },
      payload: { productId: product.id, quantity: 2 },
    });
    expect(addRes.statusCode).toBe(200);
    const cart = addRes.json();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.subtotalInPaise).toBe(40000);
    expect(cart.totalInPaise).toBe(40000);
  });

  it("rejects adding more items than available stock", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 2 });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      payload: { productId: product.id, quantity: 5 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("updates and removes cart items", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 10 });

    const first = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = first.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };

    const addRes = await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });
    const itemId = addRes.json().items[0].id;

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/cart/items/${itemId}`,
      headers,
      payload: { quantity: 3 },
    });
    expect(updateRes.json().items[0].quantity).toBe(3);

    const removeRes = await app.inject({ method: "DELETE", url: `/api/v1/cart/items/${itemId}`, headers });
    expect(removeRes.json().items).toHaveLength(0);
  });

  it("applies and removes a coupon, respecting minimum order amount", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 50000, stock: 10 });
    await testPrisma.coupon.create({
      data: { code: "SAVE10", type: "PERCENTAGE", value: 10, minOrderAmountInPaise: 100000, isActive: true },
    });

    const first = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = first.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };

    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });

    const belowMin = await app.inject({ method: "POST", url: "/api/v1/cart/apply-coupon", headers, payload: { code: "SAVE10" } });
    expect(belowMin.statusCode).toBe(400);

    await app.inject({
      method: "PATCH",
      url: `/api/v1/cart/items/${(await (await app.inject({ method: "GET", url: "/api/v1/cart", headers })).json()).items[0].id}`,
      headers,
      payload: { quantity: 2 },
    });

    const applyRes = await app.inject({ method: "POST", url: "/api/v1/cart/apply-coupon", headers, payload: { code: "SAVE10" } });
    expect(applyRes.statusCode).toBe(200);
    expect(applyRes.json().discountInPaise).toBe(10000);
    expect(applyRes.json().totalInPaise).toBe(90000);

    const removeRes = await app.inject({ method: "DELETE", url: "/api/v1/cart/coupon", headers });
    expect(removeRes.json().discountInPaise).toBe(0);
  });

  it("merges a guest cart into the user's cart on login without duplicating lines", async () => {
    const category = await createTestCategory(testPrisma);
    const productA = await createTestProduct(testPrisma, { categoryId: category.id, stock: 10 });
    const productB = await createTestProduct(testPrisma, { categoryId: category.id, stock: 10 });

    const guestRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = guestRes.headers["x-guest-cart-token"] as string;
    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: { "x-guest-cart-token": guestToken },
      payload: { productId: productA.id, quantity: 1 },
    });

    const { user, password } = await createTestUser(testPrisma, { email: "merge@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    // User already has one item in their own account cart before merging.
    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: authHeader(accessToken),
      payload: { productId: productB.id, quantity: 1 },
    });

    const mergeRes = await app.inject({
      method: "POST",
      url: "/api/v1/cart/merge",
      headers: authHeader(accessToken),
      payload: { guestToken },
    });
    expect(mergeRes.statusCode).toBe(200);
    expect(mergeRes.json().items).toHaveLength(2);

    const finalRes = await app.inject({ method: "GET", url: "/api/v1/cart", headers: authHeader(accessToken) });
    expect(finalRes.json().items).toHaveLength(2);
  });
});
