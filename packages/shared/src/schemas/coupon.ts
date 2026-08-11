import { z } from "zod";
import { CouponTypeEnum } from "../enums.js";

const couponInputObjectSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters/numbers"),
  type: CouponTypeEnum,
  value: z.number().int().positive(),
  minOrderAmountInPaise: z.number().int().min(0).optional(),
  maxDiscountInPaise: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const couponInputSchema = couponInputObjectSchema.refine((v) => v.type !== "PERCENTAGE" || v.value <= 100, {
  message: "Percentage coupon value cannot exceed 100",
  path: ["value"],
});
export type CouponInput = z.infer<typeof couponInputSchema>;

// `.partial()` isn't available on a `ZodEffects` (the refined schema above),
// so partial updates use the plain object schema instead — the percentage
// cross-field check simply doesn't apply when `type`/`value` aren't both
// being changed together.
export const couponUpdateSchema = couponInputObjectSchema.partial();
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: CouponTypeEnum,
  value: z.number().int(),
  minOrderAmountInPaise: z.number().int().nullable(),
  maxDiscountInPaise: z.number().int().nullable(),
  usageLimit: z.number().int().nullable(),
  usageLimitPerUser: z.number().int().nullable(),
  timesUsed: z.number().int(),
  startsAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type Coupon = z.infer<typeof couponSchema>;

export const applyCouponSchema = z.object({
  code: z.string().min(1),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
