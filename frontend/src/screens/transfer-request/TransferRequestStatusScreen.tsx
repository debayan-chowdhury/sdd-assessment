"use client";

import Link from "next/link";
import { useTransferRequest } from "@/features/transfer-request/transfer-request.queries";
import { apiStatus } from "@/lib/apiError";
import { TransferRequestSummaryCard } from "@/screens/transfer-request/components/TransferRequestSummaryCard";

export function TransferRequestStatusScreen({ id }: { id: string }) {
  const { data: request, isLoading, error } = useTransferRequest(id);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center px-4 text-sm text-zinc-500">Loading…</div>;
  }

  // The backend returns 403 for "exists but isn't yours" and 404 for
  // "doesn't exist" — this screen deliberately doesn't distinguish them,
  // matching the backend's own choice not to leak which applies (spec AC13).
  if (error || !request) {
    const status = apiStatus(error);
    if (status === 403 || status === 404 || !request) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Request not found.</p>
          <Link
            href="/transfer-request"
            className="text-sm font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
          >
            Back to your transfer request
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-red-600 dark:text-red-400">
        Something went wrong loading this request.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Transfer request</h1>
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

        <TransferRequestSummaryCard request={request} showFooterLink={false} />
      </div>
    </div>
  );
}
