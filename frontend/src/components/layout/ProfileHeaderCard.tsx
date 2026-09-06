import { initials } from "@/lib/utils";
import { EmployeeProfileSummary } from "@/components/layout/EmployeeProfileSummary";
import type { RoleCategory } from "@/types/employee";

type ProfileHeaderCardProps = {
  name: string;
  email: string;
  roleName: string;
  roleCategory: RoleCategory;
  departmentName: string;
  locationName: string;
  children?: React.ReactNode;
};

export function ProfileHeaderCard({
  name,
  email,
  roleName,
  roleCategory,
  departmentName,
  locationName,
  children,
}: ProfileHeaderCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {initials(name)}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <EmployeeProfileSummary
          roleName={roleName}
          roleCategory={roleCategory}
          departmentName={departmentName}
          locationName={locationName}
        />
      </div>

      {children}
    </div>
  );
}
