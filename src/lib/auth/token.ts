/**
 * JWT storage + decoding.
 *
 * Per the chosen strategy, the token lives in `sessionStorage` (cleared when the
 * tab closes) and is reused on every request until its `exp` claim passes. All
 * access is guarded for SSR since `sessionStorage` only exists in the browser.
 */

const STORAGE_KEY = "upcome.jwt";

/** Small leeway so we treat a token as expired slightly before its real `exp`. */
const EXPIRY_SKEW_MS = 5_000;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type JwtPayload = {
  exp?: number; // seconds since epoch
  iat?: number;
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

/** Decode a JWT payload without verifying the signature (client-side display only). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    // Decode as UTF-8 so non-ASCII claim values survive.
    const json = decodeURIComponent(
      Array.from(binary)
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Expiry time in milliseconds since epoch, or `null` if the token has no `exp`. */
export function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

/**
 * True when the token is past (or within the skew window of) its expiry.
 * A token with no `exp` claim is treated as non-expiring here — we rely on the
 * server returning 401 to end such a session.
 */
export function isTokenExpired(token: string, now: number = Date.now()): boolean {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return false;
  return now >= expiryMs - EXPIRY_SKEW_MS;
}
