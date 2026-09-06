"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useCurrentHrQueue } from "@/features/transfer-request/transfer-request.queries";
import { useCurrentHrDecision } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { RejectReasonDialog } from "@/components/ui/RejectReasonDialog";
import { Button } from "@/components/ui/Button";
import { apiErrorCode, apiStatus } from "@/lib/apiError";
import type { CurrentHrQueueItem } from "@/types/transferRequest";

export function CurrentHrQueue() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const queueQuery = useCurrentHrQueue(roleCategory === "HR");
  const decision = useCurrentHrDecision();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingIneligibleId, setConfirmingIneligibleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorByRequest, setErrorByRequest] = useState<Record<string, string>>({});

  if (roleCategory !== "HR") return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;

  const requests = queueQuery.data;

  function submitDecision(request: CurrentHrQueueItem, decisionValue: "accept" | "reject", reason?: string) {
    setPendingId(request.id);
    setConfirmingIneligibleId(null);
    setMessage(null);
    setErrorByRequest((prev) => ({ ...prev, [request.id]: "" }));
    decision.mutate(
      { id: request.id, payload: { decision: decisionValue, reason } },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage(decisionValue === "accept" ? "Request approved." : "Request rejected.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          const status = apiStatus(error);
          if (code === "INELIGIBLE_TENURE") {
            setErrorByRequest((prev) => ({
              ...prev,
              [request.id]: "This employee does not meet the 6-month minimum tenure requirement.",
            }));
            return;
          }
          if (code === "INVALID_STATUS_TRANSITION") {
            setMessage("This request is no longer pending your approval — it's been removed from your queue.");
            queueQuery.refetch();
            return;
          }
          if (status === 403) {
            setMessage("Something went wrong. Your queue has been refreshed.");
            queueQuery.refetch();
            return;
          }
          setMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  function handleAcceptClick(request: CurrentHrQueueItem) {
    if (!request.meetsMinimumTenure && confirmingIneligibleId !== request.id) {
      setConfirmingIneligibleId(request.id);
      return;
    }
    submitDecision(request, "accept");
  }

  return (
    <QueueSection
      title="Current HR"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on your approval."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && decision.isPending;
        const showIneligibleWarning = confirmingIneligibleId === request.id;
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />

            <dl className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <dt className="text-zinc-500 dark:text-zinc-400">Tenure:</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {request.employeeTenureDays === null ? "Unknown" : `${request.employeeTenureDays} days`}
                </dd>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  request.meetsMinimumTenure
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {request.meetsMinimumTenure ? "Meets minimum tenure" : "Below minimum tenure"}
              </span>
            </dl>

            {errorByRequest[request.id] && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {errorByRequest[request.id]}
              </p>
            )}

            {showIneligibleWarning && (
              <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
                This employee does not meet the 6-month minimum tenure requirement. Accept anyway?
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button type="button" loading={submitting} onClick={() => handleAcceptClick(request)}>
                {showIneligibleWarning ? "Accept anyway" : "Accept"}
              </Button>
              <RejectReasonDialog
                submitting={submitting}
                reasonRequired={false}
                onConfirm={(reason) => submitDecision(request, "reject", reason || undefined)}
              />
            </div>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
