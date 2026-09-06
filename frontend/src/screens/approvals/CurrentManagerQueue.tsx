"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useCurrentManagerQueue } from "@/features/transfer-request/transfer-request.queries";
import { useCurrentManagerDecision } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { RejectReasonDialog } from "@/components/ui/RejectReasonDialog";
import { Button } from "@/components/ui/Button";
import { apiErrorCode, apiStatus } from "@/lib/apiError";
import type { TransferRequest } from "@/types/transferRequest";

export function CurrentManagerQueue() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const queueQuery = useCurrentManagerQueue(roleCategory === "Manager");
  const decision = useCurrentManagerDecision();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Any assigned Current Manager necessarily holds a Manager-category Role
  // (the backend's employee-mapping rules require it), so restricting this
  // section to that roleCategory client-side never hides a real assignment —
  // it only keeps every other role from seeing an always-empty section.
  if (roleCategory !== "Manager") return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;

  const requests = queueQuery.data;

  function handleDecision(request: TransferRequest, decisionValue: "accept" | "reject", reason?: string) {
    setPendingId(request.id);
    setMessage(null);
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

  return (
    <QueueSection
      title="Current Manager"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on your approval."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && decision.isPending;
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <div className="flex items-center gap-2">
              <Button type="button" loading={submitting} onClick={() => handleDecision(request, "accept")}>
                Accept
              </Button>
              <RejectReasonDialog
                submitting={submitting}
                onConfirm={(reason) => handleDecision(request, "reject", reason)}
              />
            </div>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
