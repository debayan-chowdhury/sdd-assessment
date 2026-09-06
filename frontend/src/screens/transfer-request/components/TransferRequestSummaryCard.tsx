import Link from "next/link";
import { useProfile } from "@/features/auth/auth.queries";
import { InfoStat } from "@/components/ui/InfoStat";
import { StatusBadge } from "@/screens/transfer-request/components/StatusBadge";
import { SubStatusList } from "@/screens/transfer-request/components/SubStatusList";
import { RejectionBanner } from "@/screens/transfer-request/components/RejectionBanner";
import { HoldBanner } from "@/screens/transfer-request/components/HoldBanner";
import { EscalationIndicator } from "@/screens/transfer-request/components/EscalationIndicator";
import type { TransferRequest, TransferRequestStatus } from "@/types/transferRequest";

// The backend only tracks one `status` enum per request, not a per-stage
// record — this reconstructs a per-role view of it for display by walking a
// fixed happy-path stage order and comparing each stage's index to the
// request's current status. Branch statuses (Hold / Rejected / Pending
// Receiving HR Reassignment) fall outside this order entirely and are shown
// as their own banner instead of a stepper position.
const STAGE_ORDER: TransferRequestStatus[] = [
  "Pending Current Manager Approval",
  "Pending Current HR Approval",
  "Pending Receiving HR Approval",
  "Pending Receiving Manager Approval",
  "Pending Fulfillment Trigger",
  "Pending Fulfillment",
  "Completed",
];

const STAGE_LABELS: Record<string, string> = {
  "Pending Current Manager Approval": "Current Manager",
  "Pending Current HR Approval": "Current HR",
  "Pending Receiving HR Approval": "Receiving HR",
  "Pending Receiving Manager Approval": "Receiving Manager",
  "Pending Fulfillment Trigger": "Receiving HR — trigger fulfillment",
  "Pending Fulfillment": "Payroll / IT / Facilities",
  Completed: "Completed",
};

type StageState = "done" | "current" | "upcoming";

function stageState(request: TransferRequest, stage: TransferRequestStatus): StageState {
  const currentIndex = STAGE_ORDER.indexOf(request.status);
  const stageIndex = STAGE_ORDER.indexOf(stage);
  if (currentIndex === -1 || stageIndex === -1) return "upcoming";
  if (stageIndex < currentIndex) return "done";
  if (stageIndex === currentIndex) return request.status === "Completed" ? "done" : "current";
  return "upcoming";
}

const STAGE_DOT_CLASSES: Record<StageState, string> = {
  done: "bg-emerald-500",
  current: "bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950",
  upcoming: "bg-zinc-300 dark:bg-zinc-700",
};

const STAGE_BADGE_CLASSES: Record<StageState, string> = {
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  current: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  upcoming: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

const STAGE_BADGE_TEXT: Record<StageState, string> = {
  done: "Approved",
  current: "In progress",
  upcoming: "Not yet reached",
};

function RoleStageStepper({ request }: { request: TransferRequest }) {
  return (
    <ol className="flex flex-col">
      {STAGE_ORDER.map((stage, index) => {
        const state = stageState(request, stage);
        const isLast = index === STAGE_ORDER.length - 1;
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_DOT_CLASSES[state]}`} />
              {!isLast && <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 pb-4 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{STAGE_LABELS[stage]}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_CLASSES[state]}`}
              >
                {STAGE_BADGE_TEXT[state]}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type TransferRequestSummaryCardProps = {
  request: TransferRequest;
  /** Hide the "View full status" link — pass false when this card is
   * already rendered on that request's own detail page. */
  showFooterLink?: boolean;
};

export function TransferRequestSummaryCard({ request, showFooterLink = true }: TransferRequestSummaryCardProps) {
  const isBranchStatus =
    request.status === "Hold" ||
    request.status === "Rejected" ||
    request.status === "Pending Receiving HR Reassignment";

  // The employee's live reporting line comes from /auth/profile, not
  // request.currentManagerName/currentHrName (a submission-time snapshot) —
  // this card only ever shows who currently manages them, same across every
  // request card for this viewer.
  const { data: profile } = useProfile();

  // Receiving HR has accepted (receivingManagerId set) but the Employee's own
  // Location/Department/Role/Manager/HR are deferred until effectiveDate —
  // see the backend's receiving-hr-transfer-gatekeeping.spec.md amendment.
  const orgChangePending = Boolean(request.receivingManagerId) && !request.orgDataAppliedAt;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          {request.escalated && <EscalationIndicator />}
        </div>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Effective {request.effectiveDate}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <InfoStat label="Current Manager" value={profile?.managerName ?? "—"} />
        <InfoStat label="Current HR" value={profile?.hrName ?? "—"} />
        {/* Once orgDataAppliedAt is set, Receiving Manager/HR are by
            definition the same people as Current Manager/HR above (that's
            what "applied" means) — showing both is redundant/confusing, so
            these only appear while the change is still pending. */}
        {!request.orgDataAppliedAt && (
          <>
            <InfoStat label="Receiving Manager" value={request.receivingManagerName ?? "—"} />
            <InfoStat label="Receiving HR" value={request.receivingHrName ?? "—"} />
          </>
        )}
      </dl>

      {request.reason && (
        <div>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Reason
          </h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{request.reason}</p>
        </div>
      )}

      {orgChangePending && (
        <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Your location, department, role, manager, and HR will update automatically on your effective date (
          {request.effectiveDate}). Until then, your profile still shows your current details.
        </p>
      )}

      {request.status === "Rejected" && <RejectionBanner reason={request.rejectionReason} />}
      {request.status === "Hold" && <HoldBanner reason={request.holdReason} />}
      {request.status === "Pending Receiving HR Reassignment" && (
        <p className="rounded-lg bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          Receiving HR is selecting a new candidate Receiving Manager for your request.
        </p>
      )}

      {!isBranchStatus && (
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Approval progress
          </h3>
          <RoleStageStepper request={request} />
        </div>
      )}

      <SubStatusList
        payrollStatus={request.payrollStatus}
        itStatus={request.itStatus}
        facilitiesStatus={request.facilitiesStatus}
      />

      {showFooterLink && (
        <Link
          href={`/transfer-request/${request.id}`}
          className="group inline-flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          View full status
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
