import {
  useDepartmentOptions,
  useLocationOptions,
  useRoleOptions,
} from "@/features/transfer-request/transfer-request.queries";

export type SelectOption = { id: string; name: string };

export function useTransferRequestOptions(newLocationId: string) {
  const locations = useLocationOptions();
  const departments = useDepartmentOptions(newLocationId);
  const roles = useRoleOptions();

  return {
    locations: locations.data ?? [],
    departments: departments.data ?? [],
    roles: roles.data ?? [],
    isLoading: locations.isLoading || roles.isLoading,
    isLoadingDepartments: departments.isLoading,
    refetch: () => {
      locations.refetch();
      departments.refetch();
      roles.refetch();
    },
  };
}
