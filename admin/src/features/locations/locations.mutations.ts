import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDepartmentMapping,
  createLocation,
  deleteLocation,
  removeDepartmentMapping,
  setLocationStatus,
  updateLocation,
} from "./locations.api";
import type { LocationInput } from "@/types/location";

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LocationInput) => createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateLocationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LocationInput) => updateLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useSetLocationStatusMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) => setLocationStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useAddDepartmentMappingMutation(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) =>
      addDepartmentMapping(locationId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations", locationId, "departments"],
      });
    },
  });
}

export function useRemoveDepartmentMappingMutation(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) =>
      removeDepartmentMapping(locationId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations", locationId, "departments"],
      });
    },
  });
}
