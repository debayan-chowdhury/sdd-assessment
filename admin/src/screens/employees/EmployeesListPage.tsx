"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeesQuery } from "@/features/employees/employees.queries";
import type { EmployeeFilters } from "@/features/employees/employees.api";
import { useLocationsQuery } from "@/features/locations/locations.queries";
import { useDepartmentsQuery } from "@/features/departments/departments.queries";
import { useRolesQuery } from "@/features/roles/roles.queries";
import { EmployeeTable } from "./components/EmployeeTable";
import { EmployeeFormModal } from "./components/EmployeeFormModal";

export function EmployeesListPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  const locationsQuery = useLocationsQuery();
  const departmentsQuery = useDepartmentsQuery();
  const rolesQuery = useRolesQuery();

  const filters: EmployeeFilters = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(locationId ? { locationId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(roleId ? { roleId } : {}),
  };
  const employeesQuery = useEmployeesQuery(filters);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Employees</h1>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add Employee
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active only
        </label>

        <label className="flex items-center gap-2 text-sm">
          Location
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15"
          >
            <option value="">All locations</option>
            {(locationsQuery.data ?? []).map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Department
          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15"
          >
            <option value="">All departments</option>
            {(departmentsQuery.data ?? []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Role
          <select
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15"
          >
            <option value="">All roles</option>
            {(rolesQuery.data ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {employeesQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : employeesQuery.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Failed to load employees.
        </p>
      ) : (
        <EmployeeTable
          employees={employeesQuery.data ?? []}
          onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
        />
      )}

      <EmployeeFormModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
      />
    </main>
  );
}
