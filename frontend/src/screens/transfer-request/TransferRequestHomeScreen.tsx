"use client";

import Link from "next/link";
import { useProfile } from "@/features/auth/auth.queries";
import { useMyTransferRequests } from "@/features/transfer-request/transfer-request.queries";
import { ProfileHeaderCard } from "@/components/layout/ProfileHeaderCard";
import { TransferRequestSummaryCard } from "@/screens/transfer-request/components/TransferRequestSummaryCard";
import { NewTransferRequestScreen } from "@/screens/transfer-request/NewTransferRequestScreen";

const TERMINAL_STATUSES = new Set(["Rejected", "Completed"]);

export function TransferRequestHomeScreen() {
  const { data: profile } = useProfile();
  const { data: requests, isLoading } = useMyTransferRequests();

  if (!profile) return null;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center px-4 text-sm text-zinc-500">Loading…</div>;
  }

  const allRequests = requests ?? [];
  const activeRequest = allRequests.find((request) => !TERMINAL_STATUSES.has(request.status));
  // Newest-first from the API, so this is the most recent request even when
  // every request (including it) is terminal — still worth showing rather
  // than nothing, alongside the new-request form.
  const mostRecentRequest = activeRequest ?? allRequests[0];

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
        <ProfileHeaderCard
          name={profile.name}
          email={profile.email}
          roleName={profile.roleName ?? "—"}
          roleCategory={profile.roleCategory}
          departmentName={profile.departmentName ?? "—"}
          locationName={profile.locationName ?? "—"}
        />

        {mostRecentRequest && (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Your transfer request</h2>
            <TransferRequestSummaryCard request={mostRecentRequest} />
          </section>
        )}

        {!activeRequest && <NewTransferRequestScreen />}

        <Link
          href="/transfer-request/history"
          className="group mx-auto inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View request history
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
