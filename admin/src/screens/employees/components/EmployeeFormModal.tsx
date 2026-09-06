"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} from "@/features/employees/employees.mutations";
import type { Employee } from "@/types/employee";
import { EmployeeMappingFields } from "./EmployeeMappingFields";

type EmployeeFormModalProps =
  | { isOpen: boolean; onClose: () => void; mode: "create"; employee?: undefined }
  | { isOpen: boolean; onClose: () => void; mode: "edit"; employee: Employee };

// Keyed by the parent on open/close (see EmployeesListPage /
// EmployeeDetailPage) so each open is a fresh mount — initial field values
// come straight from props via lazy useState, no reset effect needed.
export function EmployeeFormModal(props: EmployeeFormModalProps) {
  const { isOpen, onClose } = props;
  const [name, setName] = useState(() =>
    props.mode === "edit" ? props.employee.name : "",
  );
  const [email, setEmail] = useState(() =>
    props.mode === "edit" ? props.employee.email : "",
  );
  const [password, setPassword] = useState("");
  const [locationId, setLocationId] = useState(() =>
    props.mode === "edit" ? props.employee.locationId : "",
  );
  const [departmentId, setDepartmentId] = useState(() =>
    props.mode === "edit" ? props.employee.departmentId : "",
  );
  const [roleId, setRoleId] = useState(() =>
    props.mode === "edit" ? props.employee.roleId : "",
  );
  const [managerId, setManagerId] = useState<string | null>(() =>
    props.mode === "edit" ? props.employee.managerId : null,
  );
  const [hrId, setHrId] = useState<string | null>(() =>
    props.mode === "edit" ? props.employee.hrId : null,
  );

  const createMutation = useCreateEmployeeMutation();
  const updateMutation = useUpdateEmployeeMutation(
    props.mode === "edit" ? props.employee.id : "",
  );
  const mutation = props.mode === "create" ? createMutation : updateMutation;

  const errorCode = getApiErrorCode(mutation.error);
  const errorMessage = getApiErrorMessage(mutation.error);

  const nameError =
    errorCode === "VALIDATION_ERROR" && !name.trim() ? "Name is required." : null;
  const emailError =
    errorCode === "DUPLICATE_EMAIL"
      ? "This email is already in use."
      : errorCode === "VALIDATION_ERROR" && !email.trim()
        ? "Email is required."
        : null;
  const passwordError =
    props.mode === "create" && errorCode === "VALIDATION_ERROR" && !password.trim()
      ? "Password is required."
      : null;
  const locationError =
    errorCode === "VALIDATION_ERROR" && !locationId ? "Location is required." : null;
  const departmentError =
    errorCode === "VALIDATION_ERROR" && !departmentId
      ? "Department is required."
      : null;
  const roleError =
    errorCode === "VALIDATION_ERROR" && !roleId ? "Role is required." : null;
  const managerError = errorCode === "MANAGER_REQUIRED" ? "Manager is required." : null;
  const hrError = errorCode === "HR_REQUIRED" ? "HR is required." : null;

  // Any error code without a field match above (MAPPING_NOT_ALLOWED,
  // INVALID_MANAGER_ROLE, INVALID_HR_ROLE, MAPPING_SCOPE_MISMATCH,
  // ROLE_NOT_ENABLED_FOR_DEPARTMENT, NOT_FOUND, MANAGER_NOT_FOUND,
  // HR_NOT_FOUND) falls back to this generic banner — these are only
  // reachable via a stale submission, per the plan's Open Questions
  // resolution, since selector options are pre-scoped to prevent them.
  const fieldErrorShown = Boolean(
    nameError ||
      emailError ||
      passwordError ||
      locationError ||
      departmentError ||
      roleError ||
      managerError ||
      hrError,
  );
  const formError = errorMessage && !fieldErrorShown ? errorMessage : null;

  function handleLocationChange(nextLocationId: string) {
    setLocationId(nextLocationId);
    setManagerId(null);
    setHrId(null);
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    setDepartmentId(nextDepartmentId);
    setRoleId("");
    setManagerId(null);
    setHrId(null);
  }

  function handleRoleChange(nextRoleId: string) {
    setRoleId(nextRoleId);
    setManagerId(null);
    setHrId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (props.mode === "create") {
      createMutation.mutate(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          locationId,
          departmentId,
          roleId,
          managerId,
          hrId,
        },
        { onSuccess: () => onClose() },
      );
      return;
    }
    updateMutation.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        locationId,
        departmentId,
        roleId,
        managerId,
        hrId,
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={props.mode === "create" ? "Add Employee" : "Edit Employee"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="employee-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="employee-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          />
          {nameError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {nameError}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="employee-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="employee-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          />
          {emailError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {emailError}
            </p>
          ) : null}
        </div>

        {props.mode === "create" ? (
          <div className="space-y-1">
            <label htmlFor="employee-password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="employee-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
            />
            {passwordError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {passwordError}
              </p>
            ) : null}
          </div>
        ) : null}

        <EmployeeMappingFields
          locationId={locationId}
          departmentId={departmentId}
          roleId={roleId}
          managerId={managerId}
          hrId={hrId}
          onLocationChange={handleLocationChange}
          onDepartmentChange={handleDepartmentChange}
          onRoleChange={handleRoleChange}
          onManagerChange={setManagerId}
          onHrChange={setHrId}
          excludeEmployeeId={props.mode === "edit" ? props.employee.id : undefined}
          errors={{
            locationId: locationError,
            departmentId: departmentError,
            roleId: roleError,
            managerId: managerError,
            hrId: hrError,
          }}
        />

        {formError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
