"use client";

import Link from "next/link";
import { useProfile } from "@/features/auth/auth.queries";
import {
  useCurrentHrQueue,
  useCurrentManagerQueue,
  useFacilitiesWorklist,
  useItWorklist,
  useMyTransferRequests,
  usePayrollWorklist,
  useReceivingHrFulfillmentQueue,
  useReceivingHrGateQueue,
  useReceivingHrHoldQueue,
  useReceivingManagerQueue,
} from "@/features/transfer-request/transfer-request.queries";
import { EmployeeProfileSummary } from "@/components/layout/EmployeeProfileSummary";
import { TransferRequestSummaryCard } from "@/screens/transfer-request/components/TransferRequestSummaryCard";
import { Button } from "@/components/ui/Button";

export function DashboardScreen() {
  const { data: profile } = useProfile();
  const myRequests = useMyTransferRequests();

  const isManager = profile?.roleCategory === "Manager";
  const isHr = profile?.roleCategory === "HR";
  const isPayroll = profile?.roleCategory === "Payroll";
  const isIt = profile?.roleCategory === "IT";
  const isFacilities = profile?.roleCategory === "Facilities";

  const currentManagerQueue = useCurrentManagerQueue(isManager);
  const receivingManagerQueue = useReceivingManagerQueue(isManager);
  const currentHrQueue = useCurrentHrQueue(isHr);
  const receivingHrGateQueue = useReceivingHrGateQueue(isHr);
  const receivingHrFulfillmentQueue = useReceivingHrFulfillmentQueue(isHr);
  const receivingHrHoldQueue = useReceivingHrHoldQueue(isHr);
  // Payroll/IT/Facilities' pending-list endpoints 403 for anyone outside that
  // roleCategory — enabling them only when relevant avoids firing a request
  // that's guaranteed to fail for every other role.
  const payrollWorklist = usePayrollWorklist(isPayroll);
  const itWorklist = useItWorklist(isIt);
  const facilitiesWorklist = useFacilitiesWorklist(isFacilities);

  if (!profile) return null;

  const requests = myRequests.data ?? [];
  const activeRequest = requests.find((r) => r.status !== "Rejected" && r.status !== "Completed") ?? requests[0];

  const hasApproverQueues = isManager || isHr || isPayroll || isIt || isFacilities;
  const queueRows = [
    isManager && { label: "Current Manager approvals", count: currentManagerQueue.data?.length ?? 0 },
    isManager && { label: "Receiving Manager approvals", count: receivingManagerQueue.data?.length ?? 0 },
    isHr && { label: "Current HR approvals", count: currentHrQueue.data?.length ?? 0 },
    isHr && { label: "Receiving HR — approval gate", count: receivingHrGateQueue.data?.length ?? 0 },
    isHr && { label: "Receiving HR — fulfillment", count: receivingHrFulfillmentQueue.data?.length ?? 0 },
    isHr && { label: "Receiving HR — on hold", count: receivingHrHoldQueue.data?.length ?? 0 },
    isPayroll && { label: "Payroll worklist", count: payrollWorklist.data?.length ?? 0 },
    isIt && { label: "IT worklist", count: itWorklist.data?.length ?? 0 },
    isFacilities && { label: "Facilities worklist", count: facilitiesWorklist.data?.length ?? 0 },
  ].filter((row): row is { label: string; count: number } => Boolean(row));
  const activeQueueRows = queueRows.filter((row) => row.count > 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome, {profile.name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.email}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your profile</h2>
        <EmployeeProfileSummary
          roleName={profile.roleName ?? "—"}
          roleCategory={profile.roleCategory}
          departmentName={profile.departmentName ?? "—"}
          locationName={profile.locationName ?? "—"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your transfer request</h2>
        {myRequests.isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : activeRequest ? (
          <TransferRequestSummaryCard request={activeRequest} />
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">You have no transfer request on file.</p>
            <Link href="/transfer-request/new">
              <Button type="button">Start a new transfer request</Button>
            </Link>
          </div>
        )}
      </section>

      {hasApproverQueues && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your queues</h2>
          {activeQueueRows.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing pending in your queues right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeQueueRows.map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">{row.label}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {row.count} pending
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/approvals" className="text-sm text-zinc-900 underline hover:no-underline dark:text-zinc-50">
            Go to your approvals inbox
          </Link>
        </section>
      )}
    </div>
  );
}
