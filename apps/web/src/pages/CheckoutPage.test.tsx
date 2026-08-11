import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import { cartWithItems, makeCartItem } from "../test/msw/data";
import { ordersRequestLog, seedCart } from "../test/msw/handlers";
import { CheckoutPage } from "./CheckoutPage";

describe("CheckoutPage", () => {
  beforeEach(() => {
    seedCart(cartWithItems([makeCartItem()]));
  });

  it("shows validation errors and does not submit when required fields are blank", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await screen.findByLabelText("Full name");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/must contain at least/i).length).toBeGreaterThan(0);
    expect(ordersRequestLog).toHaveLength(0);
  });

  it("submits the correctly shaped payload for a guest checkout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.type(await screen.findByLabelText("Email"), "guest@example.com");
    await user.type(screen.getByLabelText("Full name"), "Asha Rao");
    await user.type(screen.getByLabelText("Phone"), "9876543210");
    await user.type(screen.getByLabelText("Address line 1"), "12 MG Road");
    await user.type(screen.getByLabelText("City"), "Bengaluru");
    await user.type(screen.getByLabelText("State"), "Karnataka");
    await user.type(screen.getByLabelText("PIN code"), "560001");

    await user.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => expect(ordersRequestLog).toHaveLength(1));
    const payload = ordersRequestLog[0];
    expect(payload).toMatchObject({
      paymentMethod: "COD",
      billingSameAsShipping: true,
      guestEmail: "guest@example.com",
      shippingAddress: {
        fullName: "Asha Rao",
        phone: "9876543210",
        line1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
      },
    });
  });
});
