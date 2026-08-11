import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Badge, Select, Spinner, StarRating, useToast } from "@yrs/ui";
import { ReviewStatusEnum } from "@yrs/shared";
import type { ReviewStatusValue } from "@yrs/shared";
import { useAdminReviews, useModerateReview } from "../../hooks/useReviews";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { ApiError } from "../../lib/api-client";

const STATUS_OPTIONS: (ReviewStatusValue | "ALL")[] = [...ReviewStatusEnum.options, "ALL"];

export function ReviewsPage() {
  const [status, setStatus] = useState<ReviewStatusValue | "ALL">("PENDING");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminReviews({
    status: status === "ALL" ? undefined : status,
    page,
    limit: 20,
  });
  const moderate = useModerateReview();
  const { showToast } = useToast();

  function handleModerate(id: string, next: "APPROVED" | "REJECTED") {
    moderate.mutate(
      { id, input: { status: next } },
      {
        onSuccess: () => showToast(next === "APPROVED" ? "Review approved." : "Review rejected."),
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to moderate review."),
      },
    );
  }

  return (
    <div>
      <PageHeader title="Reviews" description="Moderate customer reviews before they go live." />

      <div className="mb-4">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReviewStatusValue | "ALL");
            setPage(1);
          }}
          className="max-w-[200px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState title="Nothing to moderate" description="No reviews match this filter right now." />
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-col gap-4">
          {data.items.map((review) => (
            <div key={review.id} className="rounded-lg border border-line bg-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/products/${review.product.id}/edit`} className="font-semibold text-ink hover:text-gold-dark">
                    {review.product.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={review.rating} size={14} />
                    <span className="text-xs text-ink-soft">by {review.user.fullName}</span>
                    {review.isVerifiedPurchase && <Badge tone="teal">Verified purchase</Badge>}
                  </div>
                </div>
                <Badge tone={review.status === "PENDING" ? "gold" : review.status === "APPROVED" ? "sage" : "coral"}>
                  {review.status}
                </Badge>
              </div>
              {review.title && <p className="mt-3 text-sm font-semibold text-ink">{review.title}</p>}
              <p className="mt-1 text-sm text-ink-soft">{review.comment}</p>

              {review.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="solid"
                    size="sm"
                    isLoading={moderate.isPending && moderate.variables?.id === review.id}
                    onClick={() => handleModerate(review.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={moderate.isPending && moderate.variables?.id === review.id}
                    onClick={() => handleModerate(review.id, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
