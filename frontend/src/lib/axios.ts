import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export function attachBearerToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

export function handleUnauthorizedResponse(error: unknown) {
  if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 401) {
    // Clearing the session is enough — AuthGuard is mounted app-wide and
    // reactively redirects to /login the moment the store's token goes
    // null, so no direct navigation is needed here.
    useAuthStore.getState().clearSession();
  }
  return Promise.reject(error);
}

api.interceptors.request.use(attachBearerToken);
api.interceptors.response.use((response) => response, handleUnauthorizedResponse);
