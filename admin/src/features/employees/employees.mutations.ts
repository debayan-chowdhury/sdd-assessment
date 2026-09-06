import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEmployee, deleteEmployee, setEmployeeStatus, updateEmployee } from "./employees.api";
import type { EmployeeCreateInput, EmployeeInput } from "@/types/employee";

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmployeeCreateInput) => createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployeeMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmployeeInput) => updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useSetEmployeeStatusMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) => setEmployeeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
