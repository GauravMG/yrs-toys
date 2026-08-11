import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as ordersApi from "../lib/api/orders";
import { deriveCustomers } from "../lib/derive-customers";

const PAGE_SIZE = 100; // adminOrderListQuerySchema caps `limit` at 100

/**
 * No admin "list customers" endpoint exists (see lib/derive-customers.ts) —
 * this fetches order pages and derives a directory client-side. Starts with
 * the most recent page and lets the caller pull in more via `loadMore`.
 */
export function useCustomers() {
  const [pagesLoaded, setPagesLoaded] = useState(1);

  const query = useQuery({
    queryKey: ["customers", "derived", pagesLoaded],
    queryFn: async () => {
      const pages = await Promise.all(
        Array.from({ length: pagesLoaded }, (_, i) => ordersApi.listAdminOrders({ page: i + 1, limit: PAGE_SIZE })),
      );
      const orders = pages.flatMap((p) => p.items);
      const total = pages[0]?.total ?? 0;
      return { orders, total };
    },
    placeholderData: (prev) => prev,
  });

  const customers = useMemo(() => deriveCustomers(query.data?.orders ?? []), [query.data]);
  const ordersConsidered = query.data?.orders.length ?? 0;
  const totalOrders = query.data?.total ?? 0;
  const hasMore = ordersConsidered < totalOrders;

  return {
    ...query,
    customers,
    ordersConsidered,
    totalOrders,
    hasMore,
    loadMore: () => setPagesLoaded((n) => n + 1),
  };
}
