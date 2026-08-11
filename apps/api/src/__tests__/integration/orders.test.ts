import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestAdmin, createTestCategory, createTestProduct, createTestUser, loginTestUser, authHeader } from "../helpers/factories.js";

const shippingAddress = {
  fullName: "Asha Verma",
  phone: "9876543210",
  line1: "14 Lotus Enclave",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "110016",
  country: "India",
};

describe("orders / checkout routes", () => {
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

  it("rejects checkout with an empty cart", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { shippingAddress, guestEmail: "guest@example.com" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("requires a guest email when checking out unauthenticated", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 50000, stock: 10 });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: { "x-guest-cart-token": guestToken },
      payload: { productId: product.id, quantity: 1 },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: { "x-guest-cart-token": guestToken },
      payload: { shippingAddress },
    });
    expect(res.statusCode).toBe(400);
  });

  it("completes a full guest COD checkout: decrements stock, creates a PENDING COD payment, clears the cart", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 20000, stock: 5 });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };
    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 2 } });

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress, guestEmail: "guest@example.com", paymentMethod: "COD" },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const order = checkoutRes.json();
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.paymentMethod).toBe("COD");
    expect(order.subtotalInPaise).toBe(40000);
    expect(order.shippingInPaise).toBe(4900); // below the free-shipping threshold
    expect(order.totalInPaise).toBe(44900);
    expect(order.items).toHaveLength(1);
    expect(order.orderNumber).toMatch(/^YRS-\d{8}-\d{4}$/);
    // The checkout response must reflect the PENDING history row written
    // inside the same transaction, not a stale pre-write snapshot.
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0].status).toBe("PENDING");

    const updatedProduct = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updatedProduct.stock).toBe(3);

    const payment = await testPrisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.method).toBe("COD");
    expect(payment.status).toBe("PENDING");
    expect(payment.amountInPaise).toBe(order.totalInPaise);

    const cartAfter = await app.inject({ method: "GET", url: "/api/v1/cart", headers });
    expect(cartAfter.json().items).toHaveLength(0);
  });

  it("gives free shipping at or above the threshold", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 100000, stock: 5 });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };
    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress, guestEmail: "guest@example.com" },
    });
    expect(checkoutRes.json().shippingInPaise).toBe(0);
  });

  it("rejects checkout when requested quantity exceeds current stock", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 1 });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };
    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });

    // Stock drops to 0 after the cart line was added (e.g. another buyer purchased it).
    await testPrisma.product.update({ where: { id: product.id }, data: { stock: 0 } });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress, guestEmail: "guest@example.com" },
    });
    expect(res.statusCode).toBe(400);

    const untouched = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(untouched.stock).toBe(0);
  });

  it("applies a cart coupon at checkout and increments its usage count", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, priceInPaise: 100000, stock: 5 });
    const coupon = await testPrisma.coupon.create({
      data: { code: "SAVE10", type: "PERCENTAGE", value: 10, isActive: true },
    });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };
    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });
    await app.inject({ method: "POST", url: "/api/v1/cart/apply-coupon", headers, payload: { code: "SAVE10" } });

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress, guestEmail: "guest@example.com" },
    });
    expect(checkoutRes.json().discountInPaise).toBe(10000);

    const refreshedCoupon = await testPrisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } });
    expect(refreshedCoupon.timesUsed).toBe(1);
  });

  it("lets an authenticated customer check out, list, and fetch their order", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "buyer@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const headers = authHeader(accessToken);

    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const orderNumber = checkoutRes.json().orderNumber;

    const listRes = await app.inject({ method: "GET", url: "/api/v1/orders", headers });
    expect(listRes.json().total).toBe(1);

    const detailRes = await app.inject({ method: "GET", url: `/api/v1/orders/${orderNumber}`, headers });
    expect(detailRes.statusCode).toBe(200);

    // A different logged-in user must not be able to view it.
    const { user: other, password: otherPw } = await createTestUser(testPrisma, { email: "notbuyer@example.com" });
    const { accessToken: otherToken } = await loginTestUser(app, other.email, otherPw);
    const forbiddenRes = await app.inject({
      method: "GET",
      url: `/api/v1/orders/${orderNumber}`,
      headers: authHeader(otherToken),
    });
    expect(forbiddenRes.statusCode).toBe(404);
  });

  it("lets a guest look up their order by order number + matching email only", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });

    const cartRes = await app.inject({ method: "GET", url: "/api/v1/cart" });
    const guestToken = cartRes.headers["x-guest-cart-token"] as string;
    const headers = { "x-guest-cart-token": guestToken };
    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers,
      payload: { shippingAddress, guestEmail: "guest@example.com" },
    });
    const orderNumber = checkoutRes.json().orderNumber;

    const correctEmail = await app.inject({ method: "GET", url: `/api/v1/orders/${orderNumber}?email=guest@example.com` });
    expect(correctEmail.statusCode).toBe(200);

    const wrongEmail = await app.inject({ method: "GET", url: `/api/v1/orders/${orderNumber}?email=someone-else@example.com` });
    expect(wrongEmail.statusCode).toBe(404);

    const noEmail = await app.inject({ method: "GET", url: `/api/v1/orders/${orderNumber}` });
    expect(noEmail.statusCode).toBe(404);
  });

  it("lets a customer cancel a PENDING order and restocks inventory", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "canceller@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const headers = authHeader(accessToken);

    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 2 } });
    const checkoutRes = await app.inject({ method: "POST", url: "/api/v1/orders", headers, payload: { shippingAddress } });
    const orderNumber = checkoutRes.json().orderNumber;

    const afterCheckout = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(afterCheckout.stock).toBe(3);

    const cancelRes = await app.inject({
      method: "POST",
      url: `/api/v1/orders/${orderNumber}/cancel`,
      headers,
      payload: { reason: "Changed my mind" },
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json().status).toBe("CANCELLED");

    const afterCancel = await testPrisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(afterCancel.stock).toBe(5);
  });

  it("prevents cancelling an order that has already shipped", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "shipped@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const headers = authHeader(accessToken);

    await app.inject({ method: "POST", url: "/api/v1/cart/items", headers, payload: { productId: product.id, quantity: 1 } });
    const checkoutRes = await app.inject({ method: "POST", url: "/api/v1/orders", headers, payload: { shippingAddress } });
    const order = checkoutRes.json();

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);
    const adminHeaders = authHeader(adminToken);

    await app.inject({ method: "PATCH", url: `/api/v1/admin/orders/${order.id}/status`, headers: adminHeaders, payload: { status: "CONFIRMED" } });
    await app.inject({ method: "PATCH", url: `/api/v1/admin/orders/${order.id}/status`, headers: adminHeaders, payload: { status: "PROCESSING" } });
    await app.inject({ method: "PATCH", url: `/api/v1/admin/orders/${order.id}/status`, headers: adminHeaders, payload: { status: "SHIPPED" } });

    const cancelRes = await app.inject({
      method: "POST",
      url: `/api/v1/orders/${order.orderNumber}/cancel`,
      headers,
      payload: {},
    });
    expect(cancelRes.statusCode).toBe(409);
  });

  it("rejects an invalid admin status transition (skipping stages)", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "skip@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: authHeader(accessToken),
      payload: { productId: product.id, quantity: 1 },
    });
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: authHeader(accessToken),
      payload: { shippingAddress },
    });
    const order = checkoutRes.json();

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/orders/${order.id}/status`,
      headers: authHeader(adminToken),
      payload: { status: "SHIPPED" }, // skipping CONFIRMED/PROCESSING
    });
    expect(res.statusCode).toBe(409);
  });

  it("marks COD payment PAID when an order transitions to DELIVERED, and writes status history", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "delivered@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: authHeader(accessToken),
      payload: { productId: product.id, quantity: 1 },
    });
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: authHeader(accessToken),
      payload: { shippingAddress },
    });
    const order = checkoutRes.json();

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);
    const adminHeaders = authHeader(adminToken);

    for (const status of ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]) {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/admin/orders/${order.id}/status`,
        headers: adminHeaders,
        payload: { status },
      });
      expect(res.statusCode).toBe(200);
    }

    const finalRes = await app.inject({ method: "GET", url: `/api/v1/admin/orders/${order.id}`, headers: adminHeaders });
    const finalOrder = finalRes.json();
    expect(finalOrder.status).toBe("DELIVERED");
    expect(finalOrder.paymentStatus).toBe("PAID");
    // PENDING (created at checkout) + 4 transitions
    expect(finalOrder.statusHistory).toHaveLength(5);
  });

  it("filters admin order listing by status", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, stock: 5 });
    const { user, password } = await createTestUser(testPrisma, { email: "filter@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);

    await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: authHeader(accessToken),
      payload: { productId: product.id, quantity: 1 },
    });
    await app.inject({ method: "POST", url: "/api/v1/orders", headers: authHeader(accessToken), payload: { shippingAddress } });

    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);
    const { accessToken: adminToken } = await loginTestUser(app, admin.email, adminPassword);

    const pendingRes = await app.inject({
      method: "GET",
      url: "/api/v1/admin/orders?status=PENDING",
      headers: authHeader(adminToken),
    });
    expect(pendingRes.json().total).toBe(1);

    const shippedRes = await app.inject({
      method: "GET",
      url: "/api/v1/admin/orders?status=SHIPPED",
      headers: authHeader(adminToken),
    });
    expect(shippedRes.json().total).toBe(0);
  });
});
