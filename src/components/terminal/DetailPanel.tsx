"use client";

import type { NewsItem } from "@/lib/types";
import { tagClassName } from "@/lib/tagStyle";

type CorroboratingSource = {
  name: string;
  meta: string;
};

type DetailPanelProps = {
  item: NewsItem;
  topicName: string;
};

export default function DetailPanel({ item, topicName }: DetailPanelProps) {
  const corrob: CorroboratingSource[] = [
    { name: item.source, meta: `${item.type} · primary` },
    { name: "Global newswire", meta: "WIRE · corroborated" },
    { name: "Regional desk", meta: "LOCAL · monitoring" },
  ];

  return (
    <aside className="upscroll w-[384px] shrink-0 border-l border-[#17171A] bg-[#0A0A0C] overflow-y-auto">
      <div className="px-6 pt-6 pb-7">
        <div className="flex items-center gap-[9px] mb-4">
          {item.breaking && (
            <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#0A0A0A] bg-[#F5922E] px-2 py-[3px] rounded-[5px]">
              BREAKING
            </span>
          )}
          <span className={tagClassName(item.type)}>{item.type}</span>
          <span className="font-mono text-xs text-[#6E6E76]">
            {item.time} · {item.source}
          </span>
        </div>

        <h2 className="text-[26px] leading-[1.2] tracking-[-.02em] font-bold m-0">
          {item.headline}
        </h2>
        <span className="inline-block mt-[14px] text-[11.5px] text-[#C9946A] bg-[#140F09] border border-[#2A1E12] px-[11px] py-1 rounded-full">
          {topicName}
        </span>

        <p className="text-[15px] leading-[1.62] text-[#B4B4B9] mt-5 mb-0">
          {item.long}
        </p>

        <div className="mt-[22px] px-4 py-4 border border-[#33261A] bg-[#100B06] rounded-[11px]">
          <div className="font-mono text-[10.5px] tracking-[.14em] uppercase text-[#F5922E]">
            Why it matters
          </div>
          <div className="text-sm leading-[1.55] text-[#CFC3B4] mt-2">
            {item.why}
          </div>
        </div>

        <a
          href="https://mvp.upcome.ai"
          className="flex items-center justify-center gap-2 mt-5 bg-[#F5922E] text-[#0A0A0A] p-[13px] rounded-[9px] font-semibold text-[14.5px] hover:text-[#0A0A0A]"
        >
          Open source ↗
        </a>

        <div className="mt-[26px]">
          <div className="font-mono text-[10.5px] tracking-[.14em] uppercase text-[#6E6E76] mb-3">
            Corroborating sources
          </div>
          {corrob.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-[11px] py-[11px] border-t border-[#15151A]"
            >
              <span
                className="w-[30px] h-[30px] rounded-[7px] shrink-0 border border-[#1E1E23]"
                style={{
                  background:
                    "repeating-linear-gradient(135deg,#0D0D10 0 6px,#101014 6px 12px)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-[#C9C9CC]">{s.name}</div>
                <div className="font-mono text-[11px] text-[#6E6E76]">{s.meta}</div>
              </div>
              <span className="text-[#5C5C63] text-[13px]">↗</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
