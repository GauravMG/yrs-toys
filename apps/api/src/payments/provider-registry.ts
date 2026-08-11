import type { PaymentMethodValue } from "@yrs/shared";
import type { PaymentProvider } from "./payment-provider.interface.js";
import { codProvider } from "./cod.provider.js";

function notImplementedProvider(method: PaymentMethodValue): PaymentProvider {
  const unavailable = async () => {
    throw new Error(`Payment method ${method} is not yet integrated. Only COD is live today.`);
  };
  return { method, createPaymentIntent: unavailable, verifyPayment: unavailable, refund: unavailable };
}

// To add a real gateway: implement PaymentProvider in its own
// `<name>.provider.ts` (mirroring cod.provider.ts) and swap its entry in
// here — nothing else in the codebase references a concrete provider.
const registry: Record<PaymentMethodValue, PaymentProvider> = {
  COD: codProvider,
  RAZORPAY: notImplementedProvider("RAZORPAY"),
  STRIPE: notImplementedProvider("STRIPE"),
  PAYTM: notImplementedProvider("PAYTM"),
};

export function getPaymentProvider(method: PaymentMethodValue): PaymentProvider {
  return registry[method];
}
