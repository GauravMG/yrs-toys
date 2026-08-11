import { Button, Modal, ModalTitle, ModalDescription } from "@yrs/ui";
import { ErrorBanner } from "./ErrorBanner";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  isLoading,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  /** Shown inline (e.g. a 409 "category is in use") instead of closing the dialog on failure. */
  error?: unknown;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} ariaLabel={title} className="max-w-[420px] p-6">
      <ModalTitle className="font-display text-lg text-ink">{title}</ModalTitle>
      {description && <ModalDescription className="mt-2 text-sm text-ink-soft">{description}</ModalDescription>}
      {error ? (
        <div className="mt-4">
          <ErrorBanner error={error} />
        </div>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" variant="solid" isLoading={isLoading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
