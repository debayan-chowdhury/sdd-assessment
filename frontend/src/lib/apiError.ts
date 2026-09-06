import axios from "axios";

export type ApiErrorBody = {
  error: {
    message: string;
    code: string;
  };
};

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "object" &&
    (data as { error?: { code?: unknown } }).error !== null &&
    typeof (data as { error: { code?: unknown } }).error.code === "string"
  );
}

/** Returns the backend's `error.code` for a failed request, or null if this
 * wasn't an axios error with that shape (network error, unexpected body). */
export function apiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  return isApiErrorBody(data) ? data.error.code : null;
}

export function apiStatus(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
}
