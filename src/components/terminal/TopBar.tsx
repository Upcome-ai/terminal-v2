"use client";

import Image from "next/image";

type TopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  clock: string;
  userLabel?: string;
  onSignOut: () => void;
  /** Connection state label (e.g. LIVE / CONNECTING / RECONNECTING / SAMPLE). */
  connectionLabel?: string;
  /** When true the status dot pulses orange; otherwise it's dim/static. */
  connected?: boolean;
  /** Whether the new-item alert sound is enabled. */
  soundOn?: boolean;
  onToggleSound?: () => void;
};

export default function TopBar({
  search,
  onSearchChange,
  clock,
  userLabel,
  onSignOut,
  connectionLabel = "LIVE",
  connected = true,
  soundOn = true,
  onToggleSound,
}: TopBarProps) {
  return (
    <header className="flex items-center gap-5 px-[22px] h-[60px] border-b border-[#17171A] bg-[#0A0A0C] shrink-0">
      <div className="flex items-center gap-[9px] w-[258px] shrink-0">
        <Image
          src="/upcome-mark.svg"
          alt="Upcome"
          width={24}
          height={24}
          className="block h-6 w-6"
        />
        <span className="font-semibold text-[19px] tracking-[-.02em]">Upcome</span>
        <span className="font-mono text-[10px] tracking-[.16em] text-[#5C5C63] border border-[#1E1E23] px-[6px] py-[3px] rounded-[5px] ml-[2px]">
          TERMINAL
        </span>
      </div>

      <div className="flex-1 max-w-[520px] flex items-center gap-[10px] bg-[#0E0E11] border border-[#1E1E23] rounded-[9px] px-[14px] py-[10px]">
        <span className="text-[#5C5C63] text-[15px]">⌕</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search headlines, sources, tickers…"
          className="flex-1 bg-transparent border-none outline-none text-[#ECECEA] font-sans text-[14.5px]"
        />
        <span className="font-mono text-[11px] text-[#5C5C63] border border-[#1E1E23] px-[6px] py-[2px] rounded-[4px]">
          /
        </span>
      </div>

      <div className="ml-auto flex items-center gap-[18px]">
        <div className="flex items-center gap-2 font-mono text-[12.5px] text-[#8A8A90]">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-[#F5922E] animate-upblink" : "bg-[#5C5C63]"
            }`}
          />
          {connectionLabel}
        </div>
        <div className="font-mono text-[13px] text-[#C6C6C8] tracking-[.02em]">{clock}</div>

        {userLabel && (
          <span
            title={userLabel}
            className="hidden sm:block font-mono text-[12px] text-[#8A8A90] max-w-[180px] truncate"
          >
            {userLabel}
          </span>
        )}

        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute new-item alerts" : "Unmute new-item alerts"}
            title={soundOn ? "Mute new-item alerts" : "Unmute new-item alerts"}
            className={`h-[34px] w-[34px] rounded-lg border border-[#1E1E23] flex items-center justify-center text-[14px] cursor-pointer transition-colors hover:border-[#2A2A30] ${
              soundOn ? "text-[#F5922E]" : "text-[#5C5C63] hover:text-[#ECECEA]"
            }`}
          >
            <span aria-hidden className={soundOn ? undefined : "line-through"}>
              ♪
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          className="h-[34px] px-[12px] rounded-lg border border-[#1E1E23] flex items-center gap-[7px] font-mono text-[12.5px] text-[#8A8A90] cursor-pointer transition-colors hover:border-[#2A2A30] hover:text-[#ECECEA]"
        >
          <span aria-hidden>⎋</span>
          Sign out
        </button>
      </div>
    </header>
  );
}
