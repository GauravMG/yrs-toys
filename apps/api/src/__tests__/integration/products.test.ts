import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestAdmin, createTestCategory, createTestProduct, loginTestUser, authHeader } from "../helpers/factories.js";

describe("products routes", () => {
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

  it("lists only active products, paginated", async () => {
    const category = await createTestCategory(testPrisma);
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Active One" });
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Inactive One", isActive: false });

    const res = await app.inject({ method: "GET", url: "/api/v1/products" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].name).toBe("Active One");
  });

  it("filters by categorySlug and ageGroup together", async () => {
    const catA = await createTestCategory(testPrisma, { slug: "wooden" });
    const catB = await createTestCategory(testPrisma, { slug: "plush" });
    await createTestProduct(testPrisma, { categoryId: catA.id, ageGroup: "AGE_0_1", name: "Wooden Baby" });
    await createTestProduct(testPrisma, { categoryId: catA.id, ageGroup: "AGE_3_6", name: "Wooden Kid" });
    await createTestProduct(testPrisma, { categoryId: catB.id, ageGroup: "AGE_0_1", name: "Plush Baby" });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products?categorySlug=wooden&ageGroup=AGE_0_1",
    });
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].name).toBe("Wooden Baby");
  });

  it("filters by price range", async () => {
    const category = await createTestCategory(testPrisma);
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Cheap", priceInPaise: 10000 });
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Mid", priceInPaise: 50000 });
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Expensive", priceInPaise: 500000 });

    const res = await app.inject({ method: "GET", url: "/api/v1/products?minPrice=20000&maxPrice=100000" });
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].name).toBe("Mid");
  });

  it("finds products by full-text search", async () => {
    const category = await createTestCategory(testPrisma);
    await testPrisma.product.create({
      data: {
        name: "Wooden Train Set",
        slug: "wooden-train-set",
        shortDescription: "A lovely wooden train",
        description: "Great for imaginative railway play",
        priceInPaise: 129900,
        sku: "SKU-TRAIN-1",
        stock: 10,
        ageGroup: "AGE_3_6",
        categoryId: category.id,
      },
    });
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Plush Bear" });

    const res = await app.inject({ method: "GET", url: "/api/v1/products?q=wooden+train" });
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].name).toBe("Wooden Train Set");
  });

  it("returns a product detail by slug with 404 for unknown slug", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id, slug: "known-product" });

    const found = await app.inject({ method: "GET", url: `/api/v1/products/${product.slug}` });
    expect(found.statusCode).toBe(200);
    expect(found.json().slug).toBe("known-product");

    const missing = await app.inject({ method: "GET", url: "/api/v1/products/does-not-exist" });
    expect(missing.statusCode).toBe(404);
  });

  it("returns related products from the same category, excluding self", async () => {
    const category = await createTestCategory(testPrisma);
    const main = await createTestProduct(testPrisma, { categoryId: category.id, name: "Main" });
    await createTestProduct(testPrisma, { categoryId: category.id, name: "Sibling" });

    const res = await app.inject({ method: "GET", url: `/api/v1/products/${main.slug}/related` });
    const body = res.json();
    expect(body.every((p: { id: string }) => p.id !== main.id)).toBe(true);
    expect(body.some((p: { name: string }) => p.name === "Sibling")).toBe(true);
  });

  it("rejects non-admin access to admin product routes", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/admin/products" });
    expect(res.statusCode).toBe(401);
  });

  it("lets an admin create, update and soft-delete a product", async () => {
    const category = await createTestCategory(testPrisma);
    const { user, password } = await createTestAdmin(testPrisma);
    const { accessToken } = await loginTestUser(app, user.email, password);

    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/admin/products",
      headers: authHeader(accessToken),
      payload: {
        name: "New Toy",
        slug: "new-toy",
        shortDescription: "Short desc",
        description: "Long description",
        priceInPaise: 39900,
        sku: "SKU-NEWTOY-1",
        stock: 5,
        ageGroup: "AGE_1_3",
        categoryId: category.id,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json();

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/products/${created.id}`,
      headers: authHeader(accessToken),
      payload: { priceInPaise: 44900 },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().priceInPaise).toBe(44900);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/products/${created.id}`,
      headers: authHeader(accessToken),
    });
    expect(deleteRes.statusCode).toBe(204);

    const publicRes = await app.inject({ method: "GET", url: `/api/v1/products/${created.slug}` });
    expect(publicRes.statusCode).toBe(404);

    const adminRes = await app.inject({
      method: "GET",
      url: `/api/v1/admin/products/${created.id}`,
      headers: authHeader(accessToken),
    });
    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.json().isActive).toBe(false);
  });

  it("rejects creating a product with an unknown categoryId", async () => {
    const { user, password } = await createTestAdmin(testPrisma);
    const { accessToken } = await loginTestUser(app, user.email, password);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/products",
      headers: authHeader(accessToken),
      payload: {
        name: "Bad Category",
        slug: "bad-category",
        shortDescription: "x",
        description: "y",
        priceInPaise: 1000,
        sku: "SKU-BAD-1",
        stock: 1,
        ageGroup: "AGE_1_3",
        categoryId: "nonexistent-id",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("manages variants: add, update, delete", async () => {
    const category = await createTestCategory(testPrisma);
    const product = await createTestProduct(testPrisma, { categoryId: category.id });
    const { user, password } = await createTestAdmin(testPrisma);
    const { accessToken } = await loginTestUser(app, user.email, password);

    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/admin/products/${product.id}/variants`,
      headers: authHeader(accessToken),
      payload: { name: "Color", value: "Sage Green", skuSuffix: "SAGE" },
    });
    expect(addRes.statusCode).toBe(201);
    const variant = addRes.json();

    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/products/${product.id}/variants/${variant.id}`,
      headers: authHeader(accessToken),
      payload: { value: "Forest Green" },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().value).toBe("Forest Green");

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/products/${product.id}/variants/${variant.id}`,
      headers: authHeader(accessToken),
    });
    expect(deleteRes.statusCode).toBe(204);

    const deleteAgain = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/products/${product.id}/variants/${variant.id}`,
      headers: authHeader(accessToken),
    });
    expect(deleteAgain.statusCode).toBe(404);
  });
});
