import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Input, useToast } from "@yrs/ui";
import type { Coupon } from "@yrs/shared";
import { useApplyCoupon, useRemoveCoupon } from "../../hooks/useCart";

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const [code, setCode] = useState("");
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const { showToast } = useToast();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    applyCoupon.mutate(code.trim().toUpperCase(), {
      onSuccess: () => {
        showToast(`Coupon ${code.trim().toUpperCase()} applied`);
        setCode("");
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Couldn't apply that coupon");
      },
    });
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-md border border-sage bg-sage/10 px-3.5 py-2.5 text-sm">
        <span>
          Coupon <strong className="font-semibold">{coupon.code}</strong> applied
        </span>
        <button
          type="button"
          onClick={() => removeCoupon.mutate()}
          disabled={removeCoupon.isPending}
          className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-terracotta"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Input
        label="Coupon code"
        placeholder="e.g. WELCOME10"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="outline" size="sm" isLoading={applyCoupon.isPending} disabled={!code.trim()}>
        Apply
      </Button>
    </form>
  );
}
