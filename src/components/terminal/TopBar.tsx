"use client";

import Image from "next/image";

type TopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  clock: string;
};

export default function TopBar({ search, onSearchChange, clock }: TopBarProps) {
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
          <span className="w-2 h-2 rounded-full bg-[#F5922E] animate-upblink" />
          LIVE
        </div>
        <div className="font-mono text-[13px] text-[#C6C6C8] tracking-[.02em]">{clock}</div>
        <div className="w-[34px] h-[34px] rounded-lg border border-[#1E1E23] flex items-center justify-center text-[#8A8A90] cursor-pointer transition-colors hover:border-[#2A2A30] hover:text-[#ECECEA]">
          ⚙
        </div>
      </div>
    </header>
  );
}
