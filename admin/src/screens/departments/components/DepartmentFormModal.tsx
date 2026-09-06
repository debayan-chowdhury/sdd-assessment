"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "@/features/departments/departments.mutations";
import type { Department } from "@/types/department";

type DepartmentFormModalProps =
  | { isOpen: boolean; onClose: () => void; mode: "create"; department?: undefined }
  | { isOpen: boolean; onClose: () => void; mode: "edit"; department: Department };

// Keyed by the parent on open/close (see DepartmentsListPage /
// DepartmentDetailPage) so each open is a fresh mount — initial field values
// come straight from props via lazy useState, no reset effect needed.
export function DepartmentFormModal(props: DepartmentFormModalProps) {
  const { isOpen, onClose } = props;
  const [name, setName] = useState(() =>
    props.mode === "edit" ? props.department.name : "",
  );
  const [code, setCode] = useState(() =>
    props.mode === "edit" ? props.department.code : "",
  );

  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation(
    props.mode === "edit" ? props.department.id : "",
  );
  const mutation = props.mode === "create" ? createMutation : updateMutation;

  const errorCode = getApiErrorCode(mutation.error);
  const errorMessage = getApiErrorMessage(mutation.error);
  const nameError =
    errorCode === "VALIDATION_ERROR" && !name.trim() ? "Name is required." : null;
  const codeError =
    errorCode === "DUPLICATE_CODE"
      ? "This code is already in use."
      : errorCode === "VALIDATION_ERROR" && !code.trim()
        ? "Code is required."
        : null;
  const formError = errorMessage && !nameError && !codeError ? errorMessage : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(
      { name: name.trim(), code: code.trim() },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={props.mode === "create" ? "Add Department" : "Edit Department"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="department-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="department-name"
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
          <label htmlFor="department-code" className="text-sm font-medium">
            Code
          </label>
          <input
            id="department-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          />
          {codeError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {codeError}
            </p>
          ) : null}
        </div>

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
