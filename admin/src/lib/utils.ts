import { isAxiosError } from "axios";
import type { ApiErrorBody } from "@/types/auth";

export function getApiErrorCode(error: unknown): string | null {
  if (isAxiosError<ApiErrorBody>(error) && error.response?.data?.error) {
    return error.response.data.error.code;
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string | null {
  if (isAxiosError<ApiErrorBody>(error) && error.response?.data?.error) {
    return error.response.data.error.message;
  }
  if (error) return "Something went wrong. Please try again.";
  return null;
}
