"use client";

import { useEffect, useMemo, useState } from "react";
import { initialTopics, items } from "@/lib/data";
import type { Topic } from "@/lib/types";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import Feed from "./Feed";
import DetailPanel from "./DetailPanel";

export default function Terminal() {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("i1");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  const topicName = useMemo(() => {
    const byId = new Map(topics.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "";
  }, [topics]);

  const countFor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.topic, (counts.get(i.topic) ?? 0) + 1);
    return (id: string) => counts.get(id) ?? 0;
  }, []);

  function toggleTopic(id: string) {
    setTopics((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, sub: !t.sub } : t));
      const t = next.find((x) => x.id === id)!;
      if (!t.sub) {
        setFilter((f) => (f === id ? "all" : f));
      }
      return next;
    });
  }

  const subscribed = topics.filter((t) => t.sub);
  const discover = topics.filter((t) => !t.sub);
  const subIds = subscribed.map((t) => t.id);

  const chips = [
    { id: "all", label: "All", active: filter === "all" },
    ...subscribed.map((t) => ({ id: t.id, label: t.name, active: filter === t.id })),
  ];

  const feed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items.filter((i) => subIds.includes(i.topic));
    if (filter !== "all") result = result.filter((i) => i.topic === filter);
    if (q) {
      result = result.filter((i) =>
        `${i.headline} ${i.summary} ${i.source} ${topicName(i.topic)}`
          .toLowerCase()
          .includes(q)
      );
    }
    return result;
  }, [search, filter, subIds, topicName]);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const activeLabel = filter === "all" ? "All subscribed topics" : topicName(filter);
  const clock = now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--";

  return (
    <div className="h-screen flex flex-col bg-[#08080A] text-[#ECECEA] overflow-hidden font-sans">
      <TopBar search={search} onSearchChange={setSearch} clock={clock} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          subscribed={subscribed}
          discover={discover}
          countFor={countFor}
          filter={filter}
          onFilterTopic={(id) => setFilter((f) => (f === id ? "all" : id))}
          onToggleTopic={toggleTopic}
        />

        <Feed
          chips={chips}
          onChipClick={setFilter}
          feed={feed}
          topicName={topicName}
          activeLabel={activeLabel}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <DetailPanel item={selected} topicName={topicName(selected.topic)} />
      </div>
    </div>
  );
}
