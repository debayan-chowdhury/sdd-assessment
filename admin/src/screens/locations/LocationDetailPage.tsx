"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationQuery } from "@/features/locations/locations.queries";
import {
  useDeleteLocationMutation,
  useSetLocationStatusMutation,
} from "@/features/locations/locations.mutations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/utils";
import { LocationFormModal } from "./components/LocationFormModal";
import { LocationDepartmentMappingPanel } from "./components/LocationDepartmentMappingPanel";

type LocationDetailPageProps = {
  locationId: string;
};

export function LocationDetailPage({ locationId }: LocationDetailPageProps) {
  const router = useRouter();
  const locationQuery = useLocationQuery(locationId);
  const statusMutation = useSetLocationStatusMutation(locationId);
  const deleteMutation = useDeleteLocationMutation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const location = locationQuery.data;

  const statusErrorCode = getApiErrorCode(statusMutation.error);
  const statusErrorMessage =
    statusErrorCode === "LOCATION_HAS_ACTIVE_EMPLOYEES"
      ? "This location has active employees mapped to it and cannot be deactivated."
      : getApiErrorMessage(statusMutation.error);

  const deleteErrorCode = getApiErrorCode(deleteMutation.error);
  const deleteErrorMessage =
    deleteErrorCode === "LOCATION_HAS_EMPLOYEES"
      ? "This location has employees mapped to it and cannot be deleted."
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
    deleteMutation.mutate(locationId, {
      onSuccess: () => router.push("/locations"),
      onSettled: () => setIsDeleteConfirmOpen(false),
    });
  }

  if (locationQuery.isLoading) {
    return <p className="p-6 text-sm text-zinc-500">Loading…</p>;
  }

  if (locationQuery.isError || !location) {
    return (
      <p role="alert" className="p-6 text-sm text-red-600 dark:text-red-400">
        Location not found.
      </p>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <button
        type="button"
        onClick={() => router.push("/locations")}
        className="mb-4 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to Locations
      </button>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{location.name}</h1>
          <StatusBadge isActive={location.isActive} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
          >
            Edit
          </button>
          {location.isActive ? (
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
        <dd>{location.code}</dd>
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

      <LocationDepartmentMappingPanel locationId={locationId} />

      <LocationFormModal
        key={isEditOpen ? "edit-open" : "edit-closed"}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        location={location}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Deactivate Location"
        message={`Are you sure you want to deactivate "${location.name}"?`}
        confirmLabel="Deactivate"
        isConfirming={statusMutation.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Location"
        message={`Are you sure you want to permanently delete "${location.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </main>
  );
}
