"use client";

import { useEffect, useState } from "react";
import type { Last24HoursReport } from "@/lib/api/endpoints";

export type ReportState = "loading" | "ready" | "error";

type ReportModalProps = {
  open: boolean;
  state: ReportState;
  report: Last24HoursReport | null;
  error: string | null;
  /** Topics to show while the report is still generating (the current subs). */
  pendingTopics: string[];
  /** Map a topic id to its display label. */
  topicName: (id: string) => string;
  onClose: () => void;
  onRetry: () => void;
};

/** A single report line: bullets keep their marker; a leading `TOPIC:` is emphasized. */
function ReportBody({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <div className="flex flex-col gap-[7px]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-[5px]" aria-hidden />;

        const body = trimmed.replace(/^[-•*]\s+/, "");
        const bulleted = body !== trimmed;
        // Split off a leading "TOPIC: rest" label so it can be highlighted.
        const match = /^([A-Za-z0-9._\- ]{1,50}?):\s+([\s\S]*)$/.exec(body);

        return (
          <div key={i} className="flex gap-[10px]">
            {bulleted && (
              <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#F5922E]" />
            )}
            <p className="m-0 flex-1 text-[13.5px] leading-[1.6] text-[#C9C9CC]">
              {match ? (
                <>
                  <span className="font-semibold text-[#ECECEA]">{match[1]}</span>
                  <span className="text-[#6E6E76]">: </span>
                  {match[2]}
                </>
              ) : (
                body
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportModal({
  open,
  state,
  report,
  error,
  pendingTopics,
  topicName,
  onClose,
  onRetry,
}: ReportModalProps) {
  // Track the copied report by its text, so the "Copied ✓" affordance clears
  // itself automatically once a different report is generated — no effect
  // needed to reset it.
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copied = !!report && copiedText === report.report;

  // Close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chips = state === "ready" && report ? report.topics : pendingTopics;
  const periodHours = report?.periodHours ?? 24;

  async function copyReport() {
    if (!report?.report) return;
    try {
      await navigator.clipboard.writeText(report.report);
      setCopiedText(report.report);
      setTimeout(() => setCopiedText(null), 1600);
    } catch {
      // Clipboard access can be denied; leave the button label unchanged.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Last ${periodHours}-hour report`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[82vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[14px] border border-[#23232A] bg-[#0C0C0F] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-[#17171A] px-[22px] py-[18px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#F5922E]">
                Report
              </span>
              <span className="font-mono text-[10px] tracking-[.14em] text-[#5C5C63]">
                LAST {periodHours}H · UTC
              </span>
            </div>
            <h2 className="mt-[6px] text-[18px] font-semibold tracking-[-.01em] text-[#ECECEA]">
              Last {periodHours} Hours
            </h2>
            {chips.length > 0 && (
              <div className="mt-[10px] flex flex-wrap gap-[6px]">
                {chips.map((id) => (
                  <span
                    key={id}
                    className="rounded-full border border-[#23232A] px-[9px] py-[3px] font-mono text-[10.5px] tracking-[.02em] text-[#9A9AA0]"
                  >
                    {topicName(id) || id}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="-mr-1 -mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-[18px] text-[#6E6E76] transition-colors hover:bg-[#17171A] hover:text-[#ECECEA]"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="upscroll min-h-[140px] flex-1 overflow-y-auto px-[22px] py-[20px]">
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center gap-[14px] py-[46px] text-center">
              <span className="h-[26px] w-[26px] animate-spin rounded-full border-2 border-[#2A2A30] border-t-[#F5922E]" />
              <div className="text-[14px] text-[#C9C9CC]">
                Generating your report…
              </div>
              <div className="max-w-[360px] font-mono text-[11.5px] leading-[1.6] text-[#6E6E76]">
                Searching the web for material news across your topics. This can
                take a little longer than a normal request.
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center justify-center gap-[14px] py-[40px] text-center">
              <div className="text-[14px] text-[#ECECEA]">
                Couldn&apos;t generate the report.
              </div>
              <div className="max-w-[380px] font-mono text-[11.5px] leading-[1.6] text-[#8A8A90]">
                {error ?? "The report request failed."}
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="mt-[2px] cursor-pointer rounded-[8px] border border-[#33261A] bg-[#140F09] px-[14px] py-[8px] font-mono text-[12.5px] font-medium text-[#F5922E] transition-colors hover:bg-[#1C130A]"
              >
                Try again
              </button>
            </div>
          )}

          {state === "ready" &&
            (report && report.report.trim() ? (
              <ReportBody text={report.report} />
            ) : (
              <div className="py-[40px] text-center text-[13.5px] text-[#8A8A90]">
                No material news in the last {periodHours} hours for your topics.
              </div>
            ))}
        </div>

        {/* Footer */}
        {state === "ready" && report && report.report.trim() && (
          <div className="flex items-center justify-between gap-3 border-t border-[#17171A] px-[22px] py-[13px]">
            <span className="font-mono text-[11px] text-[#5C5C63]">
              {report.topics.length} topic{report.topics.length === 1 ? "" : "s"} ·{" "}
              {periodHours}h window
            </span>
            <button
              type="button"
              onClick={copyReport}
              className="cursor-pointer rounded-[8px] border border-[#1E1E23] bg-[#0E0E11] px-[12px] py-[7px] font-mono text-[12px] text-[#8A8A90] transition-colors hover:border-[#33261A] hover:text-[#F5922E]"
            >
              {copied ? "Copied ✓" : "Copy report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
