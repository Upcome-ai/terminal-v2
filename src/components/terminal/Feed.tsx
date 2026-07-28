"use client";

import type { NewsItem } from "@/lib/types";
import FeedCard from "./FeedCard";

type Chip = {
  id: string;
  label: string;
  active: boolean;
};

type FeedProps = {
  chips: Chip[];
  onChipClick: (id: string) => void;
  feed: NewsItem[];
  topicName: (id: string) => string;
  activeLabel: string;
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function Feed({
  chips,
  onChipClick,
  feed,
  topicName,
  activeLabel,
  selectedId,
  onSelect,
}: FeedProps) {
  return (
    <main className="upscroll flex-1 min-w-0 overflow-y-auto bg-[#08080A]">
      <div className="sticky top-0 z-[5] bg-[#08080A] border-b border-[#17171A] px-6 pt-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[19px] font-semibold tracking-[-.01em] m-0">Live Feed</h1>
          <span className="font-mono text-[12.5px] text-[#6E6E76]">
            {feed.length} updates · {activeLabel}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap py-[14px] pb-3">
          {chips.map((c) => (
            <span
              key={c.id}
              onClick={() => onChipClick(c.id)}
              className={`cursor-pointer font-mono text-xs tracking-[.02em] px-[13px] py-[7px] rounded-full transition-all duration-150 hover:border-[#33333A] ${
                c.active
                  ? "bg-[#F5922E] text-[#0A0A0A] border border-[#F5922E]"
                  : "bg-transparent text-[#9A9AA0] border border-[#23232A]"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4 pb-10 flex flex-col gap-[10px]">
        {feed.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            topicName={topicName(item.topic)}
            selected={item.id === selectedId}
            onClick={() => onSelect(item.id)}
          />
        ))}
        {feed.length === 0 && (
          <div className="text-center py-[70px] px-5 text-[#6E6E76]">
            <div className="text-[15px] text-[#8A8A90]">
              No updates match your filters.
            </div>
            <div className="text-[13.5px] mt-[6px]">
              Subscribe to more topics or clear your search.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export type { Chip };
