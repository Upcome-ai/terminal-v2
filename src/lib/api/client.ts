/**
 * Thin fetch wrapper for the Wealth Frame backend.
 *
 * Responsibilities:
 *  - Prefix requests with the configured API base URL.
 *  - Attach the stored JWT as a Bearer header on authenticated requests, and
 *    reuse it until it expires (expiry is checked before the request is sent).
 *  - On an expired token or a 401 response, clear the token and broadcast an
 *    "unauthorized" event so the AuthProvider can redirect to /login.
 */

import { API_BASE_URL, authHeader } from "./config";
import { clearStoredToken, getStoredToken, isTokenExpired } from "@/lib/auth/token";

/** Fired (on `window`) whenever a request is rejected for auth reasons. */
export const UNAUTHORIZED_EVENT = "upcome:unauthorized";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function emitUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Attach the Bearer token (default true). Set false for public endpoints like login. */
  auth?: boolean;
  /** JSON-serializable body; stringified automatically. */
  body?: unknown;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;

  const token = auth ? getStoredToken() : null;

  // Reuse the token only while it is still valid; a stale token never reaches
  // the network — we end the session immediately instead.
  if (auth && token && isTokenExpired(token)) {
    clearStoredToken();
    emitUnauthorized();
    throw new ApiError("Session expired", 401);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? authHeader(token) : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401) {
    clearStoredToken();
    emitUnauthorized();
  }

  const raw = await response.text();
  const data = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        ((data as Record<string, unknown>).message ||
          (data as Record<string, unknown>).error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, data);
  }

  return data as T;
}
