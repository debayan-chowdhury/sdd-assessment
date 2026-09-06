import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Employee } from "@/types/employee";

type AuthState = {
  token: string | null;
  employee: Employee | null;
  hasHydrated: boolean;
  setSession: (token: string, employee: Employee) => void;
  clearSession: () => void;
  setMustChangePassword: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
};

// JWT is stored in localStorage (constitution.md — Security Posture), accepting
// XSS-readable-token exposure as a deliberate current-phase trade-off, same as
// the sibling Admin Panel app.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      employee: null,
      hasHydrated: false,
      setSession: (token, employee) => set({ token, employee }),
      clearSession: () => set({ token: null, employee: null }),
      setMustChangePassword: (value) =>
        set((state) =>
          state.employee ? { employee: { ...state.employee, mustChangePassword: value } } : state
        ),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, employee: state.employee }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
