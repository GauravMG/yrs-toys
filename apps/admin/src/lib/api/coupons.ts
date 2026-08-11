import type { Coupon, CouponInput, CouponUpdateInput } from "@yrs/shared";
import { apiFetch } from "../api-client";

export function listCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/admin/coupons");
}

export function createCoupon(input: CouponInput): Promise<Coupon> {
  return apiFetch<Coupon>("/admin/coupons", { method: "POST", body: input });
}

export function updateCoupon(id: string, input: CouponUpdateInput): Promise<Coupon> {
  return apiFetch<Coupon>(`/admin/coupons/${id}`, { method: "PATCH", body: input });
}

export function deleteCoupon(id: string): Promise<void> {
  return apiFetch<void>(`/admin/coupons/${id}`, { method: "DELETE" });
}
