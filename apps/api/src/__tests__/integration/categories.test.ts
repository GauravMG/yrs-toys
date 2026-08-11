import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, createTestAdmin, createTestCategory, createTestProduct, loginTestUser, authHeader } from "../helpers/factories.js";

describe("category routes", () => {
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

  it("returns the active top-level category tree with nested children", async () => {
    const parent = await testPrisma.category.create({ data: { name: "Toys", slug: "toys", sortOrder: 1 } });
    await testPrisma.category.create({ data: { name: "Blocks", slug: "blocks", parentId: parent.id, sortOrder: 1 } });
    await testPrisma.category.create({
      data: { name: "Inactive Child", slug: "inactive-child", parentId: parent.id, isActive: false },
    });
    await testPrisma.category.create({ data: { name: "Inactive Top", slug: "inactive-top", isActive: false } });

    const res = await app.inject({ method: "GET", url: "/api/v1/categories" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<{ slug: string; children: Array<{ slug: string }> }>;
    expect(body).toHaveLength(1);
    expect(body[0]!.slug).toBe("toys");
    expect(body[0]!.children).toHaveLength(1);
    expect(body[0]!.children[0]!.slug).toBe("blocks");
  });

  it("gets a single category by slug with its direct children", async () => {
    const parent = await createTestCategory(testPrisma, { name: "Vehicles", slug: "vehicles" });
    await testPrisma.category.create({ data: { name: "Cars", slug: "cars", parentId: parent.id } });

    const res = await app.inject({ method: "GET", url: "/api/v1/categories/vehicles" });
    expect(res.statusCode).toBe(200);
    expect(res.json().children).toHaveLength(1);
  });

  it("returns 404 for a missing category slug", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/categories/does-not-exist" });
    expect(res.statusCode).toBe(404);
  });

  it("returns 404 for an inactive category by slug", async () => {
    await testPrisma.category.create({ data: { name: "Hidden", slug: "hidden", isActive: false } });
    const res = await app.inject({ method: "GET", url: "/api/v1/categories/hidden" });
    expect(res.statusCode).toBe(404);
  });

  it("creates a category as admin", async () => {
    const headers = await adminAuth();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/categories",
      headers,
      payload: { name: "Puzzles", slug: "puzzles" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().slug).toBe("puzzles");
  });

  it("rejects category creation without auth", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/categories",
      payload: { name: "Puzzles", slug: "puzzles" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects category creation for a non-admin user", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "customer@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/categories",
      headers: authHeader(accessToken),
      payload: { name: "Puzzles", slug: "puzzles" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("rejects an invalid category payload", async () => {
    const headers = await adminAuth();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/categories",
      headers,
      payload: { name: "P", slug: "Not Kebab Case!" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("updates a category as admin", async () => {
    const headers = await adminAuth();
    const category = await createTestCategory(testPrisma, { name: "Old Name", slug: "old-name" });
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/categories/${category.id}`,
      headers,
      payload: { name: "New Name" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("New Name");
  });

  it("deletes a category with no products or children", async () => {
    const headers = await adminAuth();
    const category = await createTestCategory(testPrisma, { name: "Empty", slug: "empty" });
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/categories/${category.id}`,
      headers,
    });
    expect(res.statusCode).toBe(204);
  });

  it("blocks deleting a category that has products (409)", async () => {
    const headers = await adminAuth();
    const category = await createTestCategory(testPrisma, { name: "HasProducts", slug: "has-products" });
    await createTestProduct(testPrisma, { categoryId: category.id });

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/categories/${category.id}`,
      headers,
    });
    expect(res.statusCode).toBe(409);
  });

  it("blocks deleting a category that has child categories (409)", async () => {
    const headers = await adminAuth();
    const parent = await createTestCategory(testPrisma, { name: "Parent", slug: "parent-cat" });
    await testPrisma.category.create({ data: { name: "Child", slug: "child-cat", parentId: parent.id } });

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/categories/${parent.id}`,
      headers,
    });
    expect(res.statusCode).toBe(409);
  });
});
