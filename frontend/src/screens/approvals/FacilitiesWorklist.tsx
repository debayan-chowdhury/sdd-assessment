"use client";

import { FulfillmentWorklist } from "@/screens/approvals/components/FulfillmentWorklist";
import { useFacilitiesWorklist } from "@/features/transfer-request/transfer-request.queries";
import { useFacilitiesStatusUpdate } from "@/features/transfer-request/transfer-request.mutations";

export function FacilitiesWorklist() {
  return (
    <FulfillmentWorklist
      title="Facilities"
      roleCategory="Facilities"
      statusField="facilitiesStatus"
      useWorklist={useFacilitiesWorklist}
      useStatusUpdate={useFacilitiesStatusUpdate}
    />
  );
}
