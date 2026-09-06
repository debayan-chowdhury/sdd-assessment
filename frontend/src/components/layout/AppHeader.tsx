"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/auth.store";

const linkClasses = "text-zinc-900 underline hover:no-underline dark:text-zinc-50";

export function AppHeader() {
  const employee = useAuthStore((state) => state.employee);
  const clearSession = useAuthStore((state) => state.clearSession);

  if (!employee) return null;

  const hasApprovalsAccess = employee.roleCategory !== null;
  // Current Manager/Current HR act on other people's transfer requests, not
  // their own — hide the self-service "Transfer Request" nav entry for those
  // two roles so it doesn't read as if it's part of their job here.
  const hasOwnTransferRequestAccess = employee.roleCategory !== "HR" && employee.roleCategory !== "Manager";

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">One-Point Employee Portal</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className={linkClasses}>
            Dashboard
          </Link>
          {hasOwnTransferRequestAccess && (
            <Link href="/transfer-request" className={linkClasses}>
              Transfer Request
            </Link>
          )}
          {hasApprovalsAccess && (
            <Link href="/approvals" className={linkClasses}>
              Approvals
            </Link>
          )}
        </nav>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/profile" className="text-zinc-600 hover:underline dark:text-zinc-400">
          {employee.name}
        </Link>
        <Link href="/change-password" className={linkClasses}>
          Change password
        </Link>
        {/* Clearing the session is enough — AuthGuard reactively redirects to
            /login the moment the store's token goes null, same as the 401
            interceptor in lib/axios.ts. */}
        <button type="button" onClick={() => clearSession()} className={linkClasses}>
          Log out
        </button>
      </nav>
    </header>
  );
}
