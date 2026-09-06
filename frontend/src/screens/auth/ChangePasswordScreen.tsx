"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/features/auth/auth.mutations";
import { useAuthStore } from "@/features/auth/auth.store";
import { roleLandingPath } from "@/features/auth/roleLanding";
import { apiErrorCode } from "@/lib/apiError";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export function ChangePasswordScreen() {
  const router = useRouter();
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const changePasswordMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ currentPassword?: string; newPassword?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);

    const errors: { currentPassword?: string; newPassword?: string } = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setSuccessMessage("Password updated.");
          setCurrentPassword("");
          setNewPassword("");
          router.replace(roleLandingPath(roleCategory));
        },
        onError: (error) => {
          const code = apiErrorCode(error);
          if (code === "INVALID_CURRENT_PASSWORD") {
            setFieldErrors((prev) => ({ ...prev, currentPassword: "Current password is incorrect." }));
            return;
          }
          setFieldErrors({});
          setSuccessMessage(null);
        },
      }
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Change password</h1>

        <TextField
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={fieldErrors.currentPassword}
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={fieldErrors.newPassword}
          autoComplete="new-password"
        />

        {successMessage && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </p>
        )}

        <Button type="submit" loading={changePasswordMutation.isPending}>
          Update password
        </Button>
      </form>
    </div>
  );
}
