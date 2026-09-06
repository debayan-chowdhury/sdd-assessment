"use client";

import { FulfillmentWorklist } from "@/screens/approvals/components/FulfillmentWorklist";
import { usePayrollWorklist } from "@/features/transfer-request/transfer-request.queries";
import { usePayrollStatusUpdate } from "@/features/transfer-request/transfer-request.mutations";

export function PayrollWorklist() {
  return (
    <FulfillmentWorklist
      title="Payroll"
      roleCategory="Payroll"
      statusField="payrollStatus"
      useWorklist={usePayrollWorklist}
      useStatusUpdate={usePayrollStatusUpdate}
    />
  );
}
