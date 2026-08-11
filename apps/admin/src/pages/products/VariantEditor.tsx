import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Badge, useToast } from "@yrs/ui";
import type { ProductVariant } from "@yrs/shared";
import { formatINR } from "@yrs/shared";
import {
  variantFormSchema,
  defaultVariantFormValues,
  toVariantInput,
  variantToFormValues,
  type VariantFormValues,
} from "./variantForm.schema";
import { useAddProductVariant, useUpdateProductVariant, useDeleteProductVariant } from "../../hooks/useProducts";
import { ApiError } from "../../lib/api-client";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

function VariantFormRow({
  initialValues,
  onSubmit,
  onCancel,
  isSaving,
}: {
  initialValues: VariantFormValues;
  onSubmit: (values: VariantFormValues) => void;
  onCancel?: () => void;
  isSaving: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VariantFormValues>({ resolver: zodResolver(variantFormSchema), defaultValues: initialValues });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 gap-3 rounded-md border border-line bg-cream p-4 sm:grid-cols-6"
    >
      <Input label="Name" placeholder="Colour" error={errors.name?.message} {...register("name")} />
      <Input label="Value" placeholder="Red" error={errors.value?.message} {...register("value")} />
      <Input label="SKU suffix" placeholder="RED" error={errors.skuSuffix?.message} {...register("skuSuffix")} />
      <Input
        label="Price override (₹)"
        type="number"
        step="0.01"
        placeholder="Optional"
        error={errors.priceOverride?.message as string | undefined}
        {...register("priceOverride")}
      />
      <Input
        label="Stock override"
        type="number"
        placeholder="Optional"
        error={errors.stockOverride?.message as string | undefined}
        {...register("stockOverride")}
      />
      <div className="flex items-end gap-2">
        <Button type="submit" variant="solid" size="sm" isLoading={isSaving}>
          Save
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <label className="col-span-full flex items-center gap-2 text-xs font-semibold text-ink-soft">
        <input type="checkbox" defaultChecked={initialValues.isActive} {...register("isActive")} />
        Active
      </label>
    </form>
  );
}

export function VariantEditor({ productId, variants }: { productId: string; variants: ProductVariant[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const addVariant = useAddProductVariant(productId);
  const updateVariant = useUpdateProductVariant(productId);
  const deleteVariant = useDeleteProductVariant(productId);

  function handleAdd(values: VariantFormValues) {
    addVariant.mutate(toVariantInput(values), {
      onSuccess: () => {
        showToast("Variant added.");
        setIsAdding(false);
      },
      onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to add variant."),
    });
  }

  function handleUpdate(variantId: string, values: VariantFormValues) {
    updateVariant.mutate(
      { variantId, input: toVariantInput(values) },
      {
        onSuccess: () => {
          showToast("Variant updated.");
          setEditingId(null);
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to update variant."),
      },
    );
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteVariant.mutate(deletingId, {
      onSuccess: () => {
        showToast("Variant removed.");
        setDeletingId(null);
      },
      onError: (err) => {
        showToast(err instanceof ApiError ? err.message : "Failed to remove variant.");
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.length === 0 && !isAdding && (
        <p className="text-sm text-ink-soft">No variants — this product is sold as a single option.</p>
      )}

      {variants.map((variant) =>
        editingId === variant.id ? (
          <VariantFormRow
            key={variant.id}
            initialValues={variantToFormValues(variant)}
            isSaving={updateVariant.isPending}
            onSubmit={(values) => handleUpdate(variant.id, values)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-ink">
                {variant.name}: {variant.value}
              </p>
              <span className="text-xs text-ink-soft">SKU suffix {variant.skuSuffix}</span>
              {variant.priceOverrideInPaise != null && (
                <Badge tone="gold">{formatINR(variant.priceOverrideInPaise)}</Badge>
              )}
              {variant.stockOverride != null && <Badge tone="teal">{variant.stockOverride} in stock</Badge>}
              {!variant.isActive && <Badge tone="ink">Inactive</Badge>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(variant.id)}>
                Edit
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeletingId(variant.id)}>
                Delete
              </Button>
            </div>
          </div>
        ),
      )}

      {isAdding ? (
        <VariantFormRow
          initialValues={defaultVariantFormValues}
          isSaving={addVariant.isPending}
          onSubmit={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsAdding(true)}>
          Add variant
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this variant?"
        description="This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteVariant.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
