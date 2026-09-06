"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRolesQuery } from "@/features/roles/roles.queries";
import type { RoleFilters } from "@/features/roles/roles.api";
import { RoleTable } from "./components/RoleTable";
import { RoleFormModal } from "./components/RoleFormModal";

const CATEGORY_OPTIONS: { value: "" | "HR" | "Manager"; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "HR", label: "HR" },
  { value: "Manager", label: "Manager" },
];

export function RolesListPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [category, setCategory] = useState<"" | "HR" | "Manager">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  const filters: RoleFilters = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(category ? { category } : {}),
  };
  const rolesQuery = useRolesQuery(filters);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Roles</h1>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add Role
        </button>
      </div>

      <div className="mb-3 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active only
        </label>

        <label className="flex items-center gap-2 text-sm">
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as "" | "HR" | "Manager")
            }
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/15"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rolesQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : rolesQuery.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Failed to load roles.
        </p>
      ) : (
        <RoleTable
          roles={rolesQuery.data ?? []}
          onRowClick={(role) => router.push(`/roles/${role.id}`)}
        />
      )}

      <RoleFormModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
      />
    </main>
  );
}
