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
  normalizeTopic,
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
  /** The normalized topic that was just added/removed (present on POST/DELETE). */
  topic?: string;
  added?: boolean;
  /** Whether the topic was removed (present on the DELETE response). */
  removed?: boolean;
};

/** `GET /user/interests` — the user's topics and their WebSocket path. */
export async function fetchInterests(): Promise<InterestsResponse> {
  const response = await apiFetch<Record<string, unknown>>(ENDPOINTS.interests, {
    method: "GET",
  });
  return mapInterests(response);
}

/**
 * `POST /user/interests` — add a topic. Returns the updated interest set.
 *
 * The topic is normalized to the API's accepted character set first, so a
 * free-form name ("Global News") is stored in a form that can also be removed
 * later rather than rejected with a 400.
 */
export async function addInterest(topic: string): Promise<InterestsResponse> {
  const response = await apiFetch<Record<string, unknown>>(ENDPOINTS.interests, {
    method: "POST",
    body: { [TOPIC_FIELD]: normalizeTopic(topic) },
  });
  return mapInterests(response);
}

/**
 * `DELETE /user/interests` — remove a topic. Returns the updated interest set.
 *
 * Callers pass a topic the API itself returned, so it is sent verbatim: that
 * string is by definition one of the stored interests, and re-normalizing it
 * could turn it into one the user doesn't have.
 */
export async function removeInterest(topic: string): Promise<InterestsResponse> {
  const response = await apiFetch<Record<string, unknown>>(ENDPOINTS.interests, {
    method: "DELETE",
    body: { [TOPIC_FIELD]: topic },
  });
  return mapInterests(response);
}

/* ─────────────────────────────── reports ───────────────────────────── */

export type Last24HoursReport = {
  /** Length of the reporting window in hours (24, per the API). */
  periodHours: number;
  /** The interests the report covered, in the API's topic format. */
  topics: string[];
  /** The report body — a compact, newline-separated summary per topic. */
  report: string;
};

/**
 * `POST /user/reports/last-24-hours` — a compact report of material news from
 * the rolling 24-hour UTC window across *all* of the authenticated user's saved
 * interests.
 *
 * The request has no body: the server derives the topics from the stored
 * interest set, so this always reflects whatever the user is currently
 * subscribed to. Generation can be slow (it searches the web for current
 * information), so callers should show a pending state while it runs.
 *
 * A `400` means the user has no saved interests — surface that as "subscribe to
 * a topic first" rather than a generic failure.
 */
export async function generateLast24HoursReport(): Promise<Last24HoursReport> {
  const response = await apiFetch<Record<string, unknown>>(
    ENDPOINTS.last24HoursReport,
    { method: "POST" }
  );
  return {
    periodHours:
      typeof response.periodHours === "number" ? response.periodHours : 24,
    topics: Array.isArray(response.topics)
      ? (response.topics as unknown[]).map((t) => String(t))
      : [],
    report: typeof response.report === "string" ? response.report : "",
  };
}

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
    removed: typeof raw.removed === "boolean" ? raw.removed : undefined,
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
