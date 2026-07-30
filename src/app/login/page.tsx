"use client";

import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import AuthSplash from "@/components/auth/AuthSplash";

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;

/** Only allow same-origin relative paths as the post-login destination. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

type Step = "email" | "code";

function LoginForm() {
  const { status, requestCode, verifyCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, router, next]);

  // Resend cooldown countdown (the setState lives in an async timer callback).
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function describeError(err: unknown, fallback: string): string {
    // A rejected fetch (backend unreachable / CORS) throws a TypeError, not an ApiError.
    if (err instanceof ApiError) return err.message || fallback;
    return "Could not reach the server. Confirm the backend is running and try again.";
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const value = email.trim();
    if (!value) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await requestCode(value);
      setEmail(value);
      setStep("code");
      setCode("");
      setInfo(`A ${CODE_LENGTH}-digit login code is on its way to your inbox.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(describeError(err, "Couldn't send a code to that email."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const value = code.trim();
    if (!value) {
      setError("Enter the code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      await verifyCode(email, value);
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError("That code is invalid or has expired. Try again or resend.");
      } else {
        setError(describeError(err, "Couldn't verify that code."));
      }
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || submitting) return;
    setError(null);
    setInfo(null);
    try {
      await requestCode(email);
      setCode("");
      setInfo(`A new ${CODE_LENGTH}-digit login code is on its way to your inbox.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(describeError(err, "Couldn't resend the code."));
    }
  }

  function handleChangeEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setInfo(null);
  }

  if (status === "loading" || status === "authenticated") {
    return <AuthSplash label="Loading…" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#08080A] text-[#ECECEA]">
      <div className="w-full max-w-[420px]">
        <TerminalCard>
          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="flex flex-col gap-[18px]" noValidate>
              <Heading
                title="Sign in to the terminal"
                body="Enter your email and we'll send you a one-time login code."
              />

              <label className="flex flex-col gap-[9px]">
                <span className={labelClass}>Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoFocus
                  className="w-full bg-[#08080A] border border-[#26262C] px-[14px] py-[12px] font-mono text-[14px] text-[#ECECEA] outline-none transition-colors focus:border-[#F5922E]"
                />
              </label>

              {error && <Banner tone="error">{error}</Banner>}

              <GhostButton type="submit" disabled={submitting}>
                {submitting ? "Sending code…" : "Send login code"}
              </GhostButton>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-[18px]" noValidate>
              <Heading
                title="Enter login code"
                body={
                  <>
                    We sent a {CODE_LENGTH}-digit code to{" "}
                    <span className="text-[#C9C9CC]">{email}</span>. It expires in{" "}
                    {CODE_TTL_MINUTES} minutes.
                  </>
                }
              />

              <label className="flex flex-col gap-[9px]">
                <span className={labelClass}>{CODE_LENGTH}-digit code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                  }
                  placeholder={"·".repeat(CODE_LENGTH)}
                  autoFocus
                  aria-label={`${CODE_LENGTH}-digit login code`}
                  className="w-full bg-[#08080A] border border-[#F5922E] px-[14px] py-[13px] text-center font-mono text-[17px] text-[#ECECEA] tracking-[.62em] indent-[.62em] outline-none caret-[#F5922E] placeholder:text-[#4A4A52]"
                />
              </label>

              {error && <Banner tone="error">{error}</Banner>}

              <GhostButton type="submit" disabled={submitting}>
                {submitting ? "Verifying…" : "Verify & enter terminal"}
              </GhostButton>

              <div className="flex items-center justify-between font-mono text-[12px] -mt-[4px]">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-[#8A8A90] transition-colors hover:text-[#ECECEA] cursor-pointer"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || submitting}
                  className="text-[#F5922E] transition-colors hover:text-[#F7A552] disabled:text-[#5C5C63] disabled:cursor-default cursor-pointer"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              {info && !error && <Banner tone="info">{info}</Banner>}
            </form>
          )}
        </TerminalCard>

        <p className="mt-[14px] text-center font-mono text-[10.5px] tracking-[.06em] text-[#4A4A52] leading-[1.7]">
          Your session is kept only for this browser tab and ends automatically
          when your access token expires.
        </p>
      </div>
    </div>
  );
}

const labelClass =
  "font-mono text-[10.5px] tracking-[.2em] uppercase text-[#5C5C63]";

/** Bordered console panel with the Upcome wordmark header. */
function TerminalCard({ children }: { children: ReactNode }) {
  return (
    <div className="border border-[#1E1E23] bg-[#0C0C0E]">
      <div className="flex items-center justify-between gap-4 border-b border-[#1E1E23] px-[20px] py-[16px]">
        <span className="font-mono font-semibold text-[15px] tracking-[.22em] text-[#F5922E]">
          UPCOME
        </span>
        <span className="font-mono text-[10px] tracking-[.2em] uppercase text-[#5C5C63]">
          Secure terminal
        </span>
      </div>
      <div className="px-[20px] py-[20px]">{children}</div>
    </div>
  );
}

function Heading({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <h1 className="font-mono font-semibold text-[14px] tracking-[.14em] uppercase text-[#ECECEA]">
        {title}
      </h1>
      <p className="font-mono text-[12.5px] text-[#8A8A90] leading-[1.65]">{body}</p>
    </div>
  );
}

function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full border border-[#2A2A30] bg-transparent px-[14px] py-[13px] font-mono text-[12.5px] tracking-[.18em] uppercase text-[#C9C9CC] transition-colors cursor-pointer hover:border-[#F5922E] hover:text-[#F5922E] disabled:opacity-50 disabled:cursor-default disabled:hover:border-[#2A2A30] disabled:hover:text-[#C9C9CC]"
    >
      {children}
    </button>
  );
}

function Banner({ children, tone }: { children: ReactNode; tone: "error" | "info" }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`border px-[13px] py-[11px] font-mono text-[12px] leading-[1.6] ${
        isError
          ? "border-[#3A2415] bg-[#1A0F09] text-[#F5A05A]"
          : "border-[#1E1E23] bg-[#08080A] text-[#8A8A90]"
      }`}
    >
      {children}
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams must sit inside a Suspense boundary.
  return (
    <Suspense fallback={<AuthSplash label="Loading…" />}>
      <LoginForm />
    </Suspense>
  );
}
