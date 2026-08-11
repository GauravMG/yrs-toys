import type { PrismaClient, Prisma } from "@yrs/db";

export function couponRepository(prisma: PrismaClient) {
  return {
    findMany() {
      return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    },
    findById(id: string) {
      return prisma.coupon.findUnique({ where: { id } });
    },
    create(data: Prisma.CouponCreateInput) {
      return prisma.coupon.create({ data });
    },
    update(id: string, data: Prisma.CouponUpdateInput) {
      return prisma.coupon.update({ where: { id }, data });
    },
    delete(id: string) {
      return prisma.coupon.delete({ where: { id } });
    },
  };
}
export type CouponRepository = ReturnType<typeof couponRepository>;
