import type { Cart, CartItem, Category, Order, ProductDetail, ProductSummary, Review } from "@yrs/shared";

// Fixtures deliberately shaped against the real `@yrs/shared` types (not
// hand-typed `any` blobs) so a schema change that breaks the contract shows
// up here as a TypeScript error rather than a silently-drifted mock.

export const categoryFixture: Category = {
  id: "cat_wooden",
  name: "Wooden Toys",
  slug: "wooden-toys",
  description: null,
  imageUrl: null,
  parentId: null,
  isActive: true,
  sortOrder: 0,
  children: [],
};

export const productFixture: ProductSummary = {
  id: "prod_stacker",
  name: "Rainbow Stacker",
  slug: "rainbow-stacker",
  shortDescription: "Chunky wooden rings help little hands practice balance and colour sorting.",
  priceInPaise: 49900,
  compareAtPriceInPaise: null,
  ageGroup: "AGE_1_3",
  isFeatured: true,
  isActive: true,
  stock: 12,
  avgRating: 4.5,
  reviewCount: 10,
  category: { id: categoryFixture.id, name: categoryFixture.name, slug: categoryFixture.slug },
  primaryImage: null,
};

export const saleProductFixture: ProductSummary = {
  ...productFixture,
  id: "prod_cube",
  name: "Activity Cube",
  slug: "activity-cube",
  priceInPaise: 79900,
  compareAtPriceInPaise: 99900,
  stock: 3,
};

export const productDetailFixture: ProductDetail = {
  ...productFixture,
  description:
    "Chunky wooden rings in warm painted tones help little hands practice balance, colour sorting and fine motor skills.",
  sku: "WT-STK-001",
  material: "Sustainably sourced beechwood",
  safetyInfo: "Water-based, non-toxic paint. No small detachable parts.",
  images: [],
  variants: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item_1",
    productId: productFixture.id,
    variantId: null,
    quantity: 1,
    product: productFixture,
    variant: null,
    unitPriceInPaise: productFixture.priceInPaise,
    lineTotalInPaise: productFixture.priceInPaise,
    ...overrides,
  };
}

export function emptyCart(id = "cart_1"): Cart {
  return { id, items: [], coupon: null, subtotalInPaise: 0, discountInPaise: 0, totalInPaise: 0, itemCount: 0 };
}

export function cartWithItems(items: CartItem[], id = "cart_1"): Cart {
  const subtotalInPaise = items.reduce((sum, item) => sum + item.lineTotalInPaise, 0);
  return {
    id,
    items,
    coupon: null,
    subtotalInPaise,
    discountInPaise: 0,
    totalInPaise: subtotalInPaise,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export const reviewFixture: Review = {
  id: "review_1",
  productId: productFixture.id,
  user: { id: "user_1", fullName: "Priya Sharma" },
  rating: 5,
  title: "Great quality",
  comment: "My toddler loves this stacker — sturdy and beautifully finished.",
  isVerifiedPurchase: true,
  status: "APPROVED",
  createdAt: "2026-01-05T00:00:00.000Z",
  updatedAt: "2026-01-05T00:00:00.000Z",
};

export const orderFixture: Order = {
  id: "order_1",
  orderNumber: "YRS-00001",
  status: "PENDING",
  paymentStatus: "PENDING",
  paymentMethod: "COD",
  subtotalInPaise: 49900,
  discountInPaise: 0,
  shippingInPaise: 0,
  taxInPaise: 0,
  totalInPaise: 49900,
  shipFullName: "Asha Rao",
  shipPhone: "9876543210",
  shipLine1: "12 MG Road",
  shipLine2: null,
  shipCity: "Bengaluru",
  shipState: "Karnataka",
  shipPostalCode: "560001",
  shipCountry: "India",
  guestEmail: "guest@example.com",
  notes: null,
  items: [
    {
      id: "orderitem_1",
      productId: productFixture.id,
      variantId: null,
      productNameSnapshot: productFixture.name,
      unitPriceInPaise: productFixture.priceInPaise,
      quantity: 1,
      lineTotalInPaise: productFixture.priceInPaise,
    },
  ],
  statusHistory: [{ id: "hist_1", status: "PENDING", note: null, createdAt: "2026-01-10T00:00:00.000Z" }],
  isCancellable: true,
  createdAt: "2026-01-10T00:00:00.000Z",
  updatedAt: "2026-01-10T00:00:00.000Z",
};
