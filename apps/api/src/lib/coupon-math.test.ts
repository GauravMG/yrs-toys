import { describe, it, expect } from "vitest";
import { calculateCouponDiscount, couponEligibilityError } from "./coupon-math.js";

describe("calculateCouponDiscount", () => {
  it("computes a percentage discount", () => {
    expect(calculateCouponDiscount({ type: "PERCENTAGE", value: 10, maxDiscountInPaise: null }, 100000)).toBe(10000);
  });

  it("caps a percentage discount at maxDiscountInPaise", () => {
    expect(calculateCouponDiscount({ type: "PERCENTAGE", value: 50, maxDiscountInPaise: 30000 }, 100000)).toBe(30000);
  });

  it("applies a fixed discount", () => {
    expect(calculateCouponDiscount({ type: "FIXED", value: 15000, maxDiscountInPaise: null }, 100000)).toBe(15000);
  });

  it("never discounts more than the subtotal", () => {
    expect(calculateCouponDiscount({ type: "FIXED", value: 999999, maxDiscountInPaise: null }, 50000)).toBe(50000);
  });
});

describe("couponEligibilityError", () => {
  const base = {
    isActive: true,
    startsAt: null,
    expiresAt: null,
    minOrderAmountInPaise: null,
    usageLimit: null,
    timesUsed: 0,
  };

  it("allows an active, unrestricted coupon", () => {
    expect(couponEligibilityError(base, 10000)).toBeNull();
  });

  it("rejects an inactive coupon", () => {
    expect(couponEligibilityError({ ...base, isActive: false }, 10000)).toMatch(/no longer active/);
  });

  it("rejects a coupon that hasn't started yet", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(couponEligibilityError({ ...base, startsAt: future }, 10000)).toMatch(/not active yet/);
  });

  it("rejects an expired coupon", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(couponEligibilityError({ ...base, expiresAt: past }, 10000)).toMatch(/expired/);
  });

  it("rejects when usage limit is reached", () => {
    expect(couponEligibilityError({ ...base, usageLimit: 5, timesUsed: 5 }, 10000)).toMatch(/usage limit/);
  });

  it("rejects when subtotal is below the minimum order amount", () => {
    expect(couponEligibilityError({ ...base, minOrderAmountInPaise: 50000 }, 10000)).toMatch(/minimum order/);
  });

  it("allows when subtotal meets the minimum order amount exactly", () => {
    expect(couponEligibilityError({ ...base, minOrderAmountInPaise: 50000 }, 50000)).toBeNull();
  });
});
