import type { RoleCategory } from "@/types/employee";

// "Current" vs "Receiving" Manager/HR is resolved per-request, not at login
// time (see portal-login-password-change.spec.md AC9) — this mapping is
// deliberately coarse: every role beyond plain Employee lands on the shared
// approvals inbox, which itself resolves what that role can act on.
export function roleLandingPath(roleCategory: RoleCategory): string {
  if (roleCategory === null) {
    return "/transfer-request";
  }
  return "/approvals";
}
