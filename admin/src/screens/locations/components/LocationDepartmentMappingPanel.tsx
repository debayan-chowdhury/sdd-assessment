"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useDepartmentsQuery } from "@/features/departments/departments.queries";
import {
  useAddDepartmentMappingMutation,
  useRemoveDepartmentMappingMutation,
} from "@/features/locations/locations.mutations";
import { useLocationDepartmentsQuery } from "@/features/locations/locations.queries";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";

type LocationDepartmentMappingPanelProps = {
  locationId: string;
};

export function LocationDepartmentMappingPanel({
  locationId,
}: LocationDepartmentMappingPanelProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const mappedQuery = useLocationDepartmentsQuery(locationId);
  const departmentsQuery = useDepartmentsQuery();
  const addMutation = useAddDepartmentMappingMutation(locationId);
  const removeMutation = useRemoveDepartmentMappingMutation(locationId);

  const mappedDepartments = mappedQuery.data ?? [];
  const mappedIds = new Set(mappedDepartments.map((department) => department.id));
  const availableDepartments = (departmentsQuery.data ?? []).filter(
    (department) => !mappedIds.has(department.id),
  );

  const addErrorCode = getApiErrorCode(addMutation.error);
  const addErrorMessage =
    addErrorCode === "MAPPING_ALREADY_EXISTS"
      ? "This department is already mapped to this location."
      : getApiErrorMessage(addMutation.error);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDepartmentId) return;
    addMutation.mutate(selectedDepartmentId, {
      onSuccess: () => setSelectedDepartmentId(""),
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Mapped Departments</h2>

      {mappedQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : mappedDepartments.length === 0 ? (
        <p className="text-sm text-zinc-500">No departments mapped.</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {mappedDepartments.map((department) => (
            <li
              key={department.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span>
                {department.name} ({department.code})
              </span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(department.id)}
                disabled={removeMutation.isPending}
                className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="add-department" className="text-sm font-medium">
            Add Department
          </label>
          <select
            id="add-department"
            value={selectedDepartmentId}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="">Select a department…</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selectedDepartmentId || addMutation.isPending}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Add
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
