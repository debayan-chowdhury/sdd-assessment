import type { FulfillmentSubStatus } from "@/types/transferRequest";

type SubStatusListProps = {
  payrollStatus: FulfillmentSubStatus;
  itStatus: FulfillmentSubStatus;
  facilitiesStatus: FulfillmentSubStatus;
};

const ITEMS: Array<{ key: keyof SubStatusListProps; label: string }> = [
  { key: "payrollStatus", label: "Payroll" },
  { key: "itStatus", label: "IT" },
  { key: "facilitiesStatus", label: "Facilities" },
];

const STATUS_CLASSES: Partial<Record<NonNullable<FulfillmentSubStatus>, string>> = {
  Done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Not Applicable": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};
const DEFAULT_STATUS_CLASSES = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

export function SubStatusList(props: SubStatusListProps) {
  const visible = ITEMS.filter(({ key }) => props[key] !== null);
  if (visible.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-3 text-sm">
      {visible.map(({ key, label }) => {
        const value = props[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}:</dt>
            <dd
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${value ? (STATUS_CLASSES[value] ?? DEFAULT_STATUS_CLASSES) : DEFAULT_STATUS_CLASSES}`}
            >
              {value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
