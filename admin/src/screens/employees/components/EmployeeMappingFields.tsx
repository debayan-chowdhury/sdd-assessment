"use client";

import { useLocationsQuery } from "@/features/locations/locations.queries";
import { useDepartmentsQuery } from "@/features/departments/departments.queries";
import { useRolesQuery } from "@/features/roles/roles.queries";
import { useEmployeesQuery } from "@/features/employees/employees.queries";

export type MappingFieldErrors = {
  locationId?: string | null;
  departmentId?: string | null;
  roleId?: string | null;
  managerId?: string | null;
  hrId?: string | null;
};

type EmployeeMappingFieldsProps = {
  locationId: string;
  departmentId: string;
  roleId: string;
  managerId: string | null;
  hrId: string | null;
  onLocationChange: (locationId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
  onRoleChange: (roleId: string) => void;
  onManagerChange: (managerId: string | null) => void;
  onHrChange: (hrId: string | null) => void;
  excludeEmployeeId?: string;
  errors?: MappingFieldErrors;
};

export function EmployeeMappingFields({
  locationId,
  departmentId,
  roleId,
  managerId,
  hrId,
  onLocationChange,
  onDepartmentChange,
  onRoleChange,
  onManagerChange,
  onHrChange,
  excludeEmployeeId,
  errors = {},
}: EmployeeMappingFieldsProps) {
  const locationsQuery = useLocationsQuery({ isActive: true });
  const departmentsQuery = useDepartmentsQuery({ isActive: true });
  const rolesQuery = useRolesQuery({ isActive: true });
  const scopedEmployeesQuery = useEmployeesQuery(
    { locationId, departmentId, isActive: true },
    { enabled: Boolean(locationId && departmentId) },
  );

  const roleOptions = rolesQuery.data ?? [];
  const selectedRole = roleOptions.find((role) => role.id === roleId) ?? null;
  const category = selectedRole?.category ?? null;

  const showManager = Boolean(roleId) && category === null;
  const showHr = Boolean(roleId) && (category === null || category === "Manager");

  const roleCategoryById = new Map(
    roleOptions.map((role) => [role.id, role.category]),
  );
  const scopedEmployees = (scopedEmployeesQuery.data ?? []).filter(
    (employee) => employee.id !== excludeEmployeeId,
  );
  const managerOptions = scopedEmployees.filter(
    (employee) => roleCategoryById.get(employee.roleId) === "Manager",
  );
  const hrOptions = scopedEmployees.filter(
    (employee) => roleCategoryById.get(employee.roleId) === "HR",
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="employee-location" className="text-sm font-medium">
          Location
        </label>
        <select
          id="employee-location"
          value={locationId}
          onChange={(event) => onLocationChange(event.target.value)}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Select a location…</option>
          {(locationsQuery.data ?? []).map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} ({location.code})
            </option>
          ))}
        </select>
        {errors.locationId ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.locationId}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="employee-department" className="text-sm font-medium">
          Department
        </label>
        <select
          id="employee-department"
          value={departmentId}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Select a department…</option>
          {(departmentsQuery.data ?? []).map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.code})
            </option>
          ))}
        </select>
        {errors.departmentId ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.departmentId}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="employee-role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="employee-role"
          value={roleId}
          onChange={(event) => onRoleChange(event.target.value)}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Select a role…</option>
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.code})
            </option>
          ))}
        </select>
        {errors.roleId ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.roleId}
          </p>
        ) : null}
      </div>

      {showManager ? (
        <div className="space-y-1">
          <label htmlFor="employee-manager" className="text-sm font-medium">
            Manager
          </label>
          <select
            id="employee-manager"
            value={managerId ?? ""}
            onChange={(event) => onManagerChange(event.target.value || null)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="">Select a manager…</option>
            {managerOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.email})
              </option>
            ))}
          </select>
          {errors.managerId ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errors.managerId}
            </p>
          ) : null}
        </div>
      ) : null}

      {showHr ? (
        <div className="space-y-1">
          <label htmlFor="employee-hr" className="text-sm font-medium">
            HR
          </label>
          <select
            id="employee-hr"
            value={hrId ?? ""}
            onChange={(event) => onHrChange(event.target.value || null)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="">Select an HR contact…</option>
            {hrOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.email})
              </option>
            ))}
          </select>
          {errors.hrId ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errors.hrId}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
