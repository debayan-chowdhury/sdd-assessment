type EmployeeProfileSummaryProps = {
  roleName: string;
  roleCategory: string | null;
  departmentName: string;
  locationName: string;
};

export function EmployeeProfileSummary({
  roleName,
  roleCategory,
  departmentName,
  locationName,
}: EmployeeProfileSummaryProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">{roleName}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Category</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">{roleCategory ?? "Employee"}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Department</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">{departmentName}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">{locationName}</dd>
      </div>
    </dl>
  );
}
