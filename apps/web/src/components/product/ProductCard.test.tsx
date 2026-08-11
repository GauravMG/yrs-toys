import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCart } from "../../hooks/useCart";
import { renderWithProviders } from "../../test/test-utils";
import { productFixture } from "../../test/msw/data";
import { ProductCard } from "./ProductCard";

function CartBadgeProbe() {
  const { data } = useCart();
  return <span data-testid="badge">{data?.itemCount ?? 0}</span>;
}

describe("ProductCard", () => {
  it("optimistically bumps the cart badge and shows a toast on add-to-cart", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CartBadgeProbe />
        <ProductCard product={productFixture} />
      </>,
    );

    expect(await screen.findByTestId("badge")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: `Add ${productFixture.name} to cart` }));

    // Optimistic update lands before the network round-trip settles.
    await waitFor(() => expect(screen.getByTestId("badge")).toHaveTextContent("1"));

    expect(await screen.findByText(`${productFixture.name} added to cart`)).toBeInTheDocument();
  });

  it("shows a Sale badge and strikethrough price when the product is discounted", () => {
    renderWithProviders(<ProductCard product={{ ...productFixture, compareAtPriceInPaise: 59900 }} />);
    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText("₹599")).toBeInTheDocument();
  });

  it("disables add-to-cart when the product is out of stock", () => {
    renderWithProviders(<ProductCard product={{ ...productFixture, stock: 0 }} />);
    expect(screen.getByRole("button", { name: `Add ${productFixture.name} to cart` })).toBeDisabled();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});
