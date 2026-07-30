"use client";

import type { NewsItem } from "@/lib/types";

type FeedCardProps = {
  item: NewsItem;
  topicName: string;
  selected: boolean;
  onClick: () => void;
};

export default function FeedCard({ item, topicName, selected, onClick }: FeedCardProps) {
  const accent = item.breaking ? "#F5922E" : selected ? "#3A3A40" : "transparent";
  // Link to the event's underlying article/post/filing when available.
  const href = item.url || "https://mvp.upcome.ai";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      style={{ borderLeftColor: accent }}
      className={`block px-5 py-[17px] border rounded-xl cursor-pointer border-l-[3px] transition-colors duration-150 hover:bg-[#101014] hover:border-[#26262B] ${
        selected ? "border-[#26262B] bg-[#101014]" : "border-[#17171A] bg-[#0B0B0E]"
      }`}
    >
      <div className="flex items-center gap-[9px] mb-[9px]">
        {item.breaking && (
          <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#0A0A0A] bg-[#F5922E] px-2 py-[3px] rounded-[5px]">
            BREAKING
          </span>
        )}
        <span className="font-mono text-xs text-[#6E6E76]">{item.time}</span>
        <span className="font-mono text-[11.5px] text-[#7E7E86]">{item.source}</span>
        <span className="ml-auto text-[11px] text-[#C9946A] bg-[#140F09] border border-[#2A1E12] px-[10px] py-[3px] rounded-full">
          {topicName}
        </span>
      </div>
      <div className="text-[17px] leading-[1.32] font-semibold text-[#EDEDEC] tracking-[-.01em]">
        {item.headline}
      </div>
      <div className="mt-[9px] font-mono text-[11px] tracking-[.02em] text-[#C9946A]">
        Click to open source ↗
      </div>
    </a>
  );
}
