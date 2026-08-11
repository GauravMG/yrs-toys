import { z } from "zod";
import { CouponTypeEnum, toPaise, fromPaise } from "@yrs/shared";
import type { Coupon, CouponInput } from "@yrs/shared";

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(30)
      .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters/numbers only"),
    type: CouponTypeEnum,
    value: z.coerce.number({ invalid_type_error: "Enter a value" }).positive("Must be greater than 0"),
    minOrderAmount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
    maxDiscount: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
    usageLimit: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    usageLimitPerUser: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    startsAt: z.string().optional().or(z.literal("")),
    expiresAt: z.string().optional().or(z.literal("")),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.type !== "PERCENTAGE" || v.value <= 100, {
    message: "Percentage coupon value cannot exceed 100",
    path: ["value"],
  });
export type CouponFormValues = z.infer<typeof couponFormSchema>;

export const defaultCouponFormValues: CouponFormValues = {
  code: "",
  type: "PERCENTAGE",
  value: 0,
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function toCouponApiPayload(values: CouponFormValues): CouponInput {
  // `coupon.value` is overloaded by type (see apps/api/src/lib/coupon-math.ts):
  // for PERCENTAGE it's a 1-100 percentage; for FIXED it's used directly as
  // an integer-paise amount, with no separate "InPaise" field. The form
  // always collects FIXED discounts in rupees for usability and converts here.
  const value = values.type === "FIXED" ? toPaise(values.value) : values.value;
  const payload = {
    code: values.code,
    type: values.type,
    value,
    minOrderAmountInPaise: values.minOrderAmount !== "" && values.minOrderAmount !== undefined ? toPaise(values.minOrderAmount) : undefined,
    maxDiscountInPaise: values.maxDiscount !== "" && values.maxDiscount !== undefined ? toPaise(values.maxDiscount) : undefined,
    usageLimit: values.usageLimit !== "" && values.usageLimit !== undefined ? values.usageLimit : undefined,
    usageLimitPerUser: values.usageLimitPerUser !== "" && values.usageLimitPerUser !== undefined ? values.usageLimitPerUser : undefined,
    startsAt: toIsoOrUndefined(values.startsAt ?? ""),
    expiresAt: toIsoOrUndefined(values.expiresAt ?? ""),
    isActive: values.isActive ?? true,
  };
  return payload as CouponInput;
}

export function couponToFormValues(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.type === "FIXED" ? fromPaise(coupon.value) : coupon.value,
    minOrderAmount: coupon.minOrderAmountInPaise != null ? fromPaise(coupon.minOrderAmountInPaise) : "",
    maxDiscount: coupon.maxDiscountInPaise != null ? fromPaise(coupon.maxDiscountInPaise) : "",
    usageLimit: coupon.usageLimit ?? "",
    usageLimitPerUser: coupon.usageLimitPerUser ?? "",
    startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : "",
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : "",
    isActive: coupon.isActive,
  };
}
