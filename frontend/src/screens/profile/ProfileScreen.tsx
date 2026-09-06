"use client";

import Link from "next/link";
import { useProfile } from "@/features/auth/auth.queries";
import { ProfileHeaderCard } from "@/components/layout/ProfileHeaderCard";
import { InfoStat } from "@/components/ui/InfoStat";

export function ProfileScreen() {
  const { data: profile } = useProfile();

  if (!profile) return null;

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
        >
          {/* A Manager/HR-category employee legitimately has no
              managerId/hrId of their own (employee-crud-mapping's own
              mapping rules) — shown as "—" rather than omitted, so this
              section is never a silent gap. */}
          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Reporting line
            </h2>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <InfoStat label="Current Manager" value={profile.managerName ?? "—"} />
              <InfoStat label="Current HR" value={profile.hrName ?? "—"} />
            </dl>
          </div>
        </ProfileHeaderCard>

        <Link
          href="/change-password"
          className="group mx-auto inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Change password
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
