import type { PrismaClient, Coupon as CouponRow } from "@yrs/db";
import type { Coupon, CouponInput, CouponUpdateInput } from "@yrs/shared";
import { couponRepository } from "./repository.js";
import { NotFoundError } from "../../lib/http-errors.js";

function toCoupon(c: CouponRow): Coupon {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrderAmountInPaise: c.minOrderAmountInPaise,
    maxDiscountInPaise: c.maxDiscountInPaise,
    usageLimit: c.usageLimit,
    usageLimitPerUser: c.usageLimitPerUser,
    timesUsed: c.timesUsed,
    startsAt: c.startsAt?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

export function couponService(prisma: PrismaClient) {
  const repo = couponRepository(prisma);

  return {
    async list(): Promise<Coupon[]> {
      const rows = await repo.findMany();
      return rows.map(toCoupon);
    },

    async create(input: CouponInput): Promise<Coupon> {
      const created = await repo.create({
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmountInPaise: input.minOrderAmountInPaise,
        maxDiscountInPaise: input.maxDiscountInPaise,
        usageLimit: input.usageLimit,
        usageLimitPerUser: input.usageLimitPerUser,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        isActive: input.isActive ?? true,
      });
      return toCoupon(created);
    },

    async update(id: string, input: CouponUpdateInput): Promise<Coupon> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Coupon not found");

      const updated = await repo.update(id, {
        code: input.code?.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmountInPaise: input.minOrderAmountInPaise,
        maxDiscountInPaise: input.maxDiscountInPaise,
        usageLimit: input.usageLimit,
        usageLimitPerUser: input.usageLimitPerUser,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        isActive: input.isActive,
      });
      return toCoupon(updated);
    },

    async remove(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Coupon not found");
      await repo.delete(id);
    },
  };
}
export type CouponService = ReturnType<typeof couponService>;
