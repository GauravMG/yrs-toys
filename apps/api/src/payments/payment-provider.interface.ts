import type { PaymentMethodValue, PaymentStatusValue } from "@yrs/shared";

/**
 * The extensibility seam for real payment gateways. `CodProvider` is the
 * only implementation wired up today (see cod.provider.ts) — a future
 * Razorpay/Stripe/Paytm integration implements this same interface and
 * registers itself in provider-registry.ts. Nothing in modules/orders
 * needs to change to support it: the checkout flow already calls
 * `getPaymentProvider(order.paymentMethod)` rather than a concrete class.
 */
export interface CreatePaymentIntentInput {
  orderId: string;
  amountInPaise: number;
}

export interface CreatePaymentIntentResult {
  status: PaymentStatusValue;
  providerRef?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  providerRef?: string;
  payload?: unknown;
}

export interface VerifyPaymentResult {
  status: PaymentStatusValue;
  providerRef?: string;
  failureReason?: string;
}

export interface RefundInput {
  orderId: string;
  amountInPaise: number;
  providerRef?: string;
}

export interface RefundResult {
  status: PaymentStatusValue;
  providerRef?: string;
}

export interface PaymentProvider {
  method: PaymentMethodValue;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
}
