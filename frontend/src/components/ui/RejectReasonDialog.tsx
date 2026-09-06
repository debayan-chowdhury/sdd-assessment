"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

type RejectReasonDialogProps = {
  onConfirm: (reason: string) => void;
  submitting?: boolean;
  /** Whether a non-empty reason is required before Confirm can submit. Defaults to required. */
  reasonRequired?: boolean;
};

export function RejectReasonDialog({ onConfirm, submitting, reasonRequired = true }: RejectReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaId = useId();
  const errorId = `${textareaId}-error`;

  if (!open) {
    return (
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Reject
      </Button>
    );
  }

  function handleCancel() {
    setOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    if (reasonRequired && !reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
      <label htmlFor={textareaId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Reason{reasonRequired ? "" : " (optional)"}
      </label>
      <textarea
        id={textareaId}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="danger" loading={submitting} onClick={handleConfirm}>
          Confirm reject
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
