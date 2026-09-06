"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeQuery } from "@/features/employees/employees.queries";
import {
  useDeleteEmployeeMutation,
  useSetEmployeeStatusMutation,
} from "@/features/employees/employees.mutations";
import { useLocationQuery } from "@/features/locations/locations.queries";
import { useDepartmentQuery } from "@/features/departments/departments.queries";
import { useRoleQuery } from "@/features/roles/roles.queries";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import { EmployeeFormModal } from "./components/EmployeeFormModal";

type EmployeeDetailPageProps = {
  employeeId: string;
};

function EmployeeRefName({ employeeId }: { employeeId: string }) {
  const query = useEmployeeQuery(employeeId);
  if (query.isLoading) return <>Loading…</>;
  if (query.isError || !query.data) return <>Unknown</>;
  return (
    <>
      {query.data.name} ({query.data.email})
    </>
  );
}

export function EmployeeDetailPage({ employeeId }: EmployeeDetailPageProps) {
  const router = useRouter();
  const employeeQuery = useEmployeeQuery(employeeId);
  const statusMutation = useSetEmployeeStatusMutation(employeeId);
  const deleteMutation = useDeleteEmployeeMutation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const employee = employeeQuery.data;

  const locationQuery = useLocationQuery(employee?.locationId ?? "");
  const departmentQuery = useDepartmentQuery(employee?.departmentId ?? "");
  const roleQuery = useRoleQuery(employee?.roleId ?? "");

  const statusErrorMessage = getApiErrorMessage(statusMutation.error);

  const deleteErrorCode = getApiErrorCode(deleteMutation.error);
  const deleteErrorMessage =
    deleteErrorCode === "EMPLOYEE_HAS_DEPENDENTS"
      ? "This employee is another employee's manager or HR contact and cannot be deleted."
      : getApiErrorMessage(deleteMutation.error);

  function handleDeactivateConfirm() {
    statusMutation.mutate(false, {
      onSettled: () => setIsConfirmOpen(false),
    });
  }

  function handleReactivate() {
    statusMutation.mutate(true);
  }

  function handleDeleteConfirm() {
    deleteMutation.mutate(employeeId, {
      onSuccess: () => router.push("/employees"),
      onSettled: () => setIsDeleteConfirmOpen(false),
    });
  }

  if (employeeQuery.isLoading) {
    return <p className="p-6 text-sm text-zinc-500">Loading…</p>;
  }

  if (employeeQuery.isError || !employee) {
    return (
      <p role="alert" className="p-6 text-sm text-red-600 dark:text-red-400">
        Employee not found.
      </p>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <button
        type="button"
        onClick={() => router.push("/employees")}
        className="mb-4 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to Employees
      </button>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{employee.name}</h1>
          <StatusBadge isActive={employee.isActive} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
          >
            Edit
          </button>
          {employee.isActive ? (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={statusMutation.isPending}
              className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
            >
              Reactivate
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="rounded border border-red-600 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-500 dark:text-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-zinc-500">Email</dt>
        <dd>{employee.email}</dd>
        <dt className="text-zinc-500">Location</dt>
        <dd>
          {locationQuery.isLoading
            ? "Loading…"
            : (locationQuery.data?.name ?? "Unknown")}
        </dd>
        <dt className="text-zinc-500">Department</dt>
        <dd>
          {departmentQuery.isLoading
            ? "Loading…"
            : (departmentQuery.data?.name ?? "Unknown")}
        </dd>
        <dt className="text-zinc-500">Role</dt>
        <dd>
          {roleQuery.isLoading ? "Loading…" : (roleQuery.data?.name ?? "Unknown")}
        </dd>
        <dt className="text-zinc-500">Manager</dt>
        <dd>
          {employee.managerId ? (
            <EmployeeRefName employeeId={employee.managerId} />
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-zinc-500">HR</dt>
        <dd>
          {employee.hrId ? <EmployeeRefName employeeId={employee.hrId} /> : "—"}
        </dd>
      </dl>

      {statusErrorMessage ? (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {statusErrorMessage}
        </p>
      ) : null}

      {deleteErrorMessage ? (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {deleteErrorMessage}
        </p>
      ) : null}

      <EmployeeFormModal
        key={isEditOpen ? "edit-open" : "edit-closed"}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        employee={employee}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate "${employee.name}"?`}
        confirmLabel="Deactivate"
        isConfirming={statusMutation.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete "${employee.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </main>
  );
}
