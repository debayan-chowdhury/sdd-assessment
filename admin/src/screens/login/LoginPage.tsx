"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useLoginMutation } from "@/features/auth/auth.mutations";
import type { ApiErrorBody } from "@/types/auth";

function extractErrorMessage(error: unknown): string | null {
  if (isAxiosError<ApiErrorBody>(error) && error.response?.data?.error) {
    return error.response.data.error.message;
  }
  if (error) return "Something went wrong. Please try again.";
  return null;
}

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  const errorMessage = extractErrorMessage(loginMutation.error);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-lg font-semibold">Admin Login</h1>

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          />
        </div>

        {errorMessage ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
