import { prisma } from "@yrs/db";

/**
 * Truncates every application table and restarts identity sequences,
 * cascading through FKs. Call in `beforeEach` for test files that touch the
 * database so each test starts from a clean slate without needing a full
 * migrate-reset (slow) between every test.
 */
export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const quoted = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma as testPrisma };
