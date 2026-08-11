import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CouponInput, CouponUpdateInput } from "@yrs/shared";
import * as couponsApi from "../lib/api/coupons";
import { queryKeys } from "../lib/query-keys";

export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons,
    queryFn: () => couponsApi.listCoupons(),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => couponsApi.createCoupon(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
    },
  });
}

export function useUpdateCoupon(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponUpdateInput) => couponsApi.updateCoupon(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponsApi.deleteCoupon(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
    },
  });
}
