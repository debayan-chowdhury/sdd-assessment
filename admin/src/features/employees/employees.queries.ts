import { useQuery } from "@tanstack/react-query";
import { getEmployee, getEmployees } from "./employees.api";
import type { EmployeeFilters } from "./employees.api";

export function useEmployeesQuery(
  filters: EmployeeFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: () => getEmployees(filters),
    enabled: options.enabled ?? true,
  });
}

export function useEmployeeQuery(id: string) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id),
    enabled: Boolean(id),
  });
}
