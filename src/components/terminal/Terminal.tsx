"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { initialTopics, items as mockItems } from "@/lib/data";
import type { NewsItem, Topic } from "@/lib/types";
import { addInterest, fetchInterests } from "@/lib/api/endpoints";
import { openEventStream, type StreamStatus } from "@/lib/api/events";
import { USE_MOCK_FALLBACK } from "@/lib/api/config";
import { formatRelativeTime } from "@/lib/time";
import {
  getSoundEnabledDefault,
  isSoundEnabled,
  playNewsAlert,
  setSoundEnabled,
  subscribeSoundPref,
} from "@/lib/sound";
import { useAuth } from "@/lib/auth/AuthContext";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import Feed from "./Feed";
import AuthSplash from "@/components/auth/AuthSplash";

type LoadState = "loading" | "ready" | "error";

/** Cap on how many live items we retain in memory. */
const MAX_FEED_ITEMS = 300;

const toTopics = (interests: string[]): Topic[] =>
  interests.map((name) => ({ id: name, name, sub: true }));

export default function Terminal() {
  const { user, logout } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [wsPath, setWsPath] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [usingMock, setUsingMock] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");

  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchInterests();
      setTopics(toTopics(res.interests));
      setWsPath(res.websocketPath);
      setItems([]);
      setUsingMock(false);
      setLoadState("ready");
    } catch {
      // A 401 is handled globally (redirect to login) by the API client. For
      // other failures, optionally fall back to bundled sample data.
      if (USE_MOCK_FALLBACK) {
        setTopics(initialTopics);
        setItems(mockItems);
        setWsPath("");
        setUsingMock(true);
        setSelectedId(mockItems[0]?.id ?? null);
        setLoadState("ready");
      } else {
        setLoadState("error");
      }
    }
  }, []);

  useEffect(() => {
    // Initial load of interests from the backend (an external system). State is
    // only set after the fetch resolves, but the rule flags the call site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    loadData();
  }, [loadData]);

  const retry = useCallback(() => {
    setLoadState("loading");
    loadData();
  }, [loadData]);

  // Ticking clock (also drives the live relative times in the feed).
  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  // Subscribed topic ids, as a stable key for the WebSocket effect.
  const interestKey = useMemo(() => topics.map((t) => t.id).join(","), [topics]);

  // Live event stream. Reconnects whenever the interest set or path changes so
  // newly added topics start streaming.
  useEffect(() => {
    if (usingMock || !wsPath) return;
    const close = openEventStream({
      path: wsPath,
      handlers: {
        onItem: (item) => {
          setItems((prev) => [item, ...prev].slice(0, MAX_FEED_ITEMS));
          // Reads the mute preference itself, so toggling sound doesn't
          // reopen the socket.
          playNewsAlert();
        },
        onStatusChange: setStreamStatus,
      },
    });
    return close;
    // interestKey is intentionally a dependency: adding a topic reopens the
    // socket so its events are included.
  }, [wsPath, usingMock, interestKey]);

  // Mute preference, read straight from its store (persisted in localStorage,
  // shared across tabs).
  const soundOn = useSyncExternalStore(
    subscribeSoundPref,
    isSoundEnabled,
    getSoundEnabledDefault
  );

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    if (next) playNewsAlert(); // preview, so the user hears what they enabled
  }, []);

  const topicName = useMemo(() => {
    const byId = new Map(topics.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "";
  }, [topics]);

  const countFor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.topic, (counts.get(i.topic) ?? 0) + 1);
    return (id: string) => counts.get(id) ?? 0;
  }, [items]);

  // Add a topic. In live mode this persists via POST /user/interests; the WS
  // reconnects (interestKey changes) to begin streaming the new topic.
  const addTopic = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      if (!name) return;

      if (usingMock) {
        setTopics((prev) => {
          const existing = prev.find(
            (t) => t.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            setFilter(existing.id);
            return prev;
          }
          const id = name.toUpperCase();
          setFilter(id);
          return [{ id, name: id, sub: true }, ...prev];
        });
        return;
      }

      try {
        const res = await addInterest(name);
        setTopics(toTopics(res.interests));
        if (res.topic) setFilter(res.topic);
      } catch {
        // 401s are handled globally; other errors leave the list unchanged.
      }
    },
    [usingMock]
  );

  // Remove a topic. The API has no unsubscribe endpoint, so this is a
  // session-local hide (the topic returns on reload).
  const removeTopic = useCallback((id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setFilter((f) => (f === id ? "all" : f));
  }, []);

  const subscribed = topics; // every interest is, by definition, subscribed
  const subIds = useMemo(() => subscribed.map((t) => t.id), [subscribed]);

  const chips = [
    { id: "all", label: "All", active: filter === "all" },
    ...subscribed.map((t) => ({
      id: t.id,
      label: t.name,
      active: filter === t.id,
    })),
  ];

  const nowMs = now ? now.getTime() : null;

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
    // Refresh relative times against the ticking clock for live items.
    return result.map((i) =>
      i.receivedAt && nowMs !== null
        ? { ...i, time: formatRelativeTime(i.receivedAt, nowMs) }
        : i
    );
  }, [search, filter, subIds, items, topicName, nowMs]);

  const activeLabel =
    filter === "all" ? "All subscribed topics" : topicName(filter);
  const clock = now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--";
  const userLabel = user?.email ?? user?.name ?? user?.id;

  const connection = usingMock
    ? { label: "SAMPLE", connected: false }
    : streamStatus === "open"
      ? { label: "LIVE", connected: true }
      : streamStatus === "connecting"
        ? { label: "CONNECTING", connected: false }
        : { label: "RECONNECTING", connected: false };

  if (loadState === "loading") {
    return <AuthSplash label="Loading feed…" />;
  }

  if (loadState === "error") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#08080A] text-[#ECECEA] px-6 text-center">
        <div className="text-[16px] text-[#8A8A90]">
          Couldn&apos;t load your interests from the server.
        </div>
        <div className="font-mono text-[12px] text-[#5C5C63] max-w-[420px] leading-[1.6]">
          Confirm the backend is running and reachable, then try again.
        </div>
        <button
          type="button"
          onClick={retry}
          className="mt-1 font-mono text-[12.5px] font-medium text-[#F5922E] border border-[#33261A] bg-[#140F09] px-[14px] py-[8px] rounded-[8px] cursor-pointer hover:bg-[#1C130A]"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={logout}
          className="font-mono text-[12px] text-[#6E6E76] hover:text-[#ECECEA]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#08080A] text-[#ECECEA] overflow-hidden font-sans">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        clock={clock}
        userLabel={userLabel}
        onSignOut={logout}
        connectionLabel={connection.label}
        connected={connection.connected}
        soundOn={soundOn}
        onToggleSound={toggleSound}
      />

      {usingMock && (
        <div className="shrink-0 flex items-center gap-2 px-[22px] py-[7px] bg-[#1A0F09] border-b border-[#3A2415] font-mono text-[11.5px] text-[#F5A05A]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#F5A05A]" />
          OFFLINE — showing bundled sample data (backend unreachable)
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <Sidebar
          subscribed={subscribed}
          discover={[]}
          countFor={countFor}
          filter={filter}
          onFilterTopic={(id) => setFilter((f) => (f === id ? "all" : id))}
          onToggleTopic={removeTopic}
          onAddTopic={addTopic}
        />

        <Feed
          chips={chips}
          onChipClick={setFilter}
          feed={feed}
          topicName={topicName}
          activeLabel={activeLabel}
          selectedId={selectedId ?? ""}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
