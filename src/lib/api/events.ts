/**
 * WebSocket client for the live user-event stream
 * (`WebSocket /user/events?sessionToken=<jwt>`).
 *
 *  - Reconnects with capped exponential backoff on unexpected drops.
 *  - On the server's auth-close code (1008) it stops and broadcasts the same
 *    "unauthorized" event the HTTP client uses, so the AuthProvider redirects to
 *    /login.
 *  - The URL (and therefore the token) is rebuilt on every (re)connect so an
 *    expired token is never reused.
 */

import { WS_AUTH_CLOSE_CODE, WS_BASE_URL, WS_TOKEN_PARAM } from "./config";
import { UNAUTHORIZED_EVENT } from "./client";
import { getStoredToken } from "@/lib/auth/token";
import { eventToNewsItem, type TopicEvent } from "./endpoints";
import type { NewsItem } from "@/lib/types";

export type StreamStatus = "connecting" | "open" | "closed";

export type EventStreamHandlers = {
  /** Sent once per connection with the interests the server is watching. */
  onReady?: (interests: string[]) => void;
  /** A live news item (already mapped from the raw event). */
  onItem: (item: NewsItem) => void;
  onStatusChange?: (status: StreamStatus) => void;
};

export type EventStreamOptions = {
  /** The `websocketPath` returned by GET /user/interests. */
  path: string;
  /** Query-param name for the token (defaults to the documented `sessionToken`). */
  tokenParam?: string;
  handlers: EventStreamHandlers;
};

const MAX_BACKOFF_MS = 15_000;

function emitUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

function normalizeEvent(data: Record<string, unknown>): TopicEvent {
  return {
    topic: String(data.topic ?? ""),
    event: String(data.event ?? ""),
    moreInfo: String(data["more-info"] ?? ""),
    source: String(data.source ?? ""),
  };
}

/**
 * Opens the event stream and returns a function that closes it for good (no
 * reconnect). Safe to call in a React effect cleanup.
 */
export function openEventStream(options: EventStreamOptions): () => void {
  const { path, tokenParam = WS_TOKEN_PARAM, handlers } = options;

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let closedByCaller = false;

  function buildUrl(): string | null {
    const token = getStoredToken();
    if (!token || !path) return null;
    return `${WS_BASE_URL}${path}?${tokenParam}=${encodeURIComponent(token)}`;
  }

  function connect(): void {
    const url = buildUrl();
    if (!url) {
      emitUnauthorized();
      return;
    }

    // Note: we intentionally do NOT emit "connecting" synchronously here — the
    // first connect() runs inside a React effect, and a synchronous status
    // update would violate the set-state-in-effect rule. Callers default their
    // status to "connecting"; reconnects re-emit it from the async timer below.
    socket = new WebSocket(url);

    socket.onopen = () => {
      attempts = 0;
      handlers.onStatusChange?.("open");
    };

    socket.onmessage = (message) => {
      let data: unknown;
      try {
        data = JSON.parse(message.data as string);
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;

      if (record.type === "connection.ready") {
        const interests = Array.isArray(record.interests)
          ? (record.interests as unknown[]).map((t) => String(t))
          : [];
        handlers.onReady?.(interests);
        return;
      }

      if (typeof record.topic === "string") {
        handlers.onItem(eventToNewsItem(normalizeEvent(record)));
      }
    };

    socket.onclose = (closeEvent) => {
      handlers.onStatusChange?.("closed");
      if (closedByCaller) return;

      // Auth failure — don't retry; let the app send the user to /login.
      if (closeEvent.code === WS_AUTH_CLOSE_CODE) {
        emitUnauthorized();
        return;
      }

      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts);
      attempts += 1;
      reconnectTimer = setTimeout(() => {
        handlers.onStatusChange?.("connecting");
        connect();
      }, delay);
    };

    socket.onerror = () => {
      // A close event follows; reconnection is handled there.
      socket?.close();
    };
  }

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}
