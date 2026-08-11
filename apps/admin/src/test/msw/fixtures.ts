import type { Category, Order, Paginated, ProductSummary } from "@yrs/shared";
import type { AdminReview } from "../../lib/api/reviews";

export const fixtureCategory: Category = {
  id: "cat_1",
  name: "Wooden Toys",
  slug: "wooden-toys",
  description: null,
  imageUrl: null,
  parentId: null,
  isActive: true,
  sortOrder: 1,
  children: [],
};

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order_1",
    orderNumber: "YRS-0001",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    subtotalInPaise: 100000,
    discountInPaise: 0,
    shippingInPaise: 0,
    taxInPaise: 0,
    totalInPaise: 100000,
    shipFullName: "Test Customer",
    shipPhone: "9876543210",
    shipLine1: "1 Toy Street",
    shipLine2: null,
    shipCity: "Mumbai",
    shipState: "Maharashtra",
    shipPostalCode: "400001",
    shipCountry: "India",
    guestEmail: null,
    notes: null,
    items: [
      {
        id: "item_1",
        productId: "prod_1",
        variantId: null,
        productNameSnapshot: "Wooden Train Set",
        unitPriceInPaise: 100000,
        quantity: 1,
        lineTotalInPaise: 100000,
      },
    ],
    statusHistory: [{ id: "hist_1", status: "PENDING", note: null, createdAt: "2026-08-01T00:00:00.000Z" }],
    isCancellable: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeProductSummary(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "prod_1",
    name: "Wooden Train Set",
    slug: "wooden-train-set",
    shortDescription: "A classic wooden train.",
    priceInPaise: 100000,
    compareAtPriceInPaise: null,
    ageGroup: "AGE_3_6",
    isFeatured: false,
    isActive: true,
    stock: 10,
    avgRating: 4.5,
    reviewCount: 2,
    category: { id: "cat_1", name: "Wooden Toys", slug: "wooden-toys" },
    primaryImage: null,
    ...overrides,
  };
}

export function makeAdminReview(overrides: Partial<AdminReview> = {}): AdminReview {
  return {
    id: "review_1",
    productId: "prod_1",
    product: { id: "prod_1", name: "Wooden Train Set", slug: "wooden-train-set" },
    user: { id: "user_1", fullName: "Jane Doe" },
    rating: 5,
    title: "Lovely toy",
    comment: "My kid loves this train set.",
    isVerifiedPurchase: true,
    status: "PENDING",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function paginated<T>(items: T[], overrides: Partial<Paginated<T>> = {}): Paginated<T> {
  return { items, total: items.length, page: 1, limit: 20, totalPages: 1, ...overrides };
}
