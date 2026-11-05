import type { AiAnalysis, L10n, Scenario, Severity, Signal, Verdict } from "./types";

const WEIGHT: Record<Severity, number> = { critical: 5, high: 3, medium: 1, info: 0 };
const SUSPICIOUS_AT = 2;
const SCAM_AT = 5;

// Offers use these constantly: "buy now" plus a short link appears in a quarter of a dataset's real promotions.
const WEAK_SIGNALS = new Set(["urgency", "shortener"]);
const WEAK_WEIGHT = 0.5;

function ruleWeight(signal: Signal): number {
  return WEAK_SIGNALS.has(signal.id.split(":")[0]) ? WEAK_WEIGHT : WEIGHT[signal.severity];
}

function aiWeight(ai: AiAnalysis): number {
  // The model over-flags normal offers, so its opinion alone can't flag a message. It must name a harm.
  if (ai.harm.length === 0) return ai.risk === "no_red_flags" ? 0 : 1;
  if (ai.risk === "scam") return { high: 5, medium: 3, low: 2 }[ai.confidence];
  if (ai.risk === "suspicious") return 2;
  return 0;
}

/**
 * Rule findings can only push the score up, so the AI can't talk the verdict out of a critical
 * rule. With no AI and no rule hits we say we couldn't check, never that the message looks fine.
 */
export function decideVerdict(signals: Signal[], ai: AiAnalysis | null): Verdict {
  const ruleScore = signals
    .filter((signal) => signal.origin === "rule")
    .reduce((total, signal) => total + ruleWeight(signal), 0);
  const score = ruleScore + (ai ? aiWeight(ai) : 0);
  if (score >= SCAM_AT) return "likely_scam";
  if (score >= SUSPICIOUS_AT) return "suspicious";
  return ai ? "no_red_flags" : "unchecked";
}

const VERIFY_BY_SCENARIO: Partial<Record<Scenario, L10n>> = {
  traffic_fine: {
    en: "If you're worried about a real fine, don't use this message's link. Check through official BRTA channels, the Traffic Division or 999. This result doesn't prove that you have no fine.",
    bn: "সত্যিকারের জরিমানা নিয়ে চিন্তা থাকলে এই মেসেজের লিংক ব্যবহার করবেন না। বিআরটিএর অফিসিয়াল মাধ্যম, ট্রাফিক বিভাগ বা ৯৯৯-এ যাচাই করুন। এই ফলাফল প্রমাণ করে না যে আপনার কোনো জরিমানা নেই।",
  },
  wrong_send: {
    en: "Open your bKash or Nagad app and check your actual balance. If money really did arrive, ask the provider's helpline how to return it.",
    bn: "বিকাশ বা নগদ অ্যাপ খুলে আসল ব্যালেন্স দেখুন। সত্যিই টাকা এলে কীভাবে ফেরত দেবেন তা প্রোভাইডারের হেল্পলাইনে জিজ্ঞেস করুন।",
  },
  account_alert: {
    en: "Open the official app yourself, or call the helpline on your card or the provider's website.",
    bn: "নিজে অফিসিয়াল অ্যাপ খুলুন, অথবা কার্ডে বা প্রোভাইডারের ওয়েবসাইটে দেওয়া হেল্পলাইনে কল করুন।",
  },
  job_task: {
    en: "Don't pay to join or unlock earnings. Look up the company through a source other than this message.",
    bn: "যোগ দিতে বা আয় তুলতে টাকা দেবেন না। এই মেসেজের বাইরে অন্য কোনো মাধ্যমে প্রতিষ্ঠানটি যাচাই করুন।",
  },
  relative: {
    en: "Call the person on the number you already have for them before sending anything.",
    bn: "কিছু পাঠানোর আগে আপনার কাছে আগে থেকে থাকা নম্বরে সেই ব্যক্তিকে ফোন করুন।",
  },
  prize: {
    en: "Don't pay a fee or share your details to claim a prize. Check with the organisation directly.",
    bn: "পুরস্কার নিতে ফি দেবেন না বা তথ্য দেবেন না। সরাসরি প্রতিষ্ঠানের কাছে যাচাই করুন।",
  },
  investment: {
    en: "Don't transfer money. Check whether the company is registered with the regulator first.",
    bn: "টাকা পাঠাবেন না। আগে প্রতিষ্ঠানটি নিয়ন্ত্রক সংস্থায় নিবন্ধিত কি না যাচাই করুন।",
  },
  loan: {
    en: "Don't pay a fee up front. Check that the lender is licensed before sharing your documents.",
    bn: "আগাম ফি দেবেন না। কাগজপত্র দেওয়ার আগে ঋণদাতার লাইসেন্স আছে কি না যাচাই করুন।",
  },
  shop: {
    en: "Prefer cash on delivery. Check the page's history and reviews before paying in advance.",
    bn: "সম্ভব হলে ক্যাশ অন ডেলিভারি নিন। অগ্রিম দেওয়ার আগে পেজের ইতিহাস ও রিভিউ দেখুন।",
  },
};

// The available models' Bangla is unreliable, so risky results use our own wording where we can.
const RISKY_SUMMARY_BN: Partial<Record<Scenario, string>> = {
  traffic_fine: "মেসেজটি ট্রাফিক জরিমানার কথা বলে আপনার কাছ থেকে টাকা নেওয়ার চেষ্টা করছে বলে মনে হচ্ছে।",
  account_alert: "মেসেজটি অ্যাকাউন্ট বা সিমে সমস্যার কথা বলে আপনাকে দিয়ে দ্রুত কিছু করানোর চেষ্টা করছে বলে মনে হচ্ছে।",
  wrong_send: "কেউ বলছে ভুলে আপনার নম্বরে টাকা পাঠিয়েছে এবং সেটি ফেরত চাইছে।",
  prize: "মেসেজটি পুরস্কারের কথা বলে আপনার কাছ থেকে টাকা বা তথ্য নেওয়ার চেষ্টা করছে বলে মনে হচ্ছে।",
  job_task: "মেসেজটি সহজ আয়ের কথা বলে আপনাকে আকৃষ্ট করার চেষ্টা করছে বলে মনে হচ্ছে।",
  investment: "মেসেজটি বড় লাভের কথা বলে আপনার কাছ থেকে টাকা নেওয়ার চেষ্টা করছে বলে মনে হচ্ছে।",
  relative: "কেউ পরিচিত বা আত্মীয় সেজে বিপদের কথা বলে টাকা চাইছে বলে মনে হচ্ছে।",
  loan: "মেসেজটি সহজ লোনের কথা বলে আপনার কাছ থেকে টাকা বা তথ্য নেওয়ার চেষ্টা করছে বলে মনে হচ্ছে।",
  shop: "মেসেজটি পণ্য পাওয়ার আগেই আপনার কাছ থেকে টাকা নেওয়ার চেষ্টা করছে বলে মনে হচ্ছে।",
};

export function buildSummary(verdict: Verdict, scenario: Scenario, aiSummary: L10n | null): L10n | null {
  const isRisky = verdict === "likely_scam" || verdict === "suspicious";
  const ownBangla = isRisky ? RISKY_SUMMARY_BN[scenario] : undefined;
  if (!ownBangla) return aiSummary;
  return { en: aiSummary?.en ?? "", bn: ownBangla };
}

export function buildActions(verdict: Verdict, scenario: Scenario, hasUnverifiedLink = false): L10n[] {
  const verify = VERIFY_BY_SCENARIO[scenario];
  if (verdict === "likely_scam" || verdict === "suspicious") {
    return [
      {
        en: "Don't tap any link, reply, or call back the number in the message.",
        bn: "মেসেজের কোনো লিংকে ট্যাপ করবেন না, উত্তর দেবেন না, বা ওই নম্বরে ফোন করবেন না।",
      },
      { en: "Never share a PIN, OTP or password.", bn: "পিন, ওটিপি বা পাসওয়ার্ড কখনো কাউকে দেবেন না।" },
      verify ?? {
        en: "Check with the organisation using a number or website you found yourself.",
        bn: "নিজে খুঁজে পাওয়া নম্বর বা ওয়েবসাইট ব্যবহার করে প্রতিষ্ঠানের কাছে যাচাই করুন।",
      },
    ];
  }
  if (verdict === "no_red_flags") {
    return [
      ...(hasUnverifiedLink
        ? [
            {
              en: "We couldn't confirm who owns the link. To be safe, open the company's official app instead of tapping it.",
              bn: "লিংকটি কার তা আমরা নিশ্চিত হতে পারিনি। নিরাপদ থাকতে লিংকে না গিয়ে কোম্পানির অফিসিয়াল অ্যাপ খুলুন।",
            },
          ]
        : []),
      {
        en: "Still never share a PIN, OTP or password, even if the message seems genuine.",
        bn: "মেসেজ আসল মনে হলেও পিন, ওটিপি বা পাসওয়ার্ড কাউকে দেবেন না।",
      },
      {
        en: "If you weren't expecting it, check with the sender through a contact you already trust.",
        bn: "আপনি এটি আশা না করলে আগে থেকে বিশ্বাসযোগ্য কোনো মাধ্যমে প্রেরকের কাছে যাচাই করুন।",
      },
    ];
  }
  return [
    {
      en: "Treat it with care until you can check it again. Don't tap links or share a PIN or OTP.",
      bn: "আবার যাচাই না করা পর্যন্ত সাবধান থাকুন। লিংকে ট্যাপ করবেন না এবং পিন বা ওটিপি দেবেন না।",
    },
  ];
}
