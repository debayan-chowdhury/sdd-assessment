"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useReceivingHrFulfillmentQueue } from "@/features/transfer-request/transfer-request.queries";
import { useConfirmCompletion, useTriggerFulfillment } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { SubStatusList } from "@/screens/transfer-request/components/SubStatusList";
import { Button } from "@/components/ui/Button";
import { apiErrorCode } from "@/lib/apiError";
import type { TransferRequest } from "@/types/transferRequest";

const TARGET_FIELDS: Array<"payrollStatus" | "itStatus" | "facilitiesStatus"> = [
  "payrollStatus",
  "itStatus",
  "facilitiesStatus",
];

export function ReceivingHrFulfillmentQueue() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const queueQuery = useReceivingHrFulfillmentQueue(roleCategory === "HR");
  const trigger = useTriggerFulfillment();
  const confirm = useConfirmCompletion();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (roleCategory !== "HR") return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;
  const requests = queueQuery.data;

  function handleTrigger(request: TransferRequest) {
    setPendingId(request.id);
    setMessage(null);
    trigger.mutate(request.id, {
      onSuccess: () => {
        setPendingId(null);
        setMessage("Fulfillment triggered.");
      },
      onError: () => {
        setPendingId(null);
        setMessage("Something went wrong. Please try again.");
      },
    });
  }

  function handleConfirm(request: TransferRequest) {
    setPendingId(request.id);
    setMessage(null);
    confirm.mutate(request.id, {
      onSuccess: () => {
        setPendingId(null);
        setMessage("Completion confirmed.");
      },
      onError: (error) => {
        setPendingId(null);
        const code = apiErrorCode(error);
        if (code === "FULFILLMENT_INCOMPLETE") {
          setMessage("Not every applicable item is Done yet.");
          return;
        }
        setMessage("Something went wrong. Please try again.");
      },
    });
  }

  return (
    <QueueSection
      title="Receiving HR — Fulfillment"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on fulfillment."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id;
        const allDone = TARGET_FIELDS.every((field) => {
          const value = request[field];
          return value === "Done" || value === "Not Applicable";
        });

        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <SubStatusList
              payrollStatus={request.payrollStatus}
              itStatus={request.itStatus}
              facilitiesStatus={request.facilitiesStatus}
            />

            {request.status === "Pending Fulfillment Trigger" && (
              <Button type="button" loading={submitting && trigger.isPending} onClick={() => handleTrigger(request)}>
                Trigger Fulfillment
              </Button>
            )}

            <Button
              type="button"
              disabled={!allDone}
              loading={submitting && confirm.isPending}
              onClick={() => handleConfirm(request)}
            >
              Confirm Completion
            </Button>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
