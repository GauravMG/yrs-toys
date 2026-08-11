/**
 * All money in this system is stored and transported as integer paise
 * (1 rupee = 100 paise) to avoid floating point rounding errors — this
 * also matches how Razorpay/Stripe/Paytm expect amounts when a live
 * payment gateway is plugged in later.
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(fromPaise(paise));
}
