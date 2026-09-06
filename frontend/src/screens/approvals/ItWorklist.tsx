"use client";

import { FulfillmentWorklist } from "@/screens/approvals/components/FulfillmentWorklist";
import { useItWorklist } from "@/features/transfer-request/transfer-request.queries";
import { useItStatusUpdate } from "@/features/transfer-request/transfer-request.mutations";

export function ItWorklist() {
  return (
    <FulfillmentWorklist
      title="IT"
      roleCategory="IT"
      statusField="itStatus"
      useWorklist={useItWorklist}
      useStatusUpdate={useItStatusUpdate}
    />
  );
}
