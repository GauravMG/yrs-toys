import type { PaymentProvider } from "./payment-provider.interface.js";

/**
 * Cash on Delivery: no money moves through the platform at checkout time,
 * so the "payment" is just a record — collected in cash by the courier on
 * delivery. Its status starts PENDING and is expected to be reconciled to
 * PAID by an admin (e.g. when the order is marked DELIVERED) rather than
 * through any gateway callback.
 */
export const codProvider: PaymentProvider = {
  method: "COD",

  async createPaymentIntent({ amountInPaise }) {
    void amountInPaise;
    return { status: "PENDING" };
  },

  async verifyPayment() {
    return { status: "PENDING" };
  },

  async refund() {
    // COD refunds are handled offline (bank transfer/cash) by the
    // merchant; we simply record that a refund was issued.
    return { status: "REFUNDED" };
  },
};
