import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, Card, Spinner, useToast } from "@yrs/ui";
import { useCoupons, useCreateCoupon, useUpdateCoupon } from "../../hooks/useCoupons";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import {
  couponFormSchema,
  defaultCouponFormValues,
  couponToFormValues,
  toCouponApiPayload,
  type CouponFormValues,
} from "./couponForm.schema";

export function CouponFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: coupons, isLoading } = useCoupons();
  const coupon = mode === "edit" ? coupons?.find((c) => c.id === id) : undefined;
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon(id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    values: coupon ? couponToFormValues(coupon) : mode === "create" ? defaultCouponFormValues : undefined,
  });

  const type = watch("type");

  function onSubmit(values: CouponFormValues) {
    const payload = toCouponApiPayload(values);
    if (mode === "create") {
      createCoupon.mutate(payload, {
        onSuccess: () => {
          showToast("Coupon created.");
          navigate("/coupons");
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to create coupon."),
      });
    } else {
      updateCoupon.mutate(payload, {
        onSuccess: () => {
          showToast("Coupon saved.");
          navigate("/coupons");
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to save coupon."),
      });
    }
  }

  if (mode === "edit" && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (mode === "edit" && !isLoading && !coupon) {
    return <ErrorBanner error={new ApiError(404, "Coupon not found.")} />;
  }

  const mutationError = createCoupon.error ?? updateCoupon.error;

  return (
    <div>
      <PageHeader title={mode === "create" ? "New coupon" : `Edit ${coupon?.code ?? "coupon"}`} />
      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              error={errors.code?.message}
              {...register("code", {
                // The API requires the code to already be uppercase
                // alphanumeric — auto-uppercase as the admin types so this
                // never surfaces as a confusing validation error.
                onChange: (e) => setValue("code", e.target.value.toUpperCase(), { shouldValidate: true }),
              })}
            />
            <Select label="Type" error={errors.type?.message} {...register("type")}>
              <option value="PERCENTAGE">Percentage off</option>
              <option value="FIXED">Fixed amount off</option>
            </Select>
            <Input
              label={type === "PERCENTAGE" ? "Percentage off (%)" : "Discount amount (₹)"}
              type="number"
              step={type === "PERCENTAGE" ? 1 : 0.01}
              error={errors.value?.message}
              {...register("value")}
            />
            <Input label="Min order amount (₹)" type="number" step="0.01" error={errors.minOrderAmount?.message as string | undefined} {...register("minOrderAmount")} />
            <Input label="Max discount (₹)" type="number" step="0.01" error={errors.maxDiscount?.message as string | undefined} {...register("maxDiscount")} />
            <Input label="Usage limit (total)" type="number" error={errors.usageLimit?.message as string | undefined} {...register("usageLimit")} />
            <Input label="Usage limit per customer" type="number" error={errors.usageLimitPerUser?.message as string | undefined} {...register("usageLimitPerUser")} />
            <Input label="Starts at" type="datetime-local" error={errors.startsAt?.message} {...register("startsAt")} />
            <Input label="Expires at" type="datetime-local" error={errors.expiresAt?.message} {...register("expiresAt")} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>

          {mutationError ? <ErrorBanner error={mutationError} /> : null}

          <div className="flex justify-end">
            <Button type="submit" variant="solid" isLoading={createCoupon.isPending || updateCoupon.isPending}>
              {mode === "create" ? "Create coupon" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
