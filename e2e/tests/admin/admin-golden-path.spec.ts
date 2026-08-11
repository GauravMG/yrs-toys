import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { WEB_BASE_URL, ADMIN_BASE_URL } from "../../playwright.config";
import { waitForEmail } from "../helpers/mailhog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "../fixtures/test-product-image.png");

test.describe.configure({ mode: "serial" });

test("admin golden path: create product, customer buys it, admin fulfils the order end to end", async ({ page }) => {
  const stamp = Date.now();
  const productName = `E2E Test Xylophone ${stamp}`;
  const sku = `E2E-SKU-${stamp}`;
  const customerEmail = `e2e-customer-${stamp}@example.com`;
  const customerPassword = "Testpass123";

  // ============== 1. Admin logs in ==============
  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.getByLabel("Email").fill("admin@yrstoys.in");
  await page.getByLabel("Password").fill("Admin@12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // ============== 2. Admin creates a new product ==============
  await page.goto(`${ADMIN_BASE_URL}/products/new`);
  await page.getByLabel("Name").fill(productName);
  const slug = (await page.getByLabel("Slug").inputValue()).trim();
  expect(slug.length).toBeGreaterThan(0);
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Category").selectOption({ index: 1 });
  await page.getByLabel("Short description").fill("An E2E-created toy for automated testing.");
  await page.getByLabel("Full description").fill("Created by the Playwright admin golden-path test.");
  await page.getByLabel("Price (₹)", { exact: true }).fill("799");
  await page.getByLabel("Stock").fill("25");

  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/products\/.+\/edit/);
  await expect(page.getByText("Product created").first()).toBeVisible();

  // ============== 3. Admin uploads a product image ==============
  await page.getByRole("button", { name: "Upload image" }).click();
  await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
  await expect(page.getByText("Image uploaded.").first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByAltText("").first()).toBeVisible();

  // ============== 4. Product is live on the storefront ==============
  await page.goto(`${WEB_BASE_URL}/product/${slug}`);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await expect(page.getByText("₹799").first()).toBeVisible();

  // ============== 5. A customer registers and buys it ==============
  await page.goto(`${WEB_BASE_URL}/register`);
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Email", { exact: true }).fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.goto(`${WEB_BASE_URL}/product/${slug}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/added to cart/i).first()).toBeVisible();

  await page.goto(`${WEB_BASE_URL}/checkout`);
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Phone").fill("9876543211");
  await page.getByLabel("Address line 1").fill("42 Residency Road");
  await page.getByLabel("City").fill("Mumbai");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("PIN code").fill("400001");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("heading", { name: "Order placed!" })).toBeVisible({ timeout: 15000 });
  const orderNumber = (await page.locator("strong", { hasText: /^YRS-/ }).first().textContent())?.trim();
  expect(orderNumber).toMatch(/^YRS-\d{8}-\d{4}$/);

  // ============== 6. Admin finds the order and fulfils it ==============
  await page.goto(`${ADMIN_BASE_URL}/orders`);
  await page.getByPlaceholder(/Search order/).fill(orderNumber!);
  await page.getByRole("link", { name: orderNumber! }).click();
  await expect(page).toHaveURL(/\/orders\//);

  for (const nextStatus of ["Confirmed", "Processing", "Shipped", "Delivered"]) {
    await page.getByLabel("Change status to").selectOption({ label: nextStatus });
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByText(`Order marked ${nextStatus}.`).first()).toBeVisible({ timeout: 10000 });
  }

  // DELIVERED still offers one further transition (REFUNDED, for returns)
  // per ORDER_STATUS_TRANSITIONS — only CANCELLED/REFUNDED are terminal.
  await expect(page.getByLabel("Change status to")).toContainText("Refunded");

  // ============== 7. The customer sees the updated status ==============
  await page.goto(`${WEB_BASE_URL}/account/orders/${orderNumber}`);
  await expect(page.getByText("Delivered", { exact: true }).first()).toBeVisible();

  // ============== 8. A status-update email was sent ==============
  const email = await waitForEmail(customerEmail, "Delivered");
  expect(email).toBeTruthy();
});

test("a CUSTOMER-role login is rejected by the admin app", async ({ page }) => {
  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.getByLabel("Email").fill("customer@example.com");
  await page.getByLabel("Password").fill("Customer@12345");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Must stay on (or be returned to) /login — never reach an admin route.
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Admin sign in")).toBeVisible();
});
