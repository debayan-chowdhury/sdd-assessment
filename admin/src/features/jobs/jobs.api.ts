import { api } from "@/lib/axios";

export async function triggerDueOrgUpdates(): Promise<{ appliedCount: number }> {
  const response = await api.post<{ appliedCount: number }>(
    "/admin/jobs/due-org-updates/trigger",
  );
  return response.data;
}
