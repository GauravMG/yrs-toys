import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import { ReviewsPage } from "./ReviewsPage";

describe("ReviewsPage moderation", () => {
  it("defaults to the PENDING queue and removes a review from it once approved", async () => {
    renderWithProviders(<ReviewsPage />);

    const firstCard = await screen.findByText(/wooden train set/i);
    expect(firstCard).toBeInTheDocument();
    expect(screen.getByText(/plush bear/i)).toBeInTheDocument();

    const wooden = screen.getByText(/wooden train set/i).closest("div.rounded-lg") as HTMLElement;
    await userEvent.click(within(wooden).getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(screen.queryByText(/wooden train set/i)).not.toBeInTheDocument());
    // The other pending review is untouched.
    expect(screen.getByText(/plush bear/i)).toBeInTheDocument();
  });

  it("removes a review from the PENDING queue once rejected", async () => {
    renderWithProviders(<ReviewsPage />);

    await screen.findByText(/plush bear/i);
    const plush = screen.getByText(/plush bear/i).closest("div.rounded-lg") as HTMLElement;
    await userEvent.click(within(plush).getByRole("button", { name: /reject/i }));

    await waitFor(() => expect(screen.queryByText(/plush bear/i)).not.toBeInTheDocument());
  });
});
