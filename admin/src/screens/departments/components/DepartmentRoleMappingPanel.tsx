"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useRolesQuery } from "@/features/roles/roles.queries";
import {
  useAddRoleMappingMutation,
  useRemoveRoleMappingMutation,
} from "@/features/departments/departments.mutations";
import { useDepartmentRolesQuery } from "@/features/departments/departments.queries";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";

type DepartmentRoleMappingPanelProps = {
  departmentId: string;
};

export function DepartmentRoleMappingPanel({
  departmentId,
}: DepartmentRoleMappingPanelProps) {
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const mappedQuery = useDepartmentRolesQuery(departmentId);
  const rolesQuery = useRolesQuery();
  const addMutation = useAddRoleMappingMutation(departmentId);
  const removeMutation = useRemoveRoleMappingMutation(departmentId);

  const mappedRoles = mappedQuery.data ?? [];
  const mappedIds = new Set(mappedRoles.map((role) => role.id));
  const availableRoles = (rolesQuery.data ?? []).filter(
    (role) => !mappedIds.has(role.id),
  );

  const addErrorCode = getApiErrorCode(addMutation.error);
  const addErrorMessage =
    addErrorCode === "MAPPING_ALREADY_EXISTS"
      ? "This role is already enabled for this department."
      : getApiErrorMessage(addMutation.error);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRoleId) return;
    addMutation.mutate(selectedRoleId, {
      onSuccess: () => setSelectedRoleId(""),
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Enabled Roles</h2>

      {mappedQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : mappedRoles.length === 0 ? (
        <p className="text-sm text-zinc-500">No roles enabled.</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {mappedRoles.map((role) => (
            <li
              key={role.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                {role.name} ({role.code})
                <CategoryBadge category={role.category} />
              </span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(role.id)}
                disabled={removeMutation.isPending}
                className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                Disable
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="enable-role" className="text-sm font-medium">
            Enable Role
          </label>
          <select
            id="enable-role"
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="">Select a role…</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selectedRoleId || addMutation.isPending}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Enable
        </button>
      </form>

      {addErrorMessage ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {addErrorMessage}
        </p>
      ) : null}
    </section>
  );
}
