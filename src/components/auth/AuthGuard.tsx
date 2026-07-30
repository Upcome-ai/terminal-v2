"use client";

/**
 * Client-side route guard. Wrap any protected page in <AuthGuard>. While auth
 * resolves it shows a splash; if unauthenticated it redirects to /login,
 * preserving the attempted path in a `next` param so the user lands back here
 * after signing in.
 */

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import AuthSplash from "./AuthSplash";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <AuthSplash
        label={status === "loading" ? "Loading terminal…" : "Redirecting to sign in…"}
      />
    );
  }

  return <>{children}</>;
}
