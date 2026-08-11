import { describe, it, expect } from "vitest";
import { isValidOrderStatusTransition, isCustomerCancellable } from "./order-status-transitions.js";

describe("order status transitions", () => {
  it("allows the standard forward path", () => {
    expect(isValidOrderStatusTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(isValidOrderStatusTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(isValidOrderStatusTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(isValidOrderStatusTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(isValidOrderStatusTransition("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("allows cancellation before shipping", () => {
    expect(isValidOrderStatusTransition("PENDING", "CANCELLED")).toBe(true);
    expect(isValidOrderStatusTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(isValidOrderStatusTransition("PROCESSING", "CANCELLED")).toBe(true);
  });

  it("rejects skipping stages", () => {
    expect(isValidOrderStatusTransition("PENDING", "SHIPPED")).toBe(false);
    expect(isValidOrderStatusTransition("PENDING", "DELIVERED")).toBe(false);
  });

  it("rejects transitions out of terminal states", () => {
    expect(isValidOrderStatusTransition("CANCELLED", "PENDING")).toBe(false);
    expect(isValidOrderStatusTransition("REFUNDED", "DELIVERED")).toBe(false);
  });

  it("rejects a no-op transition", () => {
    expect(isValidOrderStatusTransition("PENDING", "PENDING")).toBe(false);
  });

  it("rejects cancelling after shipping", () => {
    expect(isValidOrderStatusTransition("SHIPPED", "CANCELLED")).toBe(false);
    expect(isValidOrderStatusTransition("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("only allows customer self-cancel while pending or confirmed", () => {
    expect(isCustomerCancellable("PENDING")).toBe(true);
    expect(isCustomerCancellable("CONFIRMED")).toBe(true);
    expect(isCustomerCancellable("PROCESSING")).toBe(false);
    expect(isCustomerCancellable("SHIPPED")).toBe(false);
  });
});
