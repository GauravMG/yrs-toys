import type { PrismaClient, Prisma } from "@yrs/db";
import { paginationSkip } from "../../lib/pagination.js";

const orderInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function orderRepository(prisma: PrismaClient) {
  return {
    create(data: Prisma.OrderCreateInput) {
      return prisma.order.create({ data, include: orderInclude });
    },

    findByOrderNumber(orderNumber: string) {
      return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    },

    findById(id: string) {
      return prisma.order.findUnique({ where: { id }, include: orderInclude });
    },

    async findManyForUser(userId: string, page: number, limit: number) {
      const where = { userId };
      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: paginationSkip(page, limit), take: limit }),
      ]);
      return { rows, total };
    },

    async findManyForAdmin(filters: { status?: string; from?: Date; to?: Date; q?: string }, page: number, limit: number) {
      const where: Prisma.OrderWhereInput = {
        status: filters.status as Prisma.EnumOrderStatusFilter["equals"] | undefined,
        createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
        OR: filters.q
          ? [{ orderNumber: { contains: filters.q, mode: "insensitive" } }, { guestEmail: { contains: filters.q, mode: "insensitive" } }]
          : undefined,
      };
      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: paginationSkip(page, limit), take: limit }),
      ]);
      return { rows, total };
    },

    updateStatus(id: string, status: Prisma.OrderUpdateInput["status"]) {
      return prisma.order.update({ where: { id }, data: { status }, include: orderInclude });
    },

    setCancelled(id: string, reason: string | undefined) {
      return prisma.order.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
        include: orderInclude,
      });
    },

    addStatusHistory(orderId: string, status: string, note?: string, changedByUserId?: string) {
      return prisma.orderStatusHistory.create({
        data: { orderId, status: status as Prisma.OrderStatusHistoryCreateInput["status"], note, changedByUserId },
      });
    },

    findUserById(userId: string) {
      return prisma.user.findUnique({ where: { id: userId } });
    },

    incrementCouponUsage(couponId: string) {
      return prisma.coupon.update({ where: { id: couponId }, data: { timesUsed: { increment: 1 } } });
    },
  };
}
export type OrderRepository = ReturnType<typeof orderRepository>;
