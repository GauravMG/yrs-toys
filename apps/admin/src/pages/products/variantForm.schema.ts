import { z } from "zod";
import { toPaise, fromPaise } from "@yrs/shared";
import type { ProductVariant, ProductVariantInput } from "@yrs/shared";

export const variantFormSchema = z.object({
  name: z.string().min(1, "Required").max(60),
  value: z.string().min(1, "Required").max(60),
  skuSuffix: z.string().min(1, "Required").max(30),
  priceOverride: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  stockOverride: z.union([z.coerce.number().int().min(0), z.literal("")]).optional(),
  isActive: z.boolean().optional(),
});
export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const defaultVariantFormValues: VariantFormValues = {
  name: "",
  value: "",
  skuSuffix: "",
  priceOverride: "",
  stockOverride: "",
  isActive: true,
};

export function toVariantInput(values: VariantFormValues): ProductVariantInput {
  return {
    name: values.name,
    value: values.value,
    skuSuffix: values.skuSuffix,
    priceOverrideInPaise: values.priceOverride !== "" && values.priceOverride !== undefined ? toPaise(values.priceOverride) : undefined,
    stockOverride: values.stockOverride !== "" && values.stockOverride !== undefined ? values.stockOverride : undefined,
    isActive: values.isActive ?? true,
  };
}

export function variantToFormValues(variant: ProductVariant): VariantFormValues {
  return {
    name: variant.name,
    value: variant.value,
    skuSuffix: variant.skuSuffix,
    priceOverride: variant.priceOverrideInPaise != null ? fromPaise(variant.priceOverrideInPaise) : "",
    stockOverride: variant.stockOverride ?? "",
    isActive: variant.isActive,
  };
}
