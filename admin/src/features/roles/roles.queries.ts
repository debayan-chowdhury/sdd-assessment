import { useQuery } from "@tanstack/react-query";
import { getRole, getRoles } from "./roles.api";
import type { RoleFilters } from "./roles.api";

export function useRolesQuery(filters: RoleFilters = {}) {
  return useQuery({
    queryKey: ["roles", filters],
    queryFn: () => getRoles(filters),
  });
}

export function useRoleQuery(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => getRole(id),
    enabled: Boolean(id),
  });
}
