import type { NewsItem, Topic } from "./types";

/**
 * The always-on default topic. Every user is subscribed to it on their first
 * login, and if they ever unsubscribe it remains available in Discover so they
 * can add it back at any time.
 */
export const GLOBAL_NEWS_TOPIC_NAME = "Global News";

/**
 * Normalize a topic to the backend's accepted form so POST/DELETE
 * `/user/interests` never 400s. The API allows only letters, numbers, `.`, `_`
 * and `-` (uppercased, max 50 chars), so any run of other characters — spaces,
 * slashes, punctuation — is collapsed to a single hyphen and trimmed off the
 * ends. Already-valid single-word topics (e.g. "aapl") are unchanged apart from
 * the uppercasing the server would apply anyway.
 */
export function normalizeTopic(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 50)
    .replace(/[-._]+$/g, "");
}

/** Reduce a topic to bare alphanumerics for tolerant equality checks. */
function canonicalizeTopic(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Check whether a topic id/name is the Global News default. Tolerant of
 * normalization, so "Global News", "GLOBAL-NEWS" and "global_news" all match.
 */
export function isGlobalNews(value: string): boolean {
  return canonicalizeTopic(value) === canonicalizeTopic(GLOBAL_NEWS_TOPIC_NAME);
}

/** A fresh Global News topic in its canonical (subscribed) form. */
export function globalNewsTopic(): Topic {
  return { id: GLOBAL_NEWS_TOPIC_NAME, name: GLOBAL_NEWS_TOPIC_NAME, sub: true };
}

export const initialTopics: Topic[] = [
  { id: "fed", name: "Central Banks", sub: true },
  { id: "markets", name: "Markets & Macro", sub: true },
  { id: "tech", name: "Technology", sub: true },
  { id: "energy", name: "Energy & Commodities", sub: true },
  { id: "crypto", name: "Crypto", sub: true },
  { id: "geo", name: "Geopolitics", sub: true },
  { id: "earnings", name: "Earnings", sub: false },
  { id: "health", name: "Healthcare", sub: false },
  { id: "realestate", name: "Real Estate", sub: false },
];

/**
 * Curated topics surfaced in Discover for any user to subscribe to. Each id is
 * the backend-normalized topic (what the interests API stores and what live
 * events are tagged with); `name` is the human-readable label shown in the UI.
 */
export const discoverTopics: Topic[] = [
  { id: normalizeTopic("USA Iran War"), name: "USA Iran War", sub: false },
  { id: normalizeTopic("Strait of Hormuz"), name: "Strait of Hormuz", sub: false },
];

/** Normalized-id → display-name map for the curated Discover topics. */
const DISPLAY_NAMES = new Map<string, string>(
  discoverTopics.map((t) => [t.id.toLowerCase(), t.name])
);

/**
 * The label to show for a topic id. Backend interests come back normalized
 * (e.g. "USA-IRAN-WAR"); this maps them back to a friendly name when we know
 * one, and always renders the Global News default by its canonical name.
 */
export function displayNameForTopic(id: string): string {
  if (isGlobalNews(id)) return GLOBAL_NEWS_TOPIC_NAME;
  return DISPLAY_NAMES.get(id.trim().toLowerCase()) ?? id;
}

export const items: NewsItem[] = [
  {
    id: "i1",
    topic: "fed",
    source: "Fed newsroom",
    time: "12s",
    breaking: true,
    headline: "Federal Reserve announces emergency policy review",
    summary:
      "An unscheduled review of the current policy stance was confirmed minutes ago.",
    long: "The Federal Reserve has confirmed an unscheduled review of its current policy stance, citing rapidly shifting conditions in funding markets. Officials say a statement will follow within hours.",
    why: "An emergency review is rare and typically precedes an unscheduled decision — rates, liquidity and the dollar can move sharply before markets fully price it in.",
  },
  {
    id: "i2",
    topic: "markets",
    source: "Global wire",
    time: "41s",
    breaking: false,
    headline: "Dollar spikes as safe-haven demand surges",
    summary: "The index jumped to session highs as traders rotated into cash.",
    long: "The dollar index climbed to session highs as investors rotated into cash and short-dated government paper, a classic risk-off move triggered by the morning’s headlines.",
    why: "A stronger dollar pressures commodities, emerging markets and multinationals’ overseas earnings — a fast, broad read on risk appetite.",
  },
  {
    id: "i3",
    topic: "tech",
    source: "Global wire",
    time: "58s",
    breaking: true,
    headline: "Major chipmaker halts production at flagship fab",
    summary:
      "Output at the company’s largest facility has been paused pending inspection.",
    long: "A leading semiconductor manufacturer has paused output at its largest fabrication plant pending an equipment inspection, according to two people familiar with the matter.",
    why: "Flagship fabs supply a huge share of advanced chips — any prolonged halt ripples through device makers, autos and the broader supply chain.",
  },
  {
    id: "i4",
    topic: "energy",
    source: "Global wire",
    time: "1m",
    breaking: false,
    headline: "Crude jumps 4% after pipeline outage reported",
    summary: "A key transit line was taken offline, tightening near-term supply.",
    long: "Benchmark crude rose about 4% after operators reported an unplanned outage on a key transit pipeline, tightening near-term physical supply on major routes.",
    why: "Pipeline disruptions hit spot supply immediately, feeding into fuel prices and inflation expectations within days.",
  },
  {
    id: "i5",
    topic: "fed",
    source: "Global wire",
    time: "2m",
    breaking: false,
    headline: "Central bank signals surprise rate decision ahead",
    summary: "Guidance language shifted, opening the door to an off-cycle move.",
    long: "Updated guidance language has shifted notably, with officials leaving the door open to an off-cycle rate move if conditions deteriorate further.",
    why: "Off-cycle moves catch positioning offside; rate-sensitive assets and the curve can reprice in minutes.",
  },
  {
    id: "i6",
    topic: "crypto",
    source: "Regulatory filing",
    time: "3m",
    breaking: false,
    headline: "Regulator opens probe into major exchange",
    summary: "A formal inquiry into custody practices was disclosed in a filing.",
    long: "A financial regulator has opened a formal inquiry into the custody and reserve practices of a major digital-asset exchange, per a filing published this morning.",
    why: "Exchange probes drive outflows and volatility across tokens as users reassess counterparty risk.",
  },
  {
    id: "i7",
    topic: "geo",
    source: "Local desk",
    time: "4m",
    breaking: false,
    headline: "Port strike escalates, key shipping routes disrupted",
    summary: "Labor action expanded to additional terminals overnight.",
    long: "Industrial action at a major port has escalated, with additional terminals joining overnight and vessels now queuing offshore, according to local reporting.",
    why: "Port congestion raises freight costs and delivery times, pressuring margins for import-reliant sectors.",
  },
  {
    id: "i8",
    topic: "tech",
    source: "Company filing",
    time: "6m",
    breaking: false,
    headline: "8-K filed: CEO transition at $40B logistics firm",
    summary: "The board named an interim chief executive effective immediately.",
    long: "An 8-K disclosed an abrupt CEO transition at a $40B logistics company, with the board appointing an interim chief executive effective immediately.",
    why: "Leadership shocks at large operators can move the stock and signal strategic or governance turbulence.",
  },
  {
    id: "i9",
    topic: "energy",
    source: "Citizen report",
    time: "7m",
    breaking: false,
    headline: "On-ground reports: power outage spreading across grid",
    summary: "Multiple citizen reports describe cascading outages in the region.",
    long: "A cluster of verified citizen reports describes cascading power outages across a regional grid, with several industrial districts confirming loss of supply.",
    why: "Grid instability can idle production and shift energy demand, with knock-on effects for utilities and manufacturers.",
  },
  {
    id: "i10",
    topic: "markets",
    source: "Global wire",
    time: "9m",
    breaking: false,
    headline: "Bond yields slide as investors reprice risk",
    summary: "Long-end yields fell as demand for safety picked up.",
    long: "Government bond yields slid across the long end as investors repriced growth and policy risk following the morning’s run of headlines.",
    why: "Falling yields ripple into mortgages, valuations and bank margins — a core macro signal traders watch closely.",
  },
  {
    id: "i11",
    topic: "geo",
    source: "Government portal",
    time: "12m",
    breaking: false,
    headline: "Government confirms new export restrictions",
    summary: "Fresh curbs target a strategic category of goods.",
    long: "A government portal has published fresh export restrictions targeting a strategic category of goods, effective on a phased timeline.",
    why: "Export curbs redraw supply chains and can advantage or penalize specific sectors overnight.",
  },
  {
    id: "i12",
    topic: "crypto",
    source: "Global wire",
    time: "15m",
    breaking: false,
    headline: "Stablecoin depegs briefly amid liquidity crunch",
    summary: "The token traded below par before partially recovering.",
    long: "A widely held stablecoin briefly traded below par during a short liquidity crunch before partially recovering, rattling on-chain markets.",
    why: "Stablecoin stress can freeze trading pairs and spread contagion quickly across crypto venues.",
  },
];
