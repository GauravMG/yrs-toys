import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryInput } from "@yrs/shared";
import * as categoriesApi from "../lib/api/categories";
import { queryKeys } from "../lib/query-keys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoriesApi.listCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CategoryInput>) => categoriesApi.updateCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
