import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WishlistItem } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";
import { useAuth } from "./useAuth";

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.wishlist.root,
    queryFn: () => apiClient.get<WishlistItem[]>("/wishlist"),
    enabled: isAuthenticated,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiClient.post<WishlistItem>(`/wishlist/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.root }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiClient.delete<void>(`/wishlist/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.root }),
  });
}
