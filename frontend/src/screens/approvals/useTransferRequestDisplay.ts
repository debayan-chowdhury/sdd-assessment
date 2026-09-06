import { useMemo } from "react";
import {
  useAllDepartmentOptions,
  useEmployeeNames,
  useLocationOptions,
  useRoleOptions,
} from "@/features/transfer-request/transfer-request.queries";
import type { TransferRequest } from "@/types/transferRequest";

export type TransferRequestDisplay = {
  employeeName: string;
  targetLocation: string;
  targetDepartment: string;
  targetRole: string;
};

function toMap(records: Array<{ id: string; name: string }> | undefined): Map<string, string> {
  return new Map((records ?? []).map((record) => [record.id, record.name]));
}

/** Resolves the id fields on a set of TransferRequests (employee, target
 * Location/Department/Role) to display names — every approvals queue needs
 * this, since the backend's queue endpoints return raw ids only. */
export function useTransferRequestDisplay(requests: TransferRequest[]) {
  const employeeIds = useMemo(() => Array.from(new Set(requests.map((r) => r.employeeId))), [requests]);

  const employees = useEmployeeNames(employeeIds);
  const locations = useLocationOptions();
  const departments = useAllDepartmentOptions();
  const roles = useRoleOptions();

  const employeeMap = useMemo(() => toMap(employees.data), [employees.data]);
  const locationMap = useMemo(() => toMap(locations.data), [locations.data]);
  const departmentMap = useMemo(() => toMap(departments.data), [departments.data]);
  const roleMap = useMemo(() => toMap(roles.data), [roles.data]);

  function describe(request: TransferRequest): TransferRequestDisplay {
    return {
      employeeName: employeeMap.get(request.employeeId) ?? "Unknown employee",
      targetLocation: locationMap.get(request.newLocationId) ?? "—",
      targetDepartment: departmentMap.get(request.newDepartmentId) ?? "—",
      targetRole: roleMap.get(request.newRoleId) ?? "—",
    };
  }

  return {
    describe,
    isLoading: employees.isLoading || locations.isLoading || departments.isLoading || roles.isLoading,
  };
}
