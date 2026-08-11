import type { Coupon } from "@yrs/db";

/**
 * Pure discount calculation shared by the cart preview (modules/cart) and
 * the checkout transaction (modules/orders) so the amount a customer sees
 * in their cart is exactly what gets charged at checkout.
 */
export function calculateCouponDiscount(coupon: Pick<Coupon, "type" | "value" | "maxDiscountInPaise">, subtotalInPaise: number): number {
  let discount = coupon.type === "PERCENTAGE" ? Math.round((subtotalInPaise * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscountInPaise != null) {
    discount = Math.min(discount, coupon.maxDiscountInPaise);
  }
  return Math.min(discount, subtotalInPaise);
}

export interface CouponEligibilityInput {
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  minOrderAmountInPaise: number | null;
  usageLimit: number | null;
  timesUsed: number;
}

export function couponEligibilityError(coupon: CouponEligibilityInput, subtotalInPaise: number, now = new Date()): string | null {
  if (!coupon.isActive) return "This coupon is no longer active";
  if (coupon.startsAt && coupon.startsAt > now) return "This coupon is not active yet";
  if (coupon.expiresAt && coupon.expiresAt < now) return "This coupon has expired";
  if (coupon.usageLimit != null && coupon.timesUsed >= coupon.usageLimit) return "This coupon has reached its usage limit";
  if (coupon.minOrderAmountInPaise != null && subtotalInPaise < coupon.minOrderAmountInPaise) {
    return `Add more items to your cart to use this coupon (minimum order applies)`;
  }
  return null;
}
