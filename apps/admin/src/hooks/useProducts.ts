import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductInput, ProductUpdateInput, ProductVariantInput } from "@yrs/shared";
import * as productsApi from "../lib/api/products";
import type { AdminProductListQuery } from "../lib/api/products";
import { queryKeys } from "../lib/query-keys";

export function useAdminProducts(query: AdminProductListQuery) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => productsApi.listAdminProducts(query),
    placeholderData: (prev) => prev,
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(id ?? ""),
    queryFn: () => productsApi.getAdminProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => productsApi.createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsAll });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductUpdateInput) => productsApi.updateProduct(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productsAll });
    },
  });
}

export function useUploadProductImage(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => productsApi.uploadProductImage(productId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useDeleteProductImage(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => productsApi.deleteProductImage(productId, imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useAddProductVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductVariantInput) => productsApi.addProductVariant(productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useUpdateProductVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, input }: { variantId: string; input: Partial<ProductVariantInput> }) =>
      productsApi.updateProductVariant(productId, variantId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useDeleteProductVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => productsApi.deleteProductVariant(productId, variantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}
