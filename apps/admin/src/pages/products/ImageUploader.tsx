import { useRef, useState } from "react";
import { Button, Badge, Spinner } from "@yrs/ui";
import { useToast } from "@yrs/ui";
import type { ProductImage } from "@yrs/shared";
import { useUploadProductImage, useDeleteProductImage } from "../../hooks/useProducts";
import { ApiError, API_ORIGIN } from "../../lib/api-client";

/**
 * Uploaded image URLs come back relative (e.g. "/uploads/xyz.jpg"), served
 * by the API's origin, not this app's — resolve to an absolute URL against
 * `API_ORIGIN` so it works identically in `pnpm dev` (Vite dev server) and
 * the production nginx static build (docker/admin.Dockerfile), neither of
 * which proxies `/uploads` through this app's own origin.
 *
 * This relies on the API sending `Cross-Origin-Resource-Policy: cross-origin`
 * (apps/api/src/plugins/helmet.ts) — without it the browser silently blocks
 * the cross-origin <img> load even though the request itself succeeds.
 */
function resolveImageUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ImageUploader({ productId, images }: { productId: string; images: ProductImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const upload = useUploadProductImage(productId);
  const remove = useDeleteProductImage(productId);
  const { showToast } = useToast();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => showToast("Image uploaded."),
      onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to upload image."),
    });
  }

  function handleDelete(imageId: string) {
    setPendingDeleteId(imageId);
    remove.mutate(imageId, {
      onSuccess: () => showToast("Image removed."),
      onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to remove image."),
      onSettled: () => setPendingDeleteId(null),
    });
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="group relative overflow-hidden rounded-md border border-line bg-cream">
            <img src={resolveImageUrl(image.url)} alt={image.altText ?? ""} className="aspect-square w-full object-cover" />
            {image.isPrimary && (
              <Badge tone="gold" className="absolute left-2 top-2">
                Primary
              </Badge>
            )}
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={remove.isPending && pendingDeleteId === image.id}
              aria-label={`Remove image`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
            >
              {remove.isPending && pendingDeleteId === image.id ? <Spinner size={14} /> : "✕"}
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-sm text-ink-soft">No images yet — the first one you add becomes the primary image.</p>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Button type="button" variant="outline" size="sm" isLoading={upload.isPending} onClick={() => inputRef.current?.click()}>
        Upload image
      </Button>
    </div>
  );
}
