import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, Card, Spinner, useToast } from "@yrs/ui";
import { useCategories, useCreateCategory, useUpdateCategory } from "../../hooks/useCategories";
import { flattenCategories, flattenCategoryTree } from "../../lib/flatten-categories";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import {
  categoryFormSchema,
  defaultCategoryFormValues,
  categoryToFormValues,
  toCategoryInput,
  type CategoryFormValues,
} from "./categoryForm.schema";

export function CategoryFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: categories, isLoading } = useCategories();
  const category = mode === "edit" ? flattenCategoryTree(categories ?? []).find((c) => c.id === id) : undefined;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    values: category ? categoryToFormValues(category) : mode === "create" ? defaultCategoryFormValues : undefined,
  });

  const flatCategories = flattenCategories(categories ?? []).filter((c) => c.id !== id);

  function onSubmit(values: CategoryFormValues) {
    const payload = toCategoryInput(values);
    if (mode === "create") {
      createCategory.mutate(payload, {
        onSuccess: () => {
          showToast("Category created.");
          navigate("/categories");
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to create category."),
      });
    } else {
      updateCategory.mutate(payload, {
        onSuccess: () => {
          showToast("Category saved.");
          navigate("/categories");
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to save category."),
      });
    }
  }

  if (mode === "edit" && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (mode === "edit" && !isLoading && !category) {
    return <ErrorBanner error={new ApiError(404, "Category not found.")} />;
  }

  const mutationError = createCategory.error ?? updateCategory.error;

  return (
    <div>
      <PageHeader title={mode === "create" ? "New category" : `Edit ${category?.name ?? "category"}`} />
      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" error={errors.name?.message} {...register("name")} />
            <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          </div>
          <Textarea label="Description" rows={3} error={errors.description?.message as string | undefined} {...register("description")} />
          <Input label="Image URL" error={errors.imageUrl?.message as string | undefined} {...register("imageUrl")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Parent category" error={errors.parentId?.message} {...register("parentId")}>
              <option value="">None (top-level)</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"  ".repeat(c.depth)}
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="Sort order" type="number" error={errors.sortOrder?.message} {...register("sortOrder")} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>

          {mutationError ? <ErrorBanner error={mutationError} /> : null}

          <div className="flex justify-end">
            <Button type="submit" variant="solid" isLoading={createCategory.isPending || updateCategory.isPending}>
              {mode === "create" ? "Create category" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
