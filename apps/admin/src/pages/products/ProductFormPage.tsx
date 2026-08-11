import { useNavigate, useParams } from "react-router-dom";
import { useToast, Spinner } from "@yrs/ui";
import { useAdminProduct, useCreateProduct, useUpdateProduct } from "../../hooks/useProducts";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import { ProductForm } from "./ProductForm";
import { defaultProductFormValues, productToFormValues, type ProductFormValues, toProductInput } from "./productForm.schema";

export function ProductFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const productQuery = useAdminProduct(mode === "edit" ? id : undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id ?? "");

  function handleSubmit(values: ProductFormValues) {
    const payload = toProductInput(values);
    if (mode === "create") {
      createProduct.mutate(payload, {
        onSuccess: (created) => {
          showToast("Product created. You can now add images and variants.");
          navigate(`/products/${created.id}/edit`, { replace: true });
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to create product."),
      });
    } else {
      updateProduct.mutate(payload, {
        onSuccess: () => showToast("Product saved."),
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to save product."),
      });
    }
  }

  if (mode === "edit" && productQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (mode === "edit" && productQuery.isError) {
    return <ErrorBanner error={productQuery.error} />;
  }

  const product = mode === "edit" ? productQuery.data : undefined;
  const initialValues = product ? productToFormValues(product) : defaultProductFormValues;

  return (
    <div>
      <PageHeader
        title={mode === "create" ? "New product" : `Edit ${product?.name ?? "product"}`}
        description={mode === "create" ? "Fill in the basics, then save to unlock images and variants." : undefined}
      />
      <ProductForm
        mode={mode}
        initialValues={initialValues}
        product={product}
        isSaving={createProduct.isPending || updateProduct.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
