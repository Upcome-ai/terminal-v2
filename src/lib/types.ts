export type SourceType = "GOV" | "WIRE" | "LOCAL" | "CITIZEN" | "FILING";

export type Topic = {
  id: string;
  name: string;
  sub: boolean;
};

export type NewsItem = {
  id: string;
  topic: string;
  type: SourceType;
  source: string;
  time: string;
  breaking: boolean;
  headline: string;
  summary: string;
  long: string;
  why: string;
};
