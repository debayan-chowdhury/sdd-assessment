import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminProfile } from "@/types/auth";

type AuthState = {
  token: string | null;
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (token: string, admin: AdminProfile) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: (token, admin) =>
        set({ token, admin, isAuthenticated: true }),
      logout: () => set({ token: null, admin: null, isAuthenticated: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
