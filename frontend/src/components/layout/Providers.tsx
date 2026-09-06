"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queryClient";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader />
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  );
}
