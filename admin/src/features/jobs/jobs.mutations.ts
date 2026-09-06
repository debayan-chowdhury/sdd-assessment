import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerDueOrgUpdates } from "./jobs.api";

export function useTriggerDueOrgUpdatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerDueOrgUpdates,
    onSuccess: () => {
      // An applied update changes Employee location/department/role/manager/hr —
      // invalidate the employee list/detail views so they don't show stale data.
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
