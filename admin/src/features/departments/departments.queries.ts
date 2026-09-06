import { useQuery } from "@tanstack/react-query";
import {
  getDepartment,
  getDepartmentRoles,
  getDepartments,
} from "./departments.api";
import type { DepartmentFilters } from "./departments.api";

export function useDepartmentsQuery(filters: DepartmentFilters = {}) {
  return useQuery({
    queryKey: ["departments", filters],
    queryFn: () => getDepartments(filters),
  });
}

export function useDepartmentQuery(id: string) {
  return useQuery({
    queryKey: ["departments", id],
    queryFn: () => getDepartment(id),
    enabled: Boolean(id),
  });
}

export function useDepartmentRolesQuery(id: string) {
  return useQuery({
    queryKey: ["departments", id, "roles"],
    queryFn: () => getDepartmentRoles(id),
    enabled: Boolean(id),
  });
}
