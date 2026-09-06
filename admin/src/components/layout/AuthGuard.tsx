"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/auth.store";

const LOGIN_PATH = "/login";
const DEFAULT_AUTHENTICATED_PATH = "/";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoginPath = pathname === LOGIN_PATH;

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated && !isLoginPath) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (isAuthenticated && isLoginPath) {
      router.replace(DEFAULT_AUTHENTICATED_PATH);
    }
  }, [hasHydrated, isAuthenticated, isLoginPath, router]);

  if (!hasHydrated) return null;
  if (!isAuthenticated && !isLoginPath) return null;
  if (isAuthenticated && isLoginPath) return null;

  return children;
}
