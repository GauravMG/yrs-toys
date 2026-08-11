import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, createTestAdmin, createTestProduct, loginTestUser, authHeader } from "../helpers/factories.js";

let orderCounter = 0;
function baseOrderData(overrides: Partial<{
  createdAt: Date;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalInPaise: number;
  userId: string;
}> = {}) {
  orderCounter += 1;
  return {
    orderNumber: `ORD-${Date.now()}-${orderCounter}`,
    subtotalInPaise: overrides.totalInPaise ?? 1000,
    totalInPaise: overrides.totalInPaise ?? 1000,
    paymentStatus: overrides.paymentStatus ?? "PENDING",
    shipFullName: "Test Buyer",
    shipPhone: "9876543210",
    shipLine1: "1 Test Street",
    shipCity: "Bengaluru",
    shipState: "Karnataka",
    shipPostalCode: "560001",
    ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    ...(overrides.userId ? { userId: overrides.userId } : {}),
  };
}

describe("admin dashboard routes", () => {
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

  async function adminAuth() {
    const { user, password } = await createTestAdmin(testPrisma);
    const { accessToken } = await loginTestUser(app, user.email, password);
    return authHeader(accessToken);
  }

  it("rejects the stats endpoint without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/admin/dashboard/stats" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects the stats endpoint for a non-admin user", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "customer@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard/stats",
      headers: authHeader(accessToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it("computes today's order count, paid revenue, pending reviews, and low stock products", async () => {
    const headers = await adminAuth();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's orders: one paid (counts toward revenue), one pending (counts toward order count only).
    await testPrisma.order.create({ data: baseOrderData({ paymentStatus: "PAID", totalInPaise: 5000 }) });
    await testPrisma.order.create({ data: baseOrderData({ paymentStatus: "PENDING", totalInPaise: 2000 }) });
    // Yesterday's order should not be counted at all.
    await testPrisma.order.create({ data: baseOrderData({ paymentStatus: "PAID", totalInPaise: 9999, createdAt: yesterday }) });

    const { user: reviewer } = await createTestUser(testPrisma, { email: "reviewer@example.com" });
    const product = await createTestProduct(testPrisma);
    const product2 = await createTestProduct(testPrisma);
    await testPrisma.review.create({
      data: { productId: product.id, userId: reviewer.id, rating: 4, comment: "Nice", status: "PENDING" },
    });
    await testPrisma.review.create({
      data: { productId: product2.id, userId: reviewer.id, rating: 5, comment: "Great", status: "APPROVED" },
    });

    await createTestProduct(testPrisma, { name: "Low Stock A", stock: 2 });
    await createTestProduct(testPrisma, { name: "Low Stock B", stock: 1 });
    await createTestProduct(testPrisma, { name: "Plenty In Stock", stock: 50 });
    await createTestProduct(testPrisma, { name: "Low Stock Inactive", stock: 0, isActive: false });

    const res = await app.inject({ method: "GET", url: "/api/v1/admin/dashboard/stats", headers });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.todayOrderCount).toBe(2);
    expect(body.todayRevenueInPaise).toBe(5000);
    expect(body.pendingReviewCount).toBe(1);

    const lowStockNames = body.lowStockProducts.map((p: { name: string }) => p.name);
    expect(lowStockNames).toContain("Low Stock A");
    expect(lowStockNames).toContain("Low Stock B");
    expect(lowStockNames).not.toContain("Plenty In Stock");
    expect(lowStockNames).not.toContain("Low Stock Inactive");
    // Ascending by stock.
    expect(body.lowStockProducts[0].stock).toBeLessThanOrEqual(body.lowStockProducts[1].stock);
  });

  it("returns zero revenue when there are no paid orders today", async () => {
    const headers = await adminAuth();
    const res = await app.inject({ method: "GET", url: "/api/v1/admin/dashboard/stats", headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().todayRevenueInPaise).toBe(0);
    expect(res.json().todayOrderCount).toBe(0);
  });
});
