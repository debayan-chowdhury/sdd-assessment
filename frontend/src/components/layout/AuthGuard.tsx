"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";

const PUBLIC_PATHS = new Set(["/login"]);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const mustChangePassword = useAuthStore((state) => state.employee?.mustChangePassword ?? false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token && !PUBLIC_PATHS.has(pathname)) {
      router.replace("/login");
      return;
    }

    if (token && mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [hasHydrated, token, mustChangePassword, pathname, router]);

  // Public paths (e.g. /login) render immediately, without waiting for the
  // persisted store to hydrate — there's no protected content to guard
  // there, and blanking the login page until hydration completes would
  // just be a needless flash of empty page for every visitor.
  if (!hasHydrated && !PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  if (!token && !PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  if (token && mustChangePassword && pathname !== "/change-password") {
    return null;
  }

  return <>{children}</>;
}
