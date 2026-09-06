"use client";

import { useAuthStore } from "@/features/auth/auth.store";
import { CurrentManagerQueue } from "@/screens/approvals/CurrentManagerQueue";
import { CurrentHrQueue } from "@/screens/approvals/CurrentHrQueue";
import { ReceivingHrGateQueue } from "@/screens/approvals/ReceivingHrGateQueue";
import { ReceivingHrFulfillmentQueue } from "@/screens/approvals/ReceivingHrFulfillmentQueue";
import { ReceivingHrHoldReopen } from "@/screens/approvals/ReceivingHrHoldReopen";
import { ReceivingManagerQueue } from "@/screens/approvals/ReceivingManagerQueue";
import { PayrollWorklist } from "@/screens/approvals/PayrollWorklist";
import { ItWorklist } from "@/screens/approvals/ItWorklist";
import { FacilitiesWorklist } from "@/screens/approvals/FacilitiesWorklist";

// Every section gates itself to the logged-in user's own roleCategory (an
// assigned Current Manager/Current HR/Receiving HR/Receiving Manager
// necessarily holds that category — the backend's employee-mapping rules
// require it) and renders nothing while loading, so this shell just composes
// them — only the section(s) matching the caller's role show up. A plain
// Employee (roleCategory null) never holds any of these, so this page has
// nothing to show them; the fallback message below covers that case.
export function ApprovalsInboxScreen() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:py-14">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Approvals</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Requests and worklist items waiting on your action.
          </p>
        </div>

        {roleCategory === null ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            You don&apos;t have any approvals to review.
          </p>
        ) : (
          <>
            <CurrentManagerQueue />
            <CurrentHrQueue />
            <ReceivingHrGateQueue />
            <ReceivingManagerQueue />
            <ReceivingHrFulfillmentQueue />
            <ReceivingHrHoldReopen />
            <PayrollWorklist />
            <ItWorklist />
            <FacilitiesWorklist />
          </>
        )}
      </div>
    </div>
  );
}
