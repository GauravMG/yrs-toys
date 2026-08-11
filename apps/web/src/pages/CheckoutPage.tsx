import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Badge, Button, Input, Select, Spinner, Textarea, useToast } from "@yrs/ui";
import { checkoutInputSchema } from "@yrs/shared";
import type { CheckoutInput } from "@yrs/shared";
import { useCart } from "../hooks/useCart";
import { useCheckout } from "../hooks/useOrders";
import { useAddresses } from "../hooks/useAddresses";
import { useAuth } from "../hooks/useAuth";
import { OrderSummary } from "../components/checkout/OrderSummary";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export function CheckoutPage() {
  const { data: cart, isLoading: isCartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { data: addresses } = useAddresses();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // `checkoutInputSchema` can't know whether the requester is authenticated
  // (that's app/UI state, not part of the wire contract), so guest-email
  // *presence* is enforced here rather than in packages/shared. This must
  // live in the resolver schema itself, not a manual check inside
  // `onSubmit` — react-hook-form only calls `onSubmit` once every field
  // already passes schema validation, so a check placed after the fact
  // would silently never run whenever any *other* required field (name,
  // address, etc.) is also blank.
  const checkoutFormSchema = useMemo(
    () =>
      checkoutInputSchema.superRefine((values, ctx) => {
        if (!isAuthenticated && !values.guestEmail) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email is required so we can send your order confirmation",
            path: ["guestEmail"],
          });
        }
      }),
    [isAuthenticated],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shippingAddress: EMPTY_ADDRESS,
      billingSameAsShipping: true,
      paymentMethod: "COD",
      // `guestEmail` is deliberately left undefined (not "") — the schema's
      // `.email().optional()` accepts undefined but rejects an empty
      // string, and react-hook-form keeps a defaultValue for the lifetime
      // of the form even while its input is conditionally unmounted (for
      // signed-in users, who never see this field). Defaulting it to ""
      // would permanently fail validation for every logged-in checkout.
      notes: "",
    },
  });

  const defaultAddress = useMemo(() => addresses?.find((a) => a.isDefault) ?? addresses?.[0], [addresses]);

  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      reset((current) => ({
        ...current,
        shippingAddress: {
          fullName: defaultAddress.fullName,
          phone: defaultAddress.phone,
          line1: defaultAddress.line1,
          line2: defaultAddress.line2 ?? "",
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode,
          country: defaultAddress.country,
        },
      }));
    }
    // Only run when the address list first resolves — subsequent manual
    // edits to the form shouldn't be clobbered by this effect re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  function handleAddressSelect(id: string) {
    setSelectedAddressId(id);
    if (id === "new") {
      reset((current) => ({ ...current, shippingAddress: EMPTY_ADDRESS }));
      return;
    }
    const address = addresses?.find((a) => a.id === id);
    if (!address) return;
    reset((current) => ({
      ...current,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
    }));
  }

  function onSubmit(values: CheckoutInput) {
    const payload: CheckoutInput = {
      ...values,
      billingSameAsShipping: true,
      paymentMethod: "COD",
      guestEmail: isAuthenticated ? undefined : values.guestEmail,
    };
    checkout.mutate(payload, {
      onSuccess: (order) => navigate(`/checkout/success/${order.orderNumber}`, { state: { order } }),
      onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't place your order"),
    });
  }

  if (isCartLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
      <h1 className="mb-8 text-[28px]">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {!isAuthenticated && (
            <div className="rounded-lg border border-line bg-panel p-5">
              <h2 className="mb-3 font-display text-lg">Contact</h2>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.guestEmail?.message}
                {...register("guestEmail")}
              />
              <p className="mt-2 text-xs text-ink-soft">
                We'll email your order confirmation here. Have an account? <a href="/login" className="font-semibold text-gold-dark hover:underline">Sign in</a> for faster checkout.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="mb-4 font-display text-lg">Shipping address</h2>

            {isAuthenticated && addresses && addresses.length > 0 && (
              <div className="mb-5">
                <Select
                  label="Ship to"
                  value={selectedAddressId}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ? `${address.label} — ` : ""}
                      {address.fullName}, {address.line1}, {address.city}
                    </option>
                  ))}
                  <option value="new">Enter a new address</option>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" error={errors.shippingAddress?.fullName?.message} {...register("shippingAddress.fullName")} />
              <Input
                label="Phone"
                placeholder="10-digit mobile number"
                error={errors.shippingAddress?.phone?.message}
                {...register("shippingAddress.phone")}
              />
              <Input
                label="Address line 1"
                className="sm:col-span-2"
                error={errors.shippingAddress?.line1?.message}
                {...register("shippingAddress.line1")}
              />
              <Input
                label="Address line 2 (optional)"
                className="sm:col-span-2"
                error={errors.shippingAddress?.line2?.message}
                {...register("shippingAddress.line2")}
              />
              <Input label="City" error={errors.shippingAddress?.city?.message} {...register("shippingAddress.city")} />
              <Input label="State" error={errors.shippingAddress?.state?.message} {...register("shippingAddress.state")} />
              <Input
                label="PIN code"
                placeholder="6-digit PIN code"
                error={errors.shippingAddress?.postalCode?.message}
                {...register("shippingAddress.postalCode")}
              />
              <Input label="Country" error={errors.shippingAddress?.country?.message} {...register("shippingAddress.country")} />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="mb-3 font-display text-lg">Payment method</h2>
            <div className="flex items-center justify-between rounded-md border border-gold bg-gold/5 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold">Cash on Delivery</p>
                <p className="text-xs text-ink-soft">Pay when your order arrives</p>
              </div>
              <Badge tone="sage">Selected</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel p-5">
            <Textarea label="Order notes (optional)" rows={3} {...register("notes")} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <OrderSummary cart={cart} />
          <Button type="submit" isLoading={checkout.isPending} className="w-full">
            Place order
          </Button>
        </div>
      </form>
    </div>
  );
}
