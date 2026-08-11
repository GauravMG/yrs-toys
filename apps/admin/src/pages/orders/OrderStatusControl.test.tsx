import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils";
import { OrderStatusControl } from "./OrderStatusControl";
import { makeOrder } from "../../test/msw/fixtures";

function getOfferedStatuses() {
  const select = screen.getByLabelText(/change status to/i) as HTMLSelectElement;
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent);
}

describe("OrderStatusControl", () => {
  it("offers only CONFIRMED and CANCELLED from PENDING", () => {
    renderWithProviders(<OrderStatusControl order={makeOrder({ status: "PENDING" })} />);
    expect(getOfferedStatuses()).toEqual(["Confirmed", "Cancelled"]);
  });

  it("offers only DELIVERED from SHIPPED", () => {
    renderWithProviders(<OrderStatusControl order={makeOrder({ status: "SHIPPED" })} />);
    expect(getOfferedStatuses()).toEqual(["Delivered"]);
  });

  it("offers only REFUNDED from DELIVERED", () => {
    renderWithProviders(<OrderStatusControl order={makeOrder({ status: "DELIVERED" })} />);
    expect(getOfferedStatuses()).toEqual(["Refunded"]);
  });

  it("offers no status change control for a terminal CANCELLED order", () => {
    renderWithProviders(<OrderStatusControl order={makeOrder({ status: "CANCELLED" })} />);
    expect(screen.queryByLabelText(/change status to/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no further status changes/i)).toBeInTheDocument();
  });

  it("offers no status change control for a terminal REFUNDED order", () => {
    renderWithProviders(<OrderStatusControl order={makeOrder({ status: "REFUNDED" })} />);
    expect(screen.queryByLabelText(/change status to/i)).not.toBeInTheDocument();
  });
});
