import { z } from "zod";

// Mirrors the Prisma enums in packages/db/prisma/schema.prisma exactly.
// Kept as the single source of truth for both API validation and frontend
// display logic (labels, filter options, status colors).

export const RoleEnum = z.enum(["CUSTOMER", "ADMIN"]);
export type RoleValue = z.infer<typeof RoleEnum>;

export const AgeGroupEnum = z.enum(["AGE_0_1", "AGE_1_3", "AGE_3_6", "AGE_6_PLUS", "ALL_AGES"]);
export type AgeGroupValue = z.infer<typeof AgeGroupEnum>;

export const AGE_GROUP_LABELS: Record<AgeGroupValue, string> = {
  AGE_0_1: "0 - 1 Year",
  AGE_1_3: "1 - 3 Years",
  AGE_3_6: "3 - 6 Years",
  AGE_6_PLUS: "6+ Years",
  ALL_AGES: "All Ages",
};

export const OrderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export type OrderStatusValue = z.infer<typeof OrderStatusEnum>;

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const PaymentStatusEnum = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]);
export type PaymentStatusValue = z.infer<typeof PaymentStatusEnum>;

export const PaymentMethodEnum = z.enum(["COD", "RAZORPAY", "STRIPE", "PAYTM"]);
export type PaymentMethodValue = z.infer<typeof PaymentMethodEnum>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  COD: "Cash on Delivery",
  RAZORPAY: "Razorpay",
  STRIPE: "Stripe",
  PAYTM: "Paytm",
};

// Only COD is a live, selectable option today; the rest are reserved for
// when a real gateway adapter is implemented (see apps/api/src/payments).
export const LIVE_PAYMENT_METHODS: PaymentMethodValue[] = ["COD"];

export const CouponTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);
export type CouponTypeValue = z.infer<typeof CouponTypeEnum>;

export const ReviewStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ReviewStatusValue = z.infer<typeof ReviewStatusEnum>;
