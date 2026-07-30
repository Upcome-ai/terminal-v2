"use client";

/**
 * Client-side auth state.
 *
 * The JWT is kept in `sessionStorage` and reused on every request until it
 * expires. This provider:
 *  - Rehydrates the token on load and validates its `exp` before trusting it.
 *  - Schedules an automatic logout the moment the token expires.
 *  - Listens for the "unauthorized" event (a 401 / stale token) and redirects
 *    to /login.
 *
 * Because the token lives in `sessionStorage` (not a cookie), it is invisible to
 * the server, so route protection is done on the client via <AuthGuard>.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { requestLoginCode, verifyLoginCode } from "@/lib/api/endpoints";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import {
  clearStoredToken,
  decodeJwt,
  getStoredToken,
  getTokenExpiryMs,
  isTokenExpired,
  storeToken,
} from "./token";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
};

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  /** Step 1: email a one-time login code to the given address. */
  requestCode: (email: string) => Promise<void>;
  /** Step 2: verify the emailed code and start the session on success. */
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// setTimeout clamps delays above ~24.8 days; don't schedule beyond that.
const MAX_TIMEOUT_MS = 2_147_483_647;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const endSession = useCallback(
    (redirect: boolean) => {
      clearExpiryTimer();
      clearStoredToken();
      setToken(null);
      setStatus("unauthenticated");
      if (redirect) router.replace("/login");
    },
    [clearExpiryTimer, router]
  );

  // Auto-logout exactly when the current token expires.
  const scheduleExpiry = useCallback(
    (activeToken: string) => {
      clearExpiryTimer();
      const expiryMs = getTokenExpiryMs(activeToken);
      if (expiryMs === null) return; // no exp claim — rely on server 401s
      const delay = expiryMs - Date.now();
      if (delay <= 0) {
        endSession(true);
        return;
      }
      if (delay > MAX_TIMEOUT_MS) return; // too far out to schedule reliably
      expiryTimer.current = setTimeout(() => endSession(true), delay);
    },
    [clearExpiryTimer, endSession]
  );

  const startSession = useCallback(
    (activeToken: string) => {
      storeToken(activeToken);
      setToken(activeToken);
      setStatus("authenticated");
      scheduleExpiry(activeToken);
    },
    [scheduleExpiry]
  );

  // Rehydrate from sessionStorage on mount. This must run in an effect (not a
  // lazy initializer): the server renders "loading", then the client reads the
  // token after hydration. That two-pass flow is exactly what the
  // set-state-in-effect rule warns against, but it's required here to avoid a
  // hydration mismatch on client-only storage.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- SSR-safe rehydration from sessionStorage */
    const stored = getStoredToken();
    if (stored && !isTokenExpired(stored)) {
      setToken(stored);
      setStatus("authenticated");
      scheduleExpiry(stored);
    } else {
      if (stored) clearStoredToken();
      setStatus("unauthenticated");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return clearExpiryTimer;
  }, [scheduleExpiry, clearExpiryTimer]);

  // React to 401s / stale tokens surfaced by the API client.
  useEffect(() => {
    const handleUnauthorized = () => endSession(true);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [endSession]);

  const requestCode = useCallback(async (email: string) => {
    await requestLoginCode(email);
  }, []);

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      const newToken = await verifyLoginCode(email, code);
      startSession(newToken);
    },
    [startSession]
  );

  const logout = useCallback(() => endSession(true), [endSession]);

  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, token, user, requestCode, verifyCode, logout }),
    [status, token, user, requestCode, verifyCode, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
