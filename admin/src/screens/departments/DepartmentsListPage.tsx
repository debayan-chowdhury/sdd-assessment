"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDepartmentsQuery } from "@/features/departments/departments.queries";
import { DepartmentTable } from "./components/DepartmentTable";
import { DepartmentFormModal } from "./components/DepartmentFormModal";

export function DepartmentsListPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  const departmentsQuery = useDepartmentsQuery(
    activeOnly ? { isActive: true } : {},
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Departments</h1>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add Department
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

      {departmentsQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : departmentsQuery.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Failed to load departments.
        </p>
      ) : (
        <DepartmentTable
          departments={departmentsQuery.data ?? []}
          onRowClick={(department) => router.push(`/departments/${department.id}`)}
        />
      )}

      <DepartmentFormModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
      />
    </main>
  );
}
