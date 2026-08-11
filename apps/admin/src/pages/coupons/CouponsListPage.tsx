import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Badge, Spinner, useToast } from "@yrs/ui";
import { formatDate, formatINR } from "@yrs/shared";
import { useCoupons, useDeleteCoupon } from "../../hooks/useCoupons";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export function CouponsListPage() {
  const { data, isLoading, isError, error } = useCoupons();
  const deleteCoupon = useDeleteCoupon();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  function handleDelete() {
    if (!deletingId) return;
    deleteCoupon.mutate(deletingId, {
      onSuccess: () => {
        showToast("Coupon deleted.");
        setDeletingId(null);
      },
      onError: () => showToast("Failed to delete coupon."),
    });
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Manage discount codes."
        action={
          <Link to="/coupons/new">
            <Button type="button" variant="solid">
              New coupon
            </Button>
          </Link>
        }
      />

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && data.length === 0 && <EmptyState title="No coupons yet" description="Create your first discount code." />}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-cream">
                  <td className="px-4 py-3">
                    <Link to={`/coupons/${coupon.id}/edit`} className="font-mono font-semibold text-ink hover:text-gold-dark">
                      {coupon.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {/* `coupon.value` is a raw percentage for PERCENTAGE
                        coupons, or an integer-paise amount for FIXED ones —
                        see apps/api/src/lib/coupon-math.ts. */}
                    {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatINR(coupon.value)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {coupon.timesUsed}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={coupon.isActive ? "sage" : "ink"}>{coupon.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeletingId(coupon.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this coupon?"
        description="This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteCoupon.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
