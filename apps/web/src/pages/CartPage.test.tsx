import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import { cartWithItems, makeCartItem } from "../test/msw/data";
import { seedCart } from "../test/msw/handlers";
import { CartPage } from "./CartPage";

describe("CartPage", () => {
  beforeEach(() => {
    seedCart(cartWithItems([makeCartItem({ id: "item_1", quantity: 2, lineTotalInPaise: 99800 })]));
  });

  it("recomputes totals when quantity is increased", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    expect(await screen.findByTestId("qty-item_1")).toHaveTextContent("2");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("₹998"); // 2 x ₹499

    await user.click(screen.getByRole("button", { name: /increase quantity/i }));

    await waitFor(() => expect(screen.getByTestId("qty-item_1")).toHaveTextContent("3"));
    await waitFor(() => expect(screen.getByTestId("cart-total")).toHaveTextContent("₹1,497")); // 3 x ₹499
  });

  it("removes a line item and shows the empty state once the cart is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    await screen.findByTestId("qty-item_1");
    await user.click(screen.getByRole("button", { name: /remove.*from cart/i }));

    expect(await screen.findByText("Your cart is empty. Add a toy or two!")).toBeInTheDocument();
  });
});
