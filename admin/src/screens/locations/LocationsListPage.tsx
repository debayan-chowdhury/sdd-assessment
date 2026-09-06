"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationsQuery } from "@/features/locations/locations.queries";
import { LocationTable } from "./components/LocationTable";
import { LocationFormModal } from "./components/LocationFormModal";

export function LocationsListPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  const locationsQuery = useLocationsQuery(activeOnly ? { isActive: true } : {});

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Locations</h1>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add Location
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activeOnly}
          onChange={(event) => setActiveOnly(event.target.checked)}
        />
        Active only
      </label>

      {locationsQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : locationsQuery.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Failed to load locations.
        </p>
      ) : (
        <LocationTable
          locations={locationsQuery.data ?? []}
          onRowClick={(location) => router.push(`/locations/${location.id}`)}
        />
      )}

      <LocationFormModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
      />
    </main>
  );
}
