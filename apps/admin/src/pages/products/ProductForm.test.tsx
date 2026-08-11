import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import { ProductForm } from "./ProductForm";
import { defaultProductFormValues } from "./productForm.schema";
import type { ProductDetail } from "@yrs/shared";

const fullProduct: ProductDetail = {
  id: "prod_1",
  name: "Wooden Train Set",
  slug: "wooden-train-set",
  shortDescription: "A classic wooden train.",
  priceInPaise: 100000,
  compareAtPriceInPaise: null,
  ageGroup: "AGE_3_6",
  isFeatured: false,
  isActive: true,
  stock: 10,
  avgRating: 0,
  reviewCount: 0,
  category: { id: "cat_1", name: "Wooden Toys", slug: "wooden-toys" },
  primaryImage: null,
  description: "A classic wooden train set.",
  sku: "WTS-001",
  material: null,
  safetyInfo: null,
  images: [],
  variants: [],
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("ProductForm", () => {
  it("shows validation errors and does not call onSubmit when required fields are missing", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ProductForm mode="create" initialValues={defaultProductFormValues} isSaving={false} onSubmit={onSubmit} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save product/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/must be at least|choose a category|enter a price/i).length).toBeGreaterThan(0);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the entered values once the form is valid", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ProductForm mode="create" initialValues={defaultProductFormValues} isSaving={false} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText(/^name$/i), "Wooden Train Set");
    await userEvent.type(screen.getByLabelText(/sku/i), "WTS-001");
    await userEvent.type(screen.getByLabelText(/short description/i), "A classic wooden train.");
    await userEvent.type(screen.getByLabelText(/full description/i), "A classic wooden train set built to last.");
    await userEvent.clear(screen.getByLabelText(/^price/i));
    await userEvent.type(screen.getByLabelText(/^price/i), "999");
    await userEvent.clear(screen.getByLabelText(/^stock$/i));
    await userEvent.type(screen.getByLabelText(/^stock$/i), "5");

    // Category options load asynchronously from GET /categories.
    await waitFor(() => expect(screen.getByRole("option", { name: /wooden toys/i })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/category/i), "cat_1");

    await userEvent.click(screen.getByRole("button", { name: /save product/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Wooden Train Set", categoryId: "cat_1", price: 999 }),
      expect.anything(),
    );
  });

  it("hides the image uploader and prompts to save first when creating a brand-new product", () => {
    renderWithProviders(
      <ProductForm mode="create" initialValues={defaultProductFormValues} isSaving={false} onSubmit={vi.fn()} />,
    );

    expect(screen.getByText(/save the product first/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload image/i })).not.toBeInTheDocument();
  });

  it("reveals the image uploader once a saved product (with an id) is passed in", () => {
    renderWithProviders(
      <ProductForm mode="edit" initialValues={defaultProductFormValues} product={fullProduct} isSaving={false} onSubmit={vi.fn()} />,
    );

    expect(screen.queryByText(/save the product first/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument();
  });
});
