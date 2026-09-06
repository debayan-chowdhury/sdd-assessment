import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addRoleMapping,
  createDepartment,
  deleteDepartment,
  removeRoleMapping,
  setDepartmentStatus,
  updateDepartment,
} from "./departments.api";
import type { DepartmentInput } from "@/types/department";

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentInput) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartmentMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentInput) => updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useSetDepartmentStatusMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) => setDepartmentStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useAddRoleMappingMutation(departmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => addRoleMapping(departmentId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "roles"],
      });
    },
  });
}

export function useRemoveRoleMappingMutation(departmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => removeRoleMapping(departmentId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "roles"],
      });
    },
  });
}
