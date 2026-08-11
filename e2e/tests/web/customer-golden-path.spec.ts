import { test, expect } from "@playwright/test";
import { waitForEmail } from "../helpers/mailhog";

test.describe.configure({ mode: "serial" });

test("customer golden path: browse, filter, search, add to cart, guest checkout, confirmation email", async ({ page }) => {
  const guestEmail = `e2e-guest-${Date.now()}@example.com`;

  // --- Home ---
  await page.goto("/");
  await expect(page.getByRole("link", { name: /YRS/ }).first()).toBeVisible();

  // --- Shop + age filter ---
  await page.getByRole("link", { name: "Shop", exact: true }).click();
  await expect(page).toHaveURL(/\/shop/);
  await page.getByRole("button", { name: "1 - 3 Years", exact: true }).click();
  await expect(page).toHaveURL(/ageGroup=AGE_1_3/);
  await expect(page.getByText(/\d+ products?/)).toBeVisible();

  // Clear the age filter before searching, so search isn't scoped to it.
  await page.getByRole("button", { name: "1 - 3 Years", exact: true }).click();

  // --- Search ---
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder(/Search for wooden toys/).fill("wooden");
  await page.getByPlaceholder(/Search for wooden toys/).press("Enter");
  await expect(page).toHaveURL(/\/shop\?q=wooden/);
  await expect(page.getByText(/\d+ products?/)).toBeVisible();

  // --- Product detail ---
  // Each product card renders two links to the same product (an image link
  // with no text, and the product-name link) — filter down to the one with
  // visible text so `productName` isn't empty.
  const firstProductLink = page
    .locator("main a[href^='/product/']")
    .filter({ hasText: /\S/ })
    .first();
  const productName = (await firstProductLink.textContent())?.trim() ?? "";
  expect(productName.length).toBeGreaterThan(0);
  await firstProductLink.click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();

  // --- Add to cart ---
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/added to cart/i).first()).toBeVisible();

  // --- Open cart drawer, go to checkout ---
  await page.getByRole("button", { name: "Cart", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // --- Fill guest checkout form ---
  await page.getByLabel("Email", { exact: true }).fill(guestEmail);
  await page.getByLabel("Full name").fill("E2E Test Buyer");
  await page.getByLabel("Phone").fill("9876543210");
  await page.getByLabel("Address line 1").fill("1 MG Road");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("PIN code").fill("560001");

  await page.getByRole("button", { name: "Place order" }).click();

  // --- Confirmation ---
  await expect(page.getByRole("heading", { name: "Order placed!" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Your order number is/).first()).toBeVisible();
  const orderNumberText = await page.locator("strong", { hasText: /^YRS-/ }).first().textContent();
  const orderNumber = orderNumberText?.trim();
  expect(orderNumber).toMatch(/^YRS-\d{8}-\d{4}$/);

  // --- Confirmation email landed in Mailhog ---
  const email = await waitForEmail(guestEmail, "Order confirmed");
  expect(email).toBeTruthy();
});
