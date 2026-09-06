import { useMutation } from "@tanstack/react-query";
import { changePassword, login } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.token, data.employee);
    },
  });
}

export function useChangePasswordMutation() {
  const setMustChangePassword = useAuthStore((state) => state.setMustChangePassword);

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setMustChangePassword(false);
    },
  });
}
