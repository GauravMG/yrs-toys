import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/cn.js";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
}

export function Modal({ open, onOpenChange, children, className, ariaLabel }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-ink/45 data-[state=open]:animate-toast-in" />
        <Dialog.Content
          aria-label={ariaLabel}
          className={cn(
            "fixed left-1/2 top-1/2 z-[180] w-full max-w-[680px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-panel shadow-pop focus:outline-none",
            className,
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ModalClose({ className }: { className?: string }) {
  return (
    <Dialog.Close
      aria-label="Close"
      className={cn(
        "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-ink transition-colors hover:bg-cream-dark",
        className,
      )}
    >
      ✕
    </Dialog.Close>
  );
}

export const ModalTitle = Dialog.Title;
export const ModalDescription = Dialog.Description;
