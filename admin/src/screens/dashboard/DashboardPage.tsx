"use client";

import Link from "next/link";
import { useTriggerDueOrgUpdatesMutation } from "@/features/jobs/jobs.mutations";

const NAV_ITEMS = [
  {
    href: "/locations",
    label: "Locations",
    description: "Manage locations and their mapped departments.",
  },
  {
    href: "/departments",
    label: "Departments",
    description: "Manage departments and their enabled roles.",
  },
  {
    href: "/roles",
    label: "Roles",
    description: "Manage the global role list.",
  },
  {
    href: "/employees",
    label: "Employees",
    description: "Manage employees and their location/department/role mapping.",
  },
];

export function DashboardPage() {
  const triggerMutation = useTriggerDueOrgUpdatesMutation();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <h1 className="mb-6 text-lg font-semibold">Admin Panel</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
          >
            <h2 className="text-sm font-semibold">{item.label}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <h2 className="text-sm font-semibold">Transfer org-data sync</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Accepted transfers update the employee&apos;s location/department/role/manager/HR
          automatically on their effective date (a background job runs every 15 minutes).
          Use this to apply any due updates right now instead of waiting.
        </p>
        <button
          type="button"
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="mt-3 rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {triggerMutation.isPending ? "Running…" : "Run now"}
        </button>
        {triggerMutation.isSuccess && (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            {triggerMutation.data.appliedCount === 0
              ? "No updates were due."
              : `Applied ${triggerMutation.data.appliedCount} update${triggerMutation.data.appliedCount === 1 ? "" : "s"}.`}
          </p>
        )}
        {triggerMutation.isError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </main>
  );
}
