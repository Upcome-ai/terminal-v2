export type SourceType = "GOV" | "FILING" | "CITIZEN" | "WIRE" | "LOCAL" | (string & {});

export type Topic = {
  id: string;
  name: string;
  sub: boolean;
};

export type NewsItem = {
  id: string;
  topic: string;
  source: string;
  /** Short source-category tag displayed on the feed card (e.g. "WIRE", "GOV", "FILING"). */
  type: SourceType;
  time: string;
  breaking: boolean;
  headline: string;
  summary: string;
  long: string;
  why: string;
  /** Link to the underlying article/post/filing (the event's `more-info`). */
  url?: string;
  /** Epoch ms the item was received; used to render a live relative time. */
  receivedAt?: number;
};
