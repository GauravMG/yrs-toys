import type { FastifyInstance } from "fastify";
import type { PrismaClient, Role, AgeGroup } from "@yrs/db";
import { hashPassword } from "../../lib/argon2.js";

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createTestUser(
  prisma: PrismaClient,
  overrides: { email?: string; password?: string; role?: Role; fullName?: string } = {},
) {
  const password = overrides.password ?? "Password@123";
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `${unique("user")}@example.com`,
      passwordHash,
      fullName: overrides.fullName ?? "Test User",
      role: overrides.role ?? "CUSTOMER",
      emailVerifiedAt: new Date(),
    },
  });
  return { user, password };
}

export function createTestAdmin(prisma: PrismaClient) {
  return createTestUser(prisma, { role: "ADMIN", fullName: "Test Admin" });
}

export async function createTestCategory(prisma: PrismaClient, overrides: { name?: string; slug?: string } = {}) {
  const slug = overrides.slug ?? unique("category");
  return prisma.category.create({
    data: { name: overrides.name ?? "Test Category", slug },
  });
}

export async function createTestProduct(
  prisma: PrismaClient,
  overrides: Partial<{
    name: string;
    slug: string;
    priceInPaise: number;
    stock: number;
    ageGroup: AgeGroup;
    categoryId: string;
    isActive: boolean;
    isFeatured: boolean;
  }> = {},
) {
  const categoryId = overrides.categoryId ?? (await createTestCategory(prisma)).id;
  const slug = overrides.slug ?? unique("product");
  return prisma.product.create({
    data: {
      name: overrides.name ?? "Test Product",
      slug,
      shortDescription: "A short description",
      description: "A longer description of the test product.",
      priceInPaise: overrides.priceInPaise ?? 49900,
      sku: unique("SKU").toUpperCase(),
      stock: overrides.stock ?? 10,
      ageGroup: overrides.ageGroup ?? "AGE_1_3",
      categoryId,
      isActive: overrides.isActive ?? true,
      isFeatured: overrides.isFeatured ?? false,
    },
  });
}

export async function loginTestUser(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshCookie: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed in test helper: ${res.statusCode} ${res.body}`);
  }
  const body = res.json() as { accessToken: string };
  const setCookie = res.cookies.find((c) => c.name === "refresh_token");
  if (!setCookie) throw new Error("No refresh_token cookie returned from login");
  return { accessToken: body.accessToken, refreshCookie: `refresh_token=${setCookie.value}` };
}

export function authHeader(accessToken: string) {
  return { authorization: `Bearer ${accessToken}` };
}
