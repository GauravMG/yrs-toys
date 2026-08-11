import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address, AddressInput } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";
import { useAuth } from "./useAuth";

export function useAddresses() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: () => apiClient.get<Address[]>("/users/me/addresses"),
    enabled: isAuthenticated,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => apiClient.post<Address>("/users/me/addresses", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
      apiClient.patch<Address>(`/users/me/addresses/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/users/me/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch<Address>(`/users/me/addresses/${id}/default`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}
