"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "@/features/roles/roles.mutations";
import type { Role, RoleCategory } from "@/types/role";

type RoleFormModalProps =
  | { isOpen: boolean; onClose: () => void; mode: "create"; role?: undefined }
  | { isOpen: boolean; onClose: () => void; mode: "edit"; role: Role };

const CATEGORY_OPTIONS: { value: "None" | "HR" | "Manager"; label: string }[] = [
  { value: "None", label: "None" },
  { value: "HR", label: "HR" },
  { value: "Manager", label: "Manager" },
];

function toCategoryValue(category: RoleCategory): "None" | "HR" | "Manager" {
  return category ?? "None";
}

function toCategory(value: "None" | "HR" | "Manager"): RoleCategory {
  return value === "None" ? null : value;
}

// Keyed by the parent on open/close (see RolesListPage / RoleDetailPage) so
// each open is a fresh mount — initial field values come straight from
// props via lazy useState, no reset effect needed.
export function RoleFormModal(props: RoleFormModalProps) {
  const { isOpen, onClose } = props;
  const [name, setName] = useState(() =>
    props.mode === "edit" ? props.role.name : "",
  );
  const [code, setCode] = useState(() =>
    props.mode === "edit" ? props.role.code : "",
  );
  const [category, setCategory] = useState<"None" | "HR" | "Manager">(() =>
    props.mode === "edit" ? toCategoryValue(props.role.category) : "None",
  );

  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation(
    props.mode === "edit" ? props.role.id : "",
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
      { name: name.trim(), code: code.trim(), category: toCategory(category) },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={props.mode === "create" ? "Add Role" : "Edit Role"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="role-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="role-name"
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
          <label htmlFor="role-code" className="text-sm font-medium">
            Code
          </label>
          <input
            id="role-code"
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

        <div className="space-y-1">
          <label htmlFor="role-category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="role-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as "None" | "HR" | "Manager")
            }
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
