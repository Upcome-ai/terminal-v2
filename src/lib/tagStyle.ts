import type { SourceType } from "./types";

export function tagClassName(type: SourceType): string {
  const base =
    "font-mono text-[10.5px] tracking-[.05em] px-[7px] py-[3px] rounded-[5px] shrink-0";
  if (type === "GOV" || type === "FILING") {
    return `${base} text-[#F5922E] border border-[#33261A]`;
  }
  if (type === "CITIZEN") {
    return `${base} text-[#B8B8BC] bg-[#1B1B1E] border border-[#2A2A30]`;
  }
  return `${base} text-[#9A9AA0] border border-[#2A2A30]`;
}
