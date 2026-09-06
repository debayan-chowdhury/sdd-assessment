"use client";

import Link from "next/link";
import { useMyTransferRequests } from "@/features/transfer-request/transfer-request.queries";
import { TransferRequestSummaryCard } from "@/screens/transfer-request/components/TransferRequestSummaryCard";

export function TransferRequestHistoryScreen() {
  const { data: requests, isLoading } = useMyTransferRequests();

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Transfer request history</h1>
          <Link
            href="/transfer-request"
            className="group inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            Back
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : requests && requests.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {requests.map((request) => (
              <li key={request.id}>
                <TransferRequestSummaryCard request={request} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You haven&apos;t submitted any transfer requests yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
