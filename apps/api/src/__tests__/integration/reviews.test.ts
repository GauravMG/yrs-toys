import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestAdmin, createTestCategory, createTestProduct, createTestUser, loginTestUser, authHeader } from "../helpers/factories.js";

describe("reviews routes", () => {
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

  async function setupProductAndUser() {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id });
    const { user, password } = await createTestUser(testPrisma, { email: "reviewer@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    return { product, user, accessToken };
  }

  it("creates a review as PENDING and hides it from the public listing until approved", async () => {
    const { product, accessToken } = await setupProductAndUser();

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 5, title: "Great toy", comment: "My kid loves it." },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().status).toBe("PENDING");
    expect(createRes.json().isVerifiedPurchase).toBe(false);

    const listRes = await app.inject({ method: "GET", url: `/api/v1/products/${product.slug}/reviews` });
    expect(listRes.json().total).toBe(0);
  });

  it("marks a review as a verified purchase when the reviewer has a delivered order for that product", async () => {
    const { product, user, accessToken } = await setupProductAndUser();

    const order = await testPrisma.order.create({
      data: {
        orderNumber: `YRS-TEST-${Date.now()}`,
        userId: user.id,
        status: "DELIVERED",
        subtotalInPaise: product.priceInPaise,
        totalInPaise: product.priceInPaise,
        shipFullName: "Test",
        shipPhone: "9876543210",
        shipLine1: "1 Test Street",
        shipCity: "Delhi",
        shipState: "Delhi",
        shipPostalCode: "110001",
        items: {
          create: [
            {
              productId: product.id,
              productNameSnapshot: product.name,
              unitPriceInPaise: product.priceInPaise,
              quantity: 1,
              lineTotalInPaise: product.priceInPaise,
            },
          ],
        },
      },
    });
    expect(order.status).toBe("DELIVERED");

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 4, comment: "Solid purchase." },
    });
    expect(createRes.json().isVerifiedPurchase).toBe(true);
  });

  it("shows an approved review publicly and recomputes product rating", async () => {
    const { product, accessToken } = await setupProductAndUser();
    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 5, comment: "Excellent!" },
    });
    const reviewId = createRes.json().id;

    const moderateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/reviews/${reviewId}/moderate`,
      headers: authHeader(adminToken),
      payload: { status: "APPROVED" },
    });
    expect(moderateRes.statusCode).toBe(200);
    expect(moderateRes.json().status).toBe("APPROVED");

    const listRes = await app.inject({ method: "GET", url: `/api/v1/products/${product.slug}/reviews` });
    expect(listRes.json().total).toBe(1);

    const productRes = await app.inject({ method: "GET", url: `/api/v1/products/${product.slug}` });
    expect(productRes.json().avgRating).toBe(5);
    expect(productRes.json().reviewCount).toBe(1);
  });

  it("prevents editing or deleting another user's review", async () => {
    const { product, accessToken } = await setupProductAndUser();
    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 3, comment: "It's fine." },
    });
    const reviewId = createRes.json().id;

    const { user: otherUser, password: otherPassword } = await createTestUser(testPrisma, { email: "other@example.com" });
    const { accessToken: otherToken } = await loginTestUser(app, otherUser.email, otherPassword);

    const editRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/reviews/${reviewId}`,
      headers: authHeader(otherToken),
      payload: { comment: "Hijacked!" },
    });
    expect(editRes.statusCode).toBe(403);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/reviews/${reviewId}`,
      headers: authHeader(otherToken),
    });
    expect(deleteRes.statusCode).toBe(403);
  });

  it("lets an admin delete any review", async () => {
    const { product, accessToken } = await setupProductAndUser();
    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 2, comment: "It was okay, not great." },
    });
    const reviewId = createRes.json().id;

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/reviews/${reviewId}`,
      headers: authHeader(adminToken),
    });
    expect(deleteRes.statusCode).toBe(204);
  });

  it("filters the admin review queue by status=PENDING", async () => {
    const { product, accessToken } = await setupProductAndUser();
    await app.inject({
      method: "POST",
      url: `/api/v1/products/${product.slug}/reviews`,
      headers: authHeader(accessToken),
      payload: { rating: 5, comment: "Nice." },
    });

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/reviews?status=PENDING",
      headers: authHeader(adminToken),
    });
    expect(res.json().total).toBe(1);
  });
});
