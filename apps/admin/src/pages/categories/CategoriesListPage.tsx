import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Badge, Spinner, useToast } from "@yrs/ui";
import type { Category } from "@yrs/shared";
import { useCategories, useDeleteCategory } from "../../hooks/useCategories";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

function CategoryRow({ category, depth, onDelete }: { category: Category; depth: number; onDelete: (id: string) => void }) {
  const children = (category.children as Category[] | undefined) ?? [];
  return (
    <>
      <tr className="hover:bg-cream">
        <td className="px-4 py-3" style={{ paddingLeft: 16 + depth * 24 }}>
          <Link to={`/categories/${category.id}/edit`} className="font-semibold text-ink hover:text-gold-dark">
            {depth > 0 && <span className="mr-1 text-ink-soft">&rarr;</span>}
            {category.name}
          </Link>
          <p className="text-xs text-ink-soft">{category.slug}</p>
        </td>
        <td className="px-4 py-3">
          <Badge tone={category.isActive ? "sage" : "ink"}>{category.isActive ? "Active" : "Inactive"}</Badge>
        </td>
        <td className="px-4 py-3 text-right">
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
            Delete
          </Button>
        </td>
      </tr>
      {children.map((child) => (
        <CategoryRow key={child.id} category={child} depth={depth + 1} onDelete={onDelete} />
      ))}
    </>
  );
}

export function CategoriesListPage() {
  const { data, isLoading, isError, error } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const { showToast } = useToast();

  function handleDelete() {
    if (!deletingId) return;
    setDeleteError(null);
    deleteCategory.mutate(deletingId, {
      onSuccess: () => {
        showToast("Category deleted.");
        setDeletingId(null);
      },
      onError: (err) => {
        // A 409 here means the category is still referenced by products —
        // surface that explicitly rather than a generic failure toast.
        setDeleteError(err);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise the catalogue into parent/child categories."
        action={
          <Link to="/categories/new">
            <Button type="button" variant="solid">
              New category
            </Button>
          </Link>
        }
      />

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && data.length === 0 && <EmptyState title="No categories yet" description="Create your first category to get started." />}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((category) => (
                <CategoryRow key={category.id} category={category} depth={0} onDelete={setDeletingId} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
            setDeleteError(null);
          }
        }}
        title="Delete this category?"
        description="This can't be undone. Categories still linked to products can't be deleted."
        confirmLabel="Delete"
        isLoading={deleteCategory.isPending}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  );
}
