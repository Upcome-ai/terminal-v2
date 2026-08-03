"use client";

import { useEffect, useRef, useState } from "react";
import type { Topic } from "@/lib/types";
import CommunityLinks from "@/components/common/CommunityLinks";

type SidebarProps = {
  subscribed: Topic[];
  discover: Topic[];
  countFor: (id: string) => number;
  filter: string;
  onFilterTopic: (id: string) => void;
  onToggleTopic: (id: string) => void;
  onAddTopic: (name: string) => void;
};

export default function Sidebar({
  subscribed,
  discover,
  countFor,
  filter,
  onFilterTopic,
  onToggleTopic,
  onAddTopic,
}: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function commit() {
    const name = draft.trim();
    if (name) onAddTopic(name);
    setDraft("");
    setAdding(false);
  }

  function cancel() {
    setDraft("");
    setAdding(false);
  }

  return (
    <aside className="upscroll w-[280px] shrink-0 border-r border-[#17171A] bg-[#0A0A0C] overflow-y-auto px-4 py-5">
      <div className="flex items-center justify-between px-[6px] pb-3">
        <span className="font-mono text-[11px] tracking-[.16em] uppercase text-[#6E6E76]">
          My Topics
        </span>
        <span className="font-mono text-[11px] text-[#5C5C63]">
          {subscribed.length} subscribed
        </span>
      </div>

      <div>
        {subscribed.map((t) => {
          const active = filter === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onFilterTopic(t.id)}
              className={`group flex items-center gap-[10px] px-[10px] py-[9px] rounded-[9px] cursor-pointer hover:bg-[#101014] ${
                active ? "bg-[#140F09] shadow-[inset_0_0_0_1px_#33261A]" : ""
              }`}
            >
              <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-[#F5922E]" />
              <span className="flex-1 text-sm text-[#C9C9CC] tracking-[-.005em]">
                {t.name}
              </span>
              <span className="font-mono text-[11px] text-[#6E6E76]">
                {countFor(t.id)}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTopic(t.id);
                }}
                title="Unsubscribe"
                className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[#5C5C63] text-[15px] shrink-0 hover:bg-[#1E1216] hover:text-[#F5922E]"
              >
                ×
              </span>
            </div>
          );
        })}
      </div>

      {subscribed.length === 0 && (
        <div className="px-[10px] py-[9px] text-[13px] text-[#6E6E76] leading-[1.5]">
          No topics yet. Add one below to start receiving live events.
        </div>
      )}

      {discover.length > 0 && (
        <>
          <div className="h-px bg-[#17171A] my-[18px] mx-[6px]" />

          <div className="px-[6px] pb-3">
            <span className="font-mono text-[11px] tracking-[.16em] uppercase text-[#6E6E76]">
              Discover
            </span>
          </div>
          <div>
            {discover.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-[10px] px-[10px] py-[9px] rounded-[9px]"
              >
                <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-[#2A2A30]" />
                <span className="flex-1 text-sm text-[#8A8A90] tracking-[-.005em]">
                  {t.name}
                </span>
                <span
                  onClick={() => onToggleTopic(t.id)}
                  className="font-mono text-[11.5px] font-medium text-[#F5922E] border border-[#33261A] bg-[#140F09] px-[10px] py-[5px] rounded-[7px] cursor-pointer shrink-0 hover:bg-[#1C130A]"
                >
                  ＋ Subscribe
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-[22px] mx-[6px] px-[14px] py-[14px] border border-[#17171A] rounded-[11px] bg-[#0C0C0F]">
        <div className="text-[13px] font-semibold text-[#C9C9CC]">
          Add a custom topic
        </div>
        <div className="text-[12.5px] leading-[1.45] text-[#7E7E86] mt-[5px]">
          Track any company, ticker, industry or event in real time.
        </div>
        {adding ? (
          <div className="mt-[11px] flex items-center gap-[7px]">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                else if (e.key === "Escape") cancel();
              }}
              onBlur={cancel}
              placeholder="Topic name…"
              maxLength={40}
              className="flex-1 min-w-0 font-mono text-[12px] text-[#ECECEA] bg-[#08080A] border border-[#33261A] rounded-[7px] px-[9px] py-[6px] outline-none placeholder:text-[#5C5C63] focus:border-[#F5922E]"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
              disabled={!draft.trim()}
              className="font-mono text-[11.5px] font-medium text-[#F5922E] border border-[#33261A] bg-[#140F09] px-[10px] py-[6px] rounded-[7px] cursor-pointer shrink-0 hover:bg-[#1C130A] disabled:opacity-40 disabled:cursor-default"
            >
              Add
            </button>
          </div>
        ) : (
          <div
            onClick={() => setAdding(true)}
            className="mt-[11px] font-mono text-[12px] text-[#F5922E] cursor-pointer hover:text-[#F7A552]"
          >
            ＋ New topic
          </div>
        )}
      </div>

      <CommunityLinks className="mt-[22px] mx-[6px]" heading="Community" />
    </aside>
  );
}
