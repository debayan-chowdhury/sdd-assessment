import { api } from "@/lib/axios";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/admin/login",
    payload,
  );
  return response.data;
}
