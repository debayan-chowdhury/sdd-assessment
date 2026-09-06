"use client";

import { Modal } from "./Modal";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  // "danger" is for irreversible actions (e.g. permanent delete) — a red
  // confirm button, visually distinct from reversible actions like
  // deactivate/reactivate, which stay on the default "default" styling.
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  isConfirming = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={
            variant === "danger"
              ? "rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-red-500"
              : "rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          }
        >
          {isConfirming ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
