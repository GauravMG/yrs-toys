import { describe, it, expect } from "vitest";
import { resolveUnitPrice, resolveAvailableStock, calculateShipping } from "./pricing.js";

describe("resolveUnitPrice", () => {
  it("uses the product price when there is no variant", () => {
    expect(resolveUnitPrice({ priceInPaise: 1000 })).toBe(1000);
  });

  it("uses the product price when the variant has no override", () => {
    expect(resolveUnitPrice({ priceInPaise: 1000 }, { priceOverrideInPaise: null })).toBe(1000);
  });

  it("prefers the variant override when present", () => {
    expect(resolveUnitPrice({ priceInPaise: 1000 }, { priceOverrideInPaise: 1500 })).toBe(1500);
  });
});

describe("resolveAvailableStock", () => {
  it("uses product stock without a variant override", () => {
    expect(resolveAvailableStock({ stock: 10 }, { stockOverride: null })).toBe(10);
  });

  it("prefers the variant stock override when present", () => {
    expect(resolveAvailableStock({ stock: 10 }, { stockOverride: 3 })).toBe(3);
  });
});

describe("calculateShipping", () => {
  it("charges a flat fee below the free-shipping threshold", () => {
    expect(calculateShipping(50000)).toBe(4900);
  });

  it("is free at or above the threshold", () => {
    expect(calculateShipping(99900)).toBe(0);
    expect(calculateShipping(150000)).toBe(0);
  });
});
