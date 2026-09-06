import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

export function useProfile() {
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: fetchProfile,
    enabled: isLoggedIn,
  });
}
