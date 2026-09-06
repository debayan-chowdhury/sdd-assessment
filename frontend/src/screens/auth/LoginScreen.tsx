"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorCode, apiStatus } from "@/lib/apiError";
import { useLoginMutation } from "@/features/auth/auth.mutations";
import { roleLandingPath } from "@/features/auth/roleLanding";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: ({ employee }) => {
          if (employee.mustChangePassword) {
            router.replace("/change-password");
          } else {
            router.replace(roleLandingPath(employee.roleCategory));
          }
        },
        onError: (error) => {
          const status = apiStatus(error);
          const code = apiErrorCode(error);
          if (status === 401 || code === "INVALID_CREDENTIALS") {
            setFormError("Incorrect email or password.");
            return;
          }
          if (status === 403 || code === "ACCOUNT_INACTIVE") {
            setFormError("This account is inactive. Contact your administrator.");
            return;
          }
          setFormError("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoComplete="username"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        {formError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}

        <Button type="submit" loading={loginMutation.isPending}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
