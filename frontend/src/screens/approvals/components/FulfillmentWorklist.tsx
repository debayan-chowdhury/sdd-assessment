"use client";

import { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { Button } from "@/components/ui/Button";
import { apiErrorCode } from "@/lib/apiError";
import type { RoleCategory } from "@/types/employee";
import type { FulfillmentStatusPayload } from "@/features/transfer-request/transfer-request.api";
import type { FulfillmentSubStatus, TransferRequest } from "@/types/transferRequest";

const SUB_STATUS_CLASSES: Partial<Record<NonNullable<FulfillmentSubStatus>, string>> = {
  Done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Not Applicable": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};
const DEFAULT_SUB_STATUS_CLASSES = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

// Narrowed to just what this component reads/calls, rather than the full
// UseQueryResult/UseMutationResult shape — keeps the wrapper components
// (PayrollWorklist etc.) passing real hooks straightforward to type, and
// keeps tests from having to fabricate every field of the full result.
type WorklistQuery = Pick<UseQueryResult<TransferRequest[]>, "data" | "isLoading" | "refetch">;
type StatusUpdateMutation = Pick<
  UseMutationResult<TransferRequest, unknown, { id: string; payload: FulfillmentStatusPayload }>,
  "mutate" | "isPending"
>;

type FulfillmentWorklistProps = {
  title: string;
  roleCategory: Exclude<RoleCategory, null>;
  statusField: "payrollStatus" | "itStatus" | "facilitiesStatus";
  useWorklist: (enabled: boolean) => WorklistQuery;
  useStatusUpdate: () => StatusUpdateMutation;
};

// Shared by Payroll/IT/Facilities — identical mechanics across all three
// (list, Mark Done, empty state, escalation indicator, loading state),
// gated client-side by the logged-in user's own roleCategory.
export function FulfillmentWorklist({
  title,
  roleCategory,
  statusField,
  useWorklist,
  useStatusUpdate,
}: FulfillmentWorklistProps) {
  const currentRoleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const isRelevant = currentRoleCategory === roleCategory;
  // The backend 403s this list for any caller outside the matching
  // roleCategory — `enabled: isRelevant` skips the request entirely for
  // everyone else instead of letting it fail.
  const queueQuery = useWorklist(isRelevant);
  const statusUpdate = useStatusUpdate();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isRelevant) return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;

  const requests = queueQuery.data;

  function submitStatus(request: TransferRequest, payload: FulfillmentStatusPayload) {
    setPendingId(request.id);
    setMessage(null);
    statusUpdate.mutate(
      { id: request.id, payload },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Marked done.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          if (code === "INVALID_STATUS_TRANSITION") {
            setMessage("This item is no longer actionable — it's been removed from your worklist.");
            queueQuery.refetch();
            return;
          }
          setMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <QueueSection
      title={title}
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on your action."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && statusUpdate.isPending;
        const status = request[statusField];
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status ? (SUB_STATUS_CLASSES[status] ?? DEFAULT_SUB_STATUS_CLASSES) : DEFAULT_SUB_STATUS_CLASSES}`}
            >
              {status}
            </span>

            <Button type="button" loading={submitting} onClick={() => submitStatus(request, { status: "Done" })}>
              Mark Done
            </Button>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
