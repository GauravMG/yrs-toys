import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import { productDetailFixture, productFixture } from "../../test/msw/data";
import { QuickViewModal } from "./QuickViewModal";

describe("QuickViewModal", () => {
  it("loads the product, adds it to cart, and closes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(<QuickViewModal slug={productFixture.slug} open onOpenChange={onOpenChange} />);

    expect(await screen.findByText(productDetailFixture.name)).toBeInTheDocument();
    expect(screen.getByText(productDetailFixture.shortDescription)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(await screen.findByText(`${productDetailFixture.name} added to cart`)).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without adding to cart when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(<QuickViewModal slug={productFixture.slug} open onOpenChange={onOpenChange} />);

    await screen.findByText(productDetailFixture.name);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
