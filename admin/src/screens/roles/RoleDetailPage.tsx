"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleQuery } from "@/features/roles/roles.queries";
import {
  useDeleteRoleMutation,
  useSetRoleStatusMutation,
} from "@/features/roles/roles.mutations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import { RoleFormModal } from "./components/RoleFormModal";

type RoleDetailPageProps = {
  roleId: string;
};

export function RoleDetailPage({ roleId }: RoleDetailPageProps) {
  const router = useRouter();
  const roleQuery = useRoleQuery(roleId);
  const statusMutation = useSetRoleStatusMutation(roleId);
  const deleteMutation = useDeleteRoleMutation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const role = roleQuery.data;

  const statusErrorCode = getApiErrorCode(statusMutation.error);
  const statusErrorMessage =
    statusErrorCode === "ROLE_HAS_ACTIVE_EMPLOYEES"
      ? "This role has active employees holding it and cannot be deactivated."
      : getApiErrorMessage(statusMutation.error);

  const deleteErrorCode = getApiErrorCode(deleteMutation.error);
  const deleteErrorMessage =
    deleteErrorCode === "ROLE_HAS_EMPLOYEES"
      ? "This role has employees holding it and cannot be deleted."
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
    deleteMutation.mutate(roleId, {
      onSuccess: () => router.push("/roles"),
      onSettled: () => setIsDeleteConfirmOpen(false),
    });
  }

  if (roleQuery.isLoading) {
    return <p className="p-6 text-sm text-zinc-500">Loading…</p>;
  }

  if (roleQuery.isError || !role) {
    return (
      <p role="alert" className="p-6 text-sm text-red-600 dark:text-red-400">
        Role not found.
      </p>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <button
        type="button"
        onClick={() => router.push("/roles")}
        className="mb-4 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to Roles
      </button>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{role.name}</h1>
          <StatusBadge isActive={role.isActive} />
          <CategoryBadge category={role.category} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
          >
            Edit
          </button>
          {role.isActive ? (
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
        <dt className="text-zinc-500">Code</dt>
        <dd>{role.code}</dd>
        <dt className="text-zinc-500">Category</dt>
        <dd>{role.category ?? "None"}</dd>
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

      <RoleFormModal
        key={isEditOpen ? "edit-open" : "edit-closed"}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        role={role}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Deactivate Role"
        message={`Are you sure you want to deactivate "${role.name}"?`}
        confirmLabel="Deactivate"
        isConfirming={statusMutation.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Role"
        message={`Are you sure you want to permanently delete "${role.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </main>
  );
}
