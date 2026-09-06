export type TransferRequestStatus =
  | "Pending Current Manager Approval"
  | "Pending Current HR Approval"
  | "Pending Receiving HR Approval"
  | "Pending Receiving Manager Approval"
  | "Pending Receiving HR Reassignment"
  | "Pending Fulfillment Trigger"
  | "Pending Fulfillment"
  | "Completed"
  | "Rejected"
  | "Hold";

export type FulfillmentSubStatus = "Pending" | "Done" | "Not Applicable" | null;

export type TransferRequest = {
  id: string;
  employeeId: string;
  currentLocationId: string;
  currentDepartmentId: string;
  currentRoleId: string;
  newLocationId: string;
  newDepartmentId: string;
  newRoleId: string;
  effectiveDate: string;
  reason: string | null;
  status: TransferRequestStatus;
  currentManagerId: string;
  // Only populated by GET /transfer-requests/me — that's the one endpoint
  // that resolves these server-side (see transferRequest.controller.js's
  // withApproverNames); other list endpoints return the bare id only.
  currentManagerName?: string | null;
  currentHrId: string;
  currentHrName?: string | null;
  receivingHrId: string;
  receivingHrName?: string | null;
  receivingManagerId: string | null;
  receivingManagerName?: string | null;
  payrollStatus: FulfillmentSubStatus;
  itStatus: FulfillmentSubStatus;
  facilitiesStatus: FulfillmentSubStatus;
  rejectionReason: string | null;
  holdReason: string | null;
  escalated: boolean;
  escalatedAt: string | null;
  createdAt: string;
  // Set once the Employee's own Location/Department/Role/Manager/HR have
  // actually been updated to match this request — deferred until
  // effectiveDate, not the moment Receiving HR accepts (see backend
  // receiving-hr-transfer-gatekeeping.spec.md's deferred-update amendment).
  // null/undefined while still pending.
  orgDataAppliedAt?: string | null;
};

// Returned only by GET /transfer-requests/pending/current-hr — tenure is
// backend-computed from the Employee's createdAt, never re-derived here.
export type CurrentHrQueueItem = TransferRequest & {
  employeeTenureDays: number | null;
  meetsMinimumTenure: boolean;
};

export type FulfillmentTarget = "payroll" | "it" | "facilities";

export type ReceivingManagerRejectReasonCode =
  | "NO_HEADCOUNT"
  | "ROLE_SKILL_MISMATCH"
  | "TIMING_CONFLICT"
  | "OTHER";
