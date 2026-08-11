import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/cn.js";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onOpenChange, title, children, footer }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-ink/45" />
        <Dialog.Content
          aria-label={title}
          className={cn(
            "fixed right-0 top-0 z-[160] flex h-full w-full max-w-[400px] flex-col bg-panel shadow-[-10px_0_30px_rgba(0,0,0,0.1)]",
            "data-[state=open]:animate-[slide-in_.35s_cubic-bezier(.22,1,.36,1)]",
          )}
          style={{ animation: open ? "none" : undefined }}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <Dialog.Title className="font-display text-lg text-ink">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-dark"
            >
              ✕
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="border-t border-line px-6 py-5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
