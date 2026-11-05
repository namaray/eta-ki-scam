export type L10n = { en: string; bn: string };

export type Severity = "critical" | "high" | "medium" | "info";

export type Signal = {
  id: string;
  severity: Severity;
  title: L10n;
  detail: L10n;
  /** Exact substrings of the analysed text, used to highlight the message. */
  evidence: string[];
  origin: "rule" | "ai";
  source?: { label: string; url: string };
};

export type Scenario =
  | "traffic_fine"
  | "account_alert"
  | "wrong_send"
  | "prize"
  | "job_task"
  | "investment"
  | "relative"
  | "loan"
  | "shop"
  | "other";

export type AiFollowUp = { id: string; question: L10n };

export type Harm = "money" | "secrets" | "personal_details" | "risky_link" | "threat";

export type AiAnalysis = {
  risk: "scam" | "suspicious" | "no_red_flags";
  /** What the message actually tries to make the reader do or fear. */
  harm: Harm[];
  confidence: "high" | "medium" | "low";
  scenario: Scenario;
  summary: L10n;
  tactics: { name: L10n; explanation: L10n; quote: string }[];
  followUps: AiFollowUp[];
};

export type Verdict = "likely_scam" | "suspicious" | "no_red_flags" | "unchecked";

export type FollowUpAnswer = {
  question: string;
  answer: "yes" | "no" | "unsure";
};

export type AnalyzeInput = {
  text?: string;
  sender?: string;
  /** data: URL of a downscaled screenshot. */
  image?: string;
  answers?: FollowUpAnswer[];
};

export type AnalysisResult = {
  verdict: Verdict;
  text: string;
  sender: string;
  scenario: Scenario;
  summary: L10n | null;
  signals: Signal[];
  followUps: AiFollowUp[];
  actions: L10n[];
  aiUsed: boolean;
};

export type Stage = "reading" | "rules" | "domains" | "ai";

export type AnalyzeEvent =
  | { type: "stage"; stage: Stage }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; code: "no_message" | "image_needs_ai" | "busy" | "rate_limited" | "invalid" };
