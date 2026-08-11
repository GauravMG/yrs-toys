import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import { productFixture, saleProductFixture } from "../test/msw/data";
import { productsRequestLog } from "../test/msw/handlers";
import { ShopPage } from "./ShopPage";

describe("ShopPage age filter", () => {
  it("re-queries /products with the selected ageGroup and updates the results", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShopPage />, { route: "/shop" });

    // Both fixtures are AGE_1_3, so both show up unfiltered.
    await screen.findByText(productFixture.name);
    expect(screen.getByText(saleProductFixture.name)).toBeInTheDocument();
    expect(productsRequestLog.at(-1)).not.toContain("ageGroup");

    await user.click(screen.getByRole("button", { name: "0 - 1 Year" }));

    await waitFor(() => expect(productsRequestLog.at(-1)).toContain("ageGroup=AGE_0_1"));
    expect(await screen.findByText(/No products found/i)).toBeInTheDocument();

    // Toggling the same chip off re-queries with no age filter again.
    await user.click(screen.getByRole("button", { name: "0 - 1 Year" }));
    await waitFor(() => expect(productsRequestLog.at(-1)).not.toContain("ageGroup"));
    expect(await screen.findByText(productFixture.name)).toBeInTheDocument();
  });
});
