import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, Card } from "@yrs/ui";
import { AGE_GROUP_LABELS } from "@yrs/shared";
import type { AgeGroupValue, ProductDetail } from "@yrs/shared";
import { useCategories } from "../../hooks/useCategories";
import { flattenCategories } from "../../lib/flatten-categories";
import { slugify } from "../../lib/slugify";
import { productFormSchema, type ProductFormValues } from "./productForm.schema";
import { ImageUploader } from "./ImageUploader";
import { VariantEditor } from "./VariantEditor";

const AGE_GROUPS = Object.keys(AGE_GROUP_LABELS) as AgeGroupValue[];

export function ProductForm({
  mode,
  initialValues,
  product,
  isSaving,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  /** Full product (with id/images/variants) — only present once the product has been saved at least once. */
  product?: ProductDetail;
  isSaving: boolean;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const { data: categories } = useCategories();
  const flatCategories = flattenCategories(categories ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: initialValues });

  // Auto-suggest a slug from the name while creating, unless the admin has
  // already hand-edited the slug field themselves.
  const name = watch("name");
  useEffect(() => {
    if (mode === "create" && !dirtyFields.slug) {
      setValue("slug", slugify(name || ""), { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, mode]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg text-ink">Basics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          <Input label="SKU" error={errors.sku?.message} {...register("sku")} />
          <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Select a category&hellip;</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {"  ".repeat(category.depth)}
                {category.name}
              </option>
            ))}
          </Select>
          <Select label="Age group" error={errors.ageGroup?.message} {...register("ageGroup")}>
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {AGE_GROUP_LABELS[group]}
              </option>
            ))}
          </Select>
          <Input label="Material" error={errors.material?.message} {...register("material")} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <Textarea label="Short description" rows={2} error={errors.shortDescription?.message} {...register("shortDescription")} />
          <Textarea label="Full description" rows={5} error={errors.description?.message} {...register("description")} />
          <Textarea label="Safety info" rows={2} error={errors.safetyInfo?.message} {...register("safetyInfo")} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg text-ink">Pricing &amp; stock</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Price (₹)"
            type="number"
            step="0.01"
            error={errors.price?.message}
            {...register("price")}
          />
          <Input
            label="Compare-at price (₹)"
            type="number"
            step="0.01"
            error={errors.compareAtPrice?.message as string | undefined}
            {...register("compareAtPrice")}
          />
          <Input label="Stock" type="number" error={errors.stock?.message} {...register("stock")} />
        </div>
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input type="checkbox" {...register("isActive")} />
            Active (visible on the storefront)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input type="checkbox" {...register("isFeatured")} />
            Featured
          </label>
        </div>
      </Card>

      {mode === "create" && !product && (
        <Card className="p-6">
          <h2 className="mb-2 font-display text-lg text-ink">Images &amp; variants</h2>
          <p className="text-sm text-ink-soft">
            Save the product first — images and variants attach to a product that already exists.
          </p>
        </Card>
      )}

      {product && (
        <>
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Images</h2>
            <ImageUploader productId={product.id} images={product.images} />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Variants</h2>
            <VariantEditor productId={product.id} variants={product.variants} />
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="solid" isLoading={isSaving}>
          {mode === "create" ? "Save product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
