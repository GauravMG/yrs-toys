import { apiFetch } from "../api-client";

/** Mirrors `adminDashboardStatsSchema` in apps/api/src/modules/admin-dashboard/routes.ts (not exported from @yrs/shared). */
export interface AdminDashboardStats {
  todayOrderCount: number;
  todayRevenueInPaise: number;
  pendingReviewCount: number;
  lowStockProducts: { id: string; name: string; slug: string; stock: number }[];
}

export function getDashboardStats(): Promise<AdminDashboardStats> {
  return apiFetch<AdminDashboardStats>("/admin/dashboard/stats");
}
