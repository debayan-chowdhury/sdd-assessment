import { useMutation } from "@tanstack/react-query";
import { login } from "./auth.api";
import { useAuthStore } from "./auth.store";

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.token, data.admin);
    },
  });
}
