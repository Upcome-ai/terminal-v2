/**
 * Typed API calls, matched to the Upcome Auth API doc.
 *
 * Auth is passwordless (email code → JWT). User data is modelled as "interests"
 * (topic strings); live news arrives over a WebSocket (see `events.ts`).
 */

import type { NewsItem } from "@/lib/types";
import {
  CODE_FIELD,
  EMAIL_FIELD,
  ENDPOINTS,
  TOPIC_FIELD,
  extractToken,
} from "./config";
import { ApiError, apiFetch } from "./client";

/* ─────────────────────────────── auth ──────────────────────────────── */

/** Step 1: `POST /auth/login-code` — email a one-time login code. */
export async function requestLoginCode(email: string): Promise<void> {
  await apiFetch(ENDPOINTS.requestCode, {
    method: "POST",
    auth: false,
    body: { [EMAIL_FIELD]: email },
  });
}

/** Step 2: `POST /auth/session` — exchange the emailed code for a JWT. */
export async function verifyLoginCode(
  email: string,
  code: string
): Promise<string> {
  const response = await apiFetch<unknown>(ENDPOINTS.createSession, {
    method: "POST",
    auth: false,
    body: { [EMAIL_FIELD]: email, [CODE_FIELD]: code },
  });

  const token = extractToken(response);
  if (!token) {
    throw new ApiError(
      "Session created but no JWT was found in the response.",
      500,
      response
    );
  }
  return token;
}

/* ───────────────────────────── interests ───────────────────────────── */

export type InterestsResponse = {
  interests: string[];
  websocketPath: string;
  /** Query-param name for the WS token; present on the POST response. */
  websocketTokenQueryParameter?: string;
  /** The normalized topic that was just added (present on the POST response). */
  topic?: string;
  added?: boolean;
};

/** `GET /user/interests` — the user's topics and their WebSocket path. */
export async function fetchInterests(): Promise<InterestsResponse> {
  const response = await apiFetch<Record<string, unknown>>(ENDPOINTS.interests, {
    method: "GET",
  });
  return mapInterests(response);
}

/** `POST /user/interests` — add a topic. Returns the updated interest set. */
export async function addInterest(topic: string): Promise<InterestsResponse> {
  const response = await apiFetch<Record<string, unknown>>(ENDPOINTS.interests, {
    method: "POST",
    body: { [TOPIC_FIELD]: topic },
  });
  return mapInterests(response);
}

// NOTE: the API doc exposes no endpoint to remove an interest, so unsubscribing
// is handled locally in the UI only (it reappears on reload). If a delete
// endpoint is added later, wire it here.

/* ─────────────────────────────── mappers ───────────────────────────── */

function mapInterests(raw: Record<string, unknown>): InterestsResponse {
  const list = Array.isArray(raw.interests)
    ? (raw.interests as unknown[]).map((t) => String(t))
    : [];
  return {
    interests: list,
    websocketPath: typeof raw.websocketPath === "string" ? raw.websocketPath : "",
    websocketTokenQueryParameter:
      typeof raw.websocketTokenQueryParameter === "string"
        ? raw.websocketTokenQueryParameter
        : undefined,
    topic: typeof raw.topic === "string" ? raw.topic : undefined,
    added: typeof raw.added === "boolean" ? raw.added : undefined,
  };
}

let eventSeq = 0;

/** The shape of a topic event delivered over the WebSocket. */
export type TopicEvent = {
  topic: string;
  event: string;
  moreInfo: string;
  source: string;
};

/** Convert a live WebSocket topic event into a feed `NewsItem`. */
export function eventToNewsItem(event: TopicEvent): NewsItem {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${eventSeq++}`;
  const headline = event.event.trim() || `New ${event.topic} activity`;
  return {
    id,
    topic: event.topic,
    source: event.source || "Source",
    type: "WIRE",
    time: "0s",
    breaking: false,
    headline,
    summary: event.event,
    long: event.event,
    why: "",
    url: event.moreInfo || undefined,
    receivedAt: Date.now(),
  };
}
