"use client";

import { useCandidateManagers } from "@/features/transfer-request/transfer-request.queries";
import { SelectField } from "@/components/ui/Select";

type ManagerPickerProps = {
  locationId: string;
  departmentId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function ManagerPicker({ locationId, departmentId, value, onChange, error }: ManagerPickerProps) {
  const { data, isLoading } = useCandidateManagers(locationId, departmentId);

  return (
    <SelectField
      label="Receiving Manager"
      value={value}
      onChange={onChange}
      options={data ?? []}
      error={error}
      placeholder={isLoading ? "Loading managers…" : "Select a manager"}
    />
  );
}
