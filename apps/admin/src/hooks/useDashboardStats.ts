import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../lib/api/dashboard";
import { queryKeys } from "../lib/query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => getDashboardStats(),
  });
}
