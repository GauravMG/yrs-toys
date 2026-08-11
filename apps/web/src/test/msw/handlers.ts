import { http, HttpResponse } from "msw";
import type { Cart, CheckoutInput, Order } from "@yrs/shared";
import {
  categoryFixture,
  emptyCart,
  orderFixture,
  productDetailFixture,
  productFixture,
  reviewFixture,
  saleProductFixture,
} from "./data";

const API_BASE = "http://localhost:4000/api/v1";

// --- mutable test-only cart state, reset per test via resetMockServerState() ---
let cartState: Cart = emptyCart();
let nextItemId = 1;

export function seedCart(cart: Cart): void {
  cartState = cart;
}

export function getCartState(): Cart {
  return cartState;
}

export function resetMockServerState(): void {
  cartState = emptyCart();
  nextItemId = 1;
  productsRequestLog.length = 0;
  ordersRequestLog.length = 0;
}

// Records every `GET /products` search string so filter-driven re-query
// tests can assert on exactly what params were sent.
export const productsRequestLog: string[] = [];
// Records every `POST /orders` body so checkout payload-shape tests can assert on it.
export const ordersRequestLog: CheckoutInput[] = [];

function recomputeTotals(cart: Cart): Cart {
  const subtotalInPaise = cart.items.reduce((sum, item) => sum + item.lineTotalInPaise, 0);
  const discountInPaise = cart.coupon ? Math.min(subtotalInPaise, Math.round((subtotalInPaise * cart.coupon.value) / 100)) : 0;
  return {
    ...cart,
    subtotalInPaise,
    discountInPaise,
    totalInPaise: subtotalInPaise - discountInPaise,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

const productsBySlug: Record<string, typeof productDetailFixture> = {
  [productFixture.slug]: productDetailFixture,
  [saleProductFixture.slug]: { ...productDetailFixture, ...saleProductFixture },
};

export const handlers = [
  http.get(`${API_BASE}/products`, ({ request }) => {
    productsRequestLog.push(new URL(request.url).search);
    const url = new URL(request.url);
    const ageGroup = url.searchParams.get("ageGroup");
    const isFeatured = url.searchParams.get("isFeatured");
    let items = [productFixture, saleProductFixture];
    if (ageGroup) items = items.filter((p) => p.ageGroup === ageGroup);
    if (isFeatured === "true") items = items.filter((p) => p.isFeatured);
    return HttpResponse.json({ items, total: items.length, page: 1, limit: 20, totalPages: 1 });
  }),

  http.get(`${API_BASE}/products/:slug`, ({ params }) => {
    const product = productsBySlug[params.slug as string];
    if (!product) return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Product not found" } }, { status: 404 });
    return HttpResponse.json(product);
  }),

  http.get(`${API_BASE}/products/:slug/related`, () => HttpResponse.json([])),

  http.get(`${API_BASE}/products/:slug/reviews`, () =>
    HttpResponse.json({ items: [reviewFixture], total: 1, page: 1, limit: 10, totalPages: 1 }),
  ),

  http.get(`${API_BASE}/categories`, () => HttpResponse.json([categoryFixture])),

  http.get(`${API_BASE}/cart`, () => HttpResponse.json(cartState)),

  http.post(`${API_BASE}/cart/items`, async ({ request }) => {
    const body = (await request.json()) as { productId: string; variantId?: string; quantity: number };
    const product = body.productId === saleProductFixture.id ? saleProductFixture : productFixture;
    const existing = cartState.items.find((i) => i.productId === body.productId && i.variantId === (body.variantId ?? null));
    let items;
    if (existing) {
      items = cartState.items.map((i) =>
        i.id === existing.id
          ? { ...i, quantity: i.quantity + body.quantity, lineTotalInPaise: i.unitPriceInPaise * (i.quantity + body.quantity) }
          : i,
      );
    } else {
      items = [
        ...cartState.items,
        {
          id: `item_${nextItemId++}`,
          productId: product.id,
          variantId: body.variantId ?? null,
          quantity: body.quantity,
          product,
          variant: null,
          unitPriceInPaise: product.priceInPaise,
          lineTotalInPaise: product.priceInPaise * body.quantity,
        },
      ];
    }
    cartState = recomputeTotals({ ...cartState, items });
    return HttpResponse.json(cartState);
  }),

  http.patch(`${API_BASE}/cart/items/:itemId`, async ({ params, request }) => {
    const body = (await request.json()) as { quantity: number };
    const items = cartState.items.map((item) =>
      item.id === params.itemId ? { ...item, quantity: body.quantity, lineTotalInPaise: item.unitPriceInPaise * body.quantity } : item,
    );
    cartState = recomputeTotals({ ...cartState, items });
    return HttpResponse.json(cartState);
  }),

  http.delete(`${API_BASE}/cart/items/:itemId`, ({ params }) => {
    const items = cartState.items.filter((item) => item.id !== params.itemId);
    cartState = recomputeTotals({ ...cartState, items });
    return HttpResponse.json(cartState);
  }),

  http.delete(`${API_BASE}/cart`, () => {
    cartState = emptyCart(cartState.id);
    return HttpResponse.json(cartState);
  }),

  http.post(`${API_BASE}/cart/apply-coupon`, async ({ request }) => {
    const body = (await request.json()) as { code: string };
    if (body.code !== "WELCOME10") {
      return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Invalid or expired coupon" } }, { status: 404 });
    }
    cartState = recomputeTotals({
      ...cartState,
      coupon: {
        id: "coupon_1",
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderAmountInPaise: null,
        maxDiscountInPaise: null,
        usageLimit: null,
        usageLimitPerUser: null,
        timesUsed: 0,
        startsAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    return HttpResponse.json(cartState);
  }),

  http.delete(`${API_BASE}/cart/coupon`, () => {
    cartState = recomputeTotals({ ...cartState, coupon: null });
    return HttpResponse.json(cartState);
  }),

  http.post(`${API_BASE}/cart/merge`, () => HttpResponse.json(cartState)),

  // Guest by default — no session to restore.
  http.post(`${API_BASE}/auth/refresh`, () =>
    HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "No refresh token provided" } }, { status: 401 }),
  ),

  http.post(`${API_BASE}/orders`, async ({ request }) => {
    const body = (await request.json()) as CheckoutInput;
    ordersRequestLog.push(body);
    const order: Order = { ...orderFixture, guestEmail: body.guestEmail ?? null };
    cartState = emptyCart(cartState.id);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get(`${API_BASE}/users/me/addresses`, () => HttpResponse.json([])),
];
