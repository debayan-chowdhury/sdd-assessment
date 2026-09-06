"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubmitTransferRequest } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestOptions } from "@/features/transfer-request/useTransferRequestOptions";
import { apiErrorCode } from "@/lib/apiError";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const MIN_NOTICE_DAYS = 30;

function minEffectiveDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + MIN_NOTICE_DAYS);
  return date.toISOString().slice(0, 10);
}

export function NewTransferRequestScreen() {
  const router = useRouter();
  const submitMutation = useSubmitTransferRequest();

  const [newLocationId, setNewLocationId] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const reasonId = useId();

  const options = useTransferRequestOptions(newLocationId);
  const minDate = minEffectiveDate();

  function handleLocationChange(value: string) {
    setNewLocationId(value);
    setNewDepartmentId("");
  }

  let departmentPlaceholder: string | undefined;
  if (!newLocationId) {
    departmentPlaceholder = "Select a location first";
  } else if (options.isLoadingDepartments) {
    departmentPlaceholder = "Loading departments…";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage(null);

    const errors: Record<string, string> = {};
    if (!newLocationId) errors.newLocationId = "Location is required.";
    if (!newDepartmentId) errors.newDepartmentId = "Department is required.";
    if (!newRoleId) errors.newRoleId = "Role is required.";
    if (!effectiveDate) {
      errors.effectiveDate = "Effective date is required.";
    } else if (effectiveDate < minDate) {
      errors.effectiveDate = `Effective date must be at least ${MIN_NOTICE_DAYS} days from today.`;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submitMutation.mutate(
      {
        newLocationId,
        newDepartmentId,
        newRoleId,
        effectiveDate,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          router.replace(`/transfer-request/${created.id}`);
        },
        onError: (error) => {
          const code = apiErrorCode(error);
          if (code === "ACTIVE_REQUEST_EXISTS") {
            setFormMessage("You already have an active request — see its status below.");
            return;
          }
          if (code === "NOT_FOUND") {
            setFormMessage("One of your selections is no longer available. Please re-select.");
            options.refetch();
            return;
          }
          if (code === "NO_RECEIVING_HR") {
            setFormMessage("No HR contact is set up yet for that department and location — submission can't proceed there.");
            return;
          }
          if (code === "NO_CHANGE_REQUESTED") {
            setFormMessage("You are already in this location, department, and role. Please change at least one of them to submit a transfer request.");
            return;
          }
          if (code === "ROLE_CATEGORY_NOT_ALLOWED") {
            setFieldErrors((prev) => ({ ...prev, newRoleId: "This role isn't available for self-service transfer requests." }));
            options.refetch();
            return;
          }
          setFormMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">New transfer request</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Requests need a minimum {MIN_NOTICE_DAYS}-day notice period.
          </p>
        </div>

        <SelectField
          label="Location"
          value={newLocationId}
          onChange={handleLocationChange}
          options={options.locations}
          error={fieldErrors.newLocationId}
        />
        <SelectField
          label="Department"
          value={newDepartmentId}
          onChange={setNewDepartmentId}
          options={options.departments}
          error={fieldErrors.newDepartmentId}
          disabled={!newLocationId}
          placeholder={departmentPlaceholder}
        />
        <SelectField
          label="Role"
          value={newRoleId}
          onChange={setNewRoleId}
          options={options.roles}
          error={fieldErrors.newRoleId}
        />

        <TextField
          label="Effective date"
          type="date"
          value={effectiveDate}
          onChange={setEffectiveDate}
          error={fieldErrors.effectiveDate}
          min={minDate}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor={reasonId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Reason (optional)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
          />
        </div>

        {formMessage && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {formMessage}
          </p>
        )}

        <Button type="submit" loading={submitMutation.isPending}>
          Submit request
        </Button>
      </form>
    </div>
  );
}
