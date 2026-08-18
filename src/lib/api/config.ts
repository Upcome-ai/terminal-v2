/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  API CONFIGURATION — matched to the Upcome Auth API doc.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The default is the hosted backend. Override it in one place via the
 *  NEXT_PUBLIC_API_BASE_URL environment variable (see .env.example) to point at
 *  a local instance instead.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend.upcome.ai"
).replace(/\/+$/, "");

/** WebSocket origin derived from the HTTP base (http→ws, https→wss). */
export const WS_BASE_URL = API_BASE_URL.replace(/^http(s?):\/\//, "ws$1://");

/** REST endpoint paths (relative to API_BASE_URL). */
export const ENDPOINTS = {
  // Passwordless email-code login, two steps:
  requestCode: "/auth/login-code", // POST { email }        → 202, emails a code
  createSession: "/auth/session", // POST { email, code }  → 200 { jwt, tokenType }
  interests: "/user/interests", // GET → interests + websocketPath; POST { topic } to add, DELETE { topic } to remove
  last24HoursReport: "/user/reports/last-24-hours", // POST (no body) → 200 { periodHours, topics, report }
} as const;

/** Request-body field names. */
export const EMAIL_FIELD = "email";
export const CODE_FIELD = "code";
export const TOPIC_FIELD = "topic";

/** Longest topic the interests API accepts. */
const TOPIC_MAX_LENGTH = 50;

/** Anything outside the API's allowed topic character set (whitespace is
 *  handled separately, below, since it turns into a separator). */
const TOPIC_DISALLOWED = /[^A-Z0-9._\-\s]/g;

/**
 * Coerce free-form text into a topic the interests API accepts: uppercase,
 * limited to letters, numbers, `.`, `_` and `-`, and at most 50 characters.
 *
 * Multi-word names are the reason this exists — a space is not in the allowed
 * set, so sending "Global News" verbatim is rejected with `400 Bad Request`
 * ("the topic is missing or invalid"). Spaces become underscores instead, so
 * the topic round-trips through add *and* remove.
 *
 * Applied to topics we send on the way in; topics the API hands back are
 * already canonical and are echoed back verbatim when removing.
 */
export function normalizeTopic(raw: string): string {
  return raw
    .toUpperCase()
    .replace(TOPIC_DISALLOWED, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, TOPIC_MAX_LENGTH);
}

/** Default query-parameter name for the WebSocket JWT (the API also echoes this
 *  back as `websocketTokenQueryParameter` on POST /user/interests). */
export const WS_TOKEN_PARAM = "sessionToken";

/** WebSocket close code the server uses when the JWT is missing/invalid/expired. */
export const WS_AUTH_CLOSE_CODE = 1008;

/**
 * Pull the JWT out of the create-session response. The documented shape is
 * `{ jwt, tokenType }`; the extra fallbacks are harmless.
 */
export function extractToken(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const r = response as Record<string, unknown>;
  const candidate = r.jwt ?? r.token ?? r.access_token ?? r.accessToken;
  return typeof candidate === "string" ? candidate : null;
}

/** How the token is sent on authenticated HTTP requests. */
export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Offline preview aid. When `true`, a failed interests request falls back to
 * bundled sample data (with a visible banner) so the terminal UI is usable
 * without a live backend. Keep `false` for a real integration.
 */
export const USE_MOCK_FALLBACK =
  process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === "true";
