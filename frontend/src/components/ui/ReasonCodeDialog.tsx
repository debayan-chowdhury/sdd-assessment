"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ReceivingManagerRejectReasonCode } from "@/types/transferRequest";

const REASON_CODE_OPTIONS: Array<{ value: ReceivingManagerRejectReasonCode; label: string }> = [
  { value: "NO_HEADCOUNT", label: "No open headcount" },
  { value: "ROLE_SKILL_MISMATCH", label: "Role/skill mismatch" },
  { value: "TIMING_CONFLICT", label: "Timing conflict" },
  { value: "OTHER", label: "Other" },
];

type ReasonCodeDialogProps = {
  onConfirm: (reasonCode: ReceivingManagerRejectReasonCode, reasonDetail: string) => void;
  submitting?: boolean;
};

export function ReasonCodeDialog({ onConfirm, submitting }: ReasonCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<ReceivingManagerRejectReasonCode | "">("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectId = useId();
  const detailId = useId();
  const errorId = `${selectId}-error`;

  if (!open) {
    return (
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Reject
      </Button>
    );
  }

  function handleCancel() {
    setOpen(false);
    setReasonCode("");
    setReasonDetail("");
    setError(null);
  }

  function handleConfirm() {
    if (!reasonCode) {
      setError("A reason is required.");
      return;
    }
    setError(null);
    onConfirm(reasonCode, reasonDetail.trim());
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Reason
      </label>
      <select
        id={selectId}
        value={reasonCode}
        onChange={(e) => setReasonCode(e.target.value as ReceivingManagerRejectReasonCode)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
      >
        <option value="">Select a reason</option>
        {REASON_CODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor={detailId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Detail (optional)
      </label>
      <textarea
        id={detailId}
        value={reasonDetail}
        onChange={(e) => setReasonDetail(e.target.value)}
        rows={2}
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
