import { extractLinks, type LinkInfo } from "./links";
import type { L10n, Scenario, Severity, Signal } from "./types";

// Bengali conjuncts have several Unicode spellings, so patterns and input are both NFC.
const re = (source: string, flags = "iu") => new RegExp(source.normalize("NFC"), flags);

const DMP_SOURCE = {
  label: "DMP warning via The Report",
  url: "https://thereport.live/bangladesh/dmp-warns-against-fake-traffic-fine-sms-scams/40245",
};
const FINE_SCAM_SOURCE = {
  label: "Asia News Network",
  url: "https://asianews.network/dont-click-that-link-how-fake-ai-traffic-fine-scam-in-bangladesh-is-targeting-vehicle-owners/",
};

const OFFICIAL_DMP_SENDERS = new Set(["01320042207", "01320042227"]);

const P = {
  trafficFine: re(
    String.raw`(?:brta|বিআরটিএ|traffic|ট্রাফিক|dmp|ডিএমপি|সড়ক পরিবহন|road transport).{0,200}?(?:\bfine\b|\bfines\b|জরিমানা|jorimana|violation|penalty|challan|চালান|মামলা)|(?:\bfine\b|জরিমানা|jorimana|penalty|violation).{0,200}?(?:brta|বিআরটিএ|traffic|ট্রাফিক|dmp|ডিএমপি|vehicle|গাড়ি|gari)`,
    "isu",
  ),
  institution: re(
    String.raw`\b(?:brta|bkash|bKash|nagad|upay|dbbl|dmp|rab|bangladesh bank)\b|বিআরটিএ|বিকাশ|ডিএমপি|র‍্যাব|পুলিশ|বাংলাদেশ ব্যাংক|\bpolice\b|\bbank\b|ব্যাংক`,
  ),
  urgency: re(
    String.raw`\burgent(?:ly)?\b|\bimmediately\b|\bwithin\s+\d+\s*(?:hours?|hrs?|days?)\b|\blast chance\b|\bact now\b|\btoday only\b|\bfinal notice\b|জরুরি|এখনই|অবিলম্বে|ঘণ্টার মধ্যে|ঘন্টার মধ্যে|শেষ সুযোগ|\bekhoni\b|\bjoruri\b|\bjaldi\b`,
  ),
  threat: re(
    String.raw`\blegal action\b|\barrest(?:ed)?\b|\bcourt\b|\bcase will be filed\b|\blicen[cs]e\b.{0,30}(?:cancel|suspend)|আইনগত ব্যবস্থা|আইনি ব্যবস্থা|মামলা করা হবে|মামলা হবে|গ্রেপ্তার|গ্রেফতার|আদালত|\bmamla\b|\bgreftar\b`,
    "isu",
  ),
  fastPayDiscount: re(
    String.raw`(?:\bhalf\b|\b50\s*%|\bdiscount\b|অর্ধেক|৫০\s*%|ছাড়).{0,80}?(?:hours?|hrs?|days?|ঘণ্টা|ঘন্টা|দিন)|(?:hours?|hrs?|ঘণ্টা|ঘন্টা).{0,80}?(?:\bhalf\b|\b50\s*%|\bdiscount\b|অর্ধেক|৫০\s*%|ছাড়)`,
    "isu",
  ),
  wrongSend: re(
    String.raw`(?:by mistake|mistakenly|wrong number|wrongly|ভুলে|ভুল করে|ভুল নম্বর|vul kore|bhul kore|vule|bhule).{0,120}?(?:return|send (?:it )?back|refund|ফেরত|ferot|pathiye din)|(?:return|send (?:it )?back|ফেরত|ferot).{0,120}?(?:by mistake|mistakenly|wrong number|ভুলে|ভুল করে|ভুল নম্বর|vul kore|bhul kore)`,
    "isu",
  ),
  prize: re(
    String.raw`\bcongratulations?\b|\byou (?:have |'ve )?won\b|\bwinner\b|\blottery\b|\blucky draw\b|\bprize\b|অভিনন্দন|পুরস্কার|পুরষ্কার|লটারি|বিজয়ী|লাকি ড্র|\bjitechen\b|\bpuroskar\b`,
  ),
  jobTask: re(
    String.raw`(?:part[- ]?time|work from home|online job|ঘরে বসে|ghore bose|অনলাইন জব|অনলাইনে কাজ|daily income|প্রতিদিন আয়|task|টাস্ক|like.{0,20}(?:youtube|video|ভিডিও)|telegram|টেলিগ্রাম).{0,160}?(?:\d[\d,]*\s*(?:tk|taka|/-|৳)|৳\s*\d|[০-৯\d,]+\s*টাকা|income|আয়|earn|ইনকাম)`,
    "isu",
  ),
  upfrontFee: re(
    String.raw`\b(?:registration|security|processing|activation|verification|file|service)\s+(?:fee|charge|deposit|money)\b|রেজিস্ট্রেশন ফি|জামানত|প্রসেসিং ফি|অগ্রিম.{0,20}(?:ফি|টাকা)|সিকিউরিটি মানি|\bregistration fee\b|\bfee dite hobe\b`,
    "isu",
  ),
  personalPayment: re(
    String.raw`(?:send money|cash ?in|সেন্ড মানি|bkash|nagad|rocket|বিকাশ|নগদ|রকেট|পার্সোনাল).{0,60}?(?:\+?88)?(?:01[3-9]\d{8}|০১[৩-৯][০-৯]{8})|(?:\+?88)?(?:01[3-9]\d{8}|০১[৩-৯][০-৯]{8}).{0,60}?(?:\bbkash\b|\bnagad\b|\brocket\b|বিকাশ|নগদ|রকেট|send money|সেন্ড মানি)`,
    "isu",
  ),
  accountAlert: re(
    String.raw`(?:account|a/c|wallet|\bsim\b|kyc|\bnid\b|অ্যাকাউন্ট|একাউন্ট|সিম|এনআইডি).{0,80}?(?:block|suspend|locked|closed|disabled|deactivat|will be (?:closed|stopped)|ব্লক|বন্ধ হয়ে|বন্ধ করা|bondho|কেওয়াইসি)`,
    "isu",
  ),
  relative: re(
    String.raw`(?:this is my new number|my new number|আমার নতুন নম্বর|amar notun number|ami tomar|আমি তোমার|আমি আপনার|i am your).{0,160}?(?:money|tk|taka|টাকা|hospital|হাসপাতাল|বিপদ|bipod|emergency)|(?:\bmama\b|\bchacha\b|মামা|চাচা|ভাই|\bbhai\b|\buncle\b).{0,60}?(?:hospital|হাসপাতাল|বিপদ|bipod|accident|দুর্ঘটনা).{0,120}?(?:money|tk|taka|টাকা)`,
    "isu",
  ),
  investment: re(
    String.raw`\bguaranteed\b.{0,40}(?:profit|return|income)|\bdouble your\b|\bdaily profit\b|দ্বিগুণ|নিশ্চিত লাভ|নিশ্চিত মুনাফা|\b(?:forex|crypto|binance|usdt)\b.{0,80}(?:profit|income|লাভ|আয়|invest|বিনিয়োগ)|(?:profit|লাভ|বিনিয়োগ|invest).{0,80}\b(?:forex|crypto|binance|usdt)\b`,
    "isu",
  ),
  loan: re(
    String.raw`(?:\bloan\b|লোন|ঋণ).{0,120}?(?:approved|instant|without|no document|অনুমোদিত|কাগজ ছাড়া|জামানত ছাড়া|ফি|fee)`,
    "isu",
  ),
  promptInjection: re(
    String.raw`ignore (?:all |your |any |the )?(?:previous |prior |above )?instructions|(?:mark|classify|label|rate) (?:this|the message)(?: message)? as (?:safe|legit|legitimate|not a scam)|you are an ai|system prompt|আগের নির্দেশ(?:না)? উপেক্ষা`,
  ),
};

const CREDENTIAL_TERM = String.raw`(?:otp|o\.t\.p|pin(?:\s*(?:number|code))?|password|passcode|cvv|verification code|security code|one[- ]time (?:code|password))`;
const CREDENTIAL_ASK = [
  re(String.raw`\b(?:tell|give|send|share)\s+(?:me|us)\s+(?:(?:the|your|that|this)\s+)?(?:\w+\s+){0,2}code\b`),
  re(
    String.raw`(?:ওটিপি|পিন|পাসওয়ার্ড|কোড)[^।.!?]{0,40}?(?:আমাকে|আমাদের|এজেন্টকে|প্রতিনিধিকে)\s*(?:দিন|দাও|দেন|বলুন|বলেন|পাঠান|জানান)(?=$|[\s।,.!?])`,
  ),
  re(
    String.raw`\b(?:share|send|give|tell|provide|forward|reply with|call (?:us )?with)\s+(?:(?:me|us|your|the|that|this|our|agent|him|her)\s+){0,3}${CREDENTIAL_TERM}\b`,
  ),
  re(String.raw`\b(?:otp|pin|password|code)\s*(?:ta|ti|number|code|ti)?\s*(?:din|den|dao|bolen|bolun|pathan|janan)\b`),
  re(
    String.raw`(?:ওটিপি|পিন|পাসওয়ার্ড|সিভিভি|ভেরিফিকেশন কোড|কোড)(?:টি|টা)?\s*(?:নম্বর\s*|নাম্বার\s*)?(?:আমাদের\s*|আমাকে\s*|এজেন্টকে\s*)?(?:দিন|দাও|দেন|বলুন|বলেন|পাঠান|জানান|শেয়ার করুন)(?=$|[\s।,.!?])`,
  ),
];
const CREDENTIAL_ENTRY = re(
  String.raw`\b(?:enter|verify|confirm|submit|update)\s+(?:(?:your|the|this)\s+){0,2}${CREDENTIAL_TERM}\b|(?:ওটিপি|পিন|পাসওয়ার্ড)(?:টি|টা)?\s*(?:নম্বর\s*)?(?:লিখুন|প্রবেশ করান|ভেরিফাই করুন)`,
);
const NEGATION = re(
  String.raw`\b(?:do not|don't|dont|never|not|won't|will not)\b|কাউকে|করবেন না|দিবেন না|দেবেন না|বলবেন না|জানাবেন না|\bna\b|কখনো`,
);

const signal = (
  id: string,
  severity: Severity,
  title: L10n,
  detail: L10n,
  evidence: (string | undefined)[] = [],
  source?: Signal["source"],
): Signal => ({
  id,
  severity,
  title,
  detail,
  evidence: evidence.filter((value): value is string => Boolean(value)),
  origin: "rule",
  source,
});

const SENTENCE_SPLIT = /(?<=[.!?।])\s+|\n+/u;

function checkCredentials(text: string, links: LinkInfo[]): Signal[] {
  const hasUnofficialLink = links.some((link) => !link.isOfficial);
  for (const sentence of text.split(SENTENCE_SPLIT)) {
    if (NEGATION.test(sentence)) continue;
    const asks = CREDENTIAL_ASK.some((pattern) => pattern.test(sentence));
    const entersOnLink = hasUnofficialLink && CREDENTIAL_ENTRY.test(sentence);
    if (asks || entersOnLink) {
      return [
        signal(
          "credential_request",
          "critical",
          { en: "Asks for your PIN, OTP or password", bn: "আপনার পিন, ওটিপি বা পাসওয়ার্ড চাইছে" },
          {
            en: "Banks, mobile wallets and government offices never need these from you. Whoever has them can empty your account.",
            bn: "ব্যাংক, মোবাইল ওয়ালেট বা সরকারি অফিসের এগুলো আপনার কাছ থেকে দরকার হয় না। এগুলো পেলে যে কেউ আপনার অ্যাকাউন্ট খালি করতে পারে।",
          },
          [sentence.trim()],
          DMP_SOURCE,
        ),
      ];
    }
  }
  return [];
}

const BRAND_NAMES: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  upay: "Upay",
  dutchbangla: "Dutch-Bangla Bank",
  bangladeshbank: "Bangladesh Bank",
  communitybank: "Community Bank",
  police: "the police",
};

const brandName = (token: string) => BRAND_NAMES[token] ?? token.toUpperCase();

function checkLinks(links: LinkInfo[], isTrafficFine: boolean): Signal[] {
  const signals: Signal[] = [];
  for (const link of links) {
    if (link.isOfficial) {
      signals.push(
        signal(
          `official_link:${link.host}`,
          "info",
          { en: `The link goes to an official domain (${link.domain})`, bn: `লিংকটি অফিসিয়াল ডোমেইনে যায় (${link.domain})` },
          {
            en: "A good sign, but it doesn't confirm that the rest of the message is genuine.",
            bn: "এটি ভালো লক্ষণ, তবে এতে মেসেজের বাকি অংশ সত্য বলে নিশ্চিত হয় না।",
          },
          [link.raw],
        ),
      );
      continue;
    }

    if (link.isKnownBad) {
      signals.push(
        signal(
          `known_bad:${link.host}`,
          "critical",
          { en: "This link has been named in a scam report", bn: "এই লিংকটি প্রতারণার প্রতিবেদনে উল্লেখ করা হয়েছে" },
          {
            en: `${link.host} appears in published reports about this scam. Don't open it.`,
            bn: `${link.host} এই প্রতারণা নিয়ে প্রকাশিত প্রতিবেদনে এসেছে। এটি খুলবেন না।`,
          },
          [link.raw],
          {
            label: "Desh Rupantor",
            url: "https://www.deshrupantor.com/692664",
          },
        ),
      );
    } else if (link.imitates) {
      signals.push(
        signal(
          `lookalike:${link.host}`,
          "critical",
          { en: `The link imitates ${brandName(link.imitates)}`, bn: `লিংকটি ${brandName(link.imitates)}-এর নকল করছে` },
          {
            en: `${link.host} uses a familiar name, but it isn't an official domain. Fake sites often copy the real page exactly.`,
            bn: `${link.host} পরিচিত নাম ব্যবহার করছে, কিন্তু এটি অফিসিয়াল ডোমেইন নয়। ভুয়া সাইট প্রায়ই আসল পেজ হুবহু নকল করে।`,
          },
          [link.raw],
        ),
      );
    }

    if (link.isIp || link.isPunycode) {
      signals.push(
        signal(
          `odd_host:${link.host}`,
          "high",
          { en: "The link hides its real address", bn: "লিংকটি আসল ঠিকানা লুকাচ্ছে" },
          {
            en: "It uses a raw IP address or disguised characters. Genuine services don't send links like this.",
            bn: "এতে সরাসরি আইপি ঠিকানা বা ছদ্মবেশী অক্ষর ব্যবহার করা হয়েছে। আসল সেবা এমন লিংক পাঠায় না।",
          },
          [link.raw],
        ),
      );
    }
    if (link.isShortener) {
      signals.push(
        signal(
          `shortener:${link.host}`,
          "medium",
          { en: "A short link hides where it leads", bn: "ছোট লিংকটি গন্তব্য লুকিয়ে রাখছে" },
          {
            en: "You can't tell where it goes until you open it. Real companies use these too, so it isn't proof of a scam.",
            bn: "না খোলা পর্যন্ত এটি কোথায় যাবে তা বোঝা যায় না। আসল প্রতিষ্ঠানও এগুলো ব্যবহার করে, তাই এটি প্রতারণার প্রমাণ নয়।",
          },
          [link.raw],
        ),
      );
    }
    if (link.isRiskySuffix && !link.isKnownBad && !link.imitates) {
      signals.push(
        signal(
          `risky_suffix:${link.host}`,
          "medium",
          { en: `The link uses a cheap web ending (.${link.suffix})`, bn: `লিংকটিতে সস্তা ওয়েব এন্ডিং আছে (.${link.suffix})` },
          {
            en: "Endings like this are cheap to register and common in throwaway sites. Some genuine sites use them too.",
            bn: "এ ধরনের এন্ডিং সস্তায় নেওয়া যায় এবং স্বল্পমেয়াদি সাইটে বেশি দেখা যায়। কিছু আসল সাইটও এগুলো ব্যবহার করে।",
          },
          [link.raw],
        ),
      );
    }
    if (isTrafficFine) {
      signals.push(
        signal(
          `fine_link:${link.host}`,
          "critical",
          {
            en: "A traffic fine message with a non-government payment link",
            bn: "ট্রাফিক জরিমানার মেসেজে অ-সরকারি পেমেন্ট লিংক",
          },
          {
            en: "BRTA and DMP say they don't send payment links from personal or generic numbers. DMP says official notices go by post to the owner's registered address.",
            bn: "বিআরটিএ ও ডিএমপি বলছে, তারা ব্যক্তিগত বা সাধারণ নম্বর থেকে পেমেন্ট লিংক পাঠায় না। ডিএমপি বলছে, অফিসিয়াল নোটিশ মালিকের নিবন্ধিত ঠিকানায় ডাকে যায়।",
          },
          [link.raw],
          FINE_SCAM_SOURCE,
        ),
      );
    }
  }
  return signals;
}

function normaliseSender(sender: string): { kind: "none" | "alpha" | "bd_mobile" | "foreign" | "other"; digits: string } {
  const trimmed = sender.trim();
  if (!trimmed) return { kind: "none", digits: "" };
  const latinDigits = trimmed.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const digits = latinDigits.replace(/\D/g, "");
  if (/[a-z]/i.test(latinDigits) && digits.length < 7) return { kind: "alpha", digits };
  if (/^(?:\+?880|00880)?1[3-9]\d{8}$/.test(latinDigits.replace(/[\s-]/g, ""))) {
    return { kind: "bd_mobile", digits: `0${digits.slice(-10)}` };
  }
  if (/^(?:\+|00)/.test(latinDigits)) return { kind: "foreign", digits };
  if (/^01[3-9]\d{8}$/.test(digits)) return { kind: "bd_mobile", digits };
  return { kind: "other", digits };
}

function checkSender(sender: string, text: string): Signal[] {
  const { kind, digits } = normaliseSender(sender);
  const namesInstitution = P.institution.test(text);
  if (kind === "foreign") {
    return [
      signal(
        "foreign_sender",
        namesInstitution ? "high" : "medium",
        { en: "Sent from a foreign number", bn: "বিদেশি নম্বর থেকে পাঠানো" },
        {
          en: namesInstitution
            ? `${sender.trim()} isn't a Bangladeshi number, yet the message speaks for a local organisation. Reports of the BRTA fine scam mention foreign senders such as +63 numbers.`
            : `${sender.trim()} isn't a Bangladeshi number. Be careful if you weren't expecting it.`,
          bn: namesInstitution
            ? `${sender.trim()} বাংলাদেশি নম্বর নয়, অথচ মেসেজটি দেশীয় প্রতিষ্ঠানের নামে। বিআরটিএ জরিমানা প্রতারণার প্রতিবেদনে +৬৩-এর মতো বিদেশি নম্বরের কথা এসেছে।`
            : `${sender.trim()} বাংলাদেশি নম্বর নয়। আপনি এটি আশা না করলে সতর্ক থাকুন।`,
        },
        [],
        namesInstitution ? FINE_SCAM_SOURCE : undefined,
      ),
    ];
  }
  if (kind === "bd_mobile" && OFFICIAL_DMP_SENDERS.has(digits)) {
    return [
      signal(
        "official_dmp_sender",
        "info",
        { en: "The sender matches a number DMP has published", bn: "প্রেরকের নম্বর ডিএমপির প্রকাশিত নম্বরের সাথে মিলেছে" },
        {
          en: "It's a good sign, but it isn't proof because sender numbers can be faked. DMP also says it never asks for PINs or OTPs.",
          bn: "এটি ভালো লক্ষণ, তবে প্রমাণ নয়, কারণ প্রেরকের নম্বর নকল করা যায়। ডিএমপি আরও জানিয়েছে, তারা কখনো পিন বা ওটিপি চায় না।",
        },
        [],
        DMP_SOURCE,
      ),
    ];
  }
  if (kind === "bd_mobile" && namesInstitution) {
    return [
      signal(
        "personal_sender",
        "medium",
        { en: "An organisation's message from a personal number", bn: "ব্যক্তিগত নম্বর থেকে প্রতিষ্ঠানের নামে মেসেজ" },
        {
          en: "Organisations usually send alerts from a named sender, not an ordinary mobile number.",
          bn: "প্রতিষ্ঠানগুলো সাধারণত সাধারণ মোবাইল নম্বর নয়, নামযুক্ত প্রেরক থেকে বার্তা পাঠায়।",
        },
      ),
    ];
  }
  return [];
}

function matchText(pattern: RegExp, text: string): string | undefined {
  return pattern.exec(text)?.[0];
}

export type RuleOutcome = {
  text: string;
  scenario: Scenario;
  signals: Signal[];
  links: LinkInfo[];
};

export function runRules(rawText: string, sender = ""): RuleOutcome {
  const text = rawText.normalize("NFC").trim();
  const links = extractLinks(text);
  const signals: Signal[] = [];
  let scenario: Scenario = "other";

  const isTrafficFine = P.trafficFine.test(text);
  if (isTrafficFine) scenario = "traffic_fine";

  signals.push(...checkCredentials(text, links));
  signals.push(...checkLinks(links, isTrafficFine));
  signals.push(...checkSender(sender, text));

  const hasPersonalPayment = P.personalPayment.test(text);
  if (hasPersonalPayment) {
    signals.push(
      signal(
        "personal_payment",
        isTrafficFine ? "critical" : "medium",
        { en: "Asks for payment to a personal wallet", bn: "ব্যক্তিগত ওয়ালেটে টাকা চাইছে" },
        {
          en: isTrafficFine
            ? "DMP lists Upay and CBL as its traffic fine payment channels, not an individual's mobile number."
            : "Money sent to a personal number is very hard to get back. Be sure who you're paying first.",
          bn: isTrafficFine
            ? "ডিএমপি ট্রাফিক জরিমানা পরিশোধের মাধ্যম হিসেবে উপায় ও সিবিএলের কথা জানিয়েছে, কারও ব্যক্তিগত মোবাইল নম্বর নয়।"
            : "ব্যক্তিগত নম্বরে পাঠানো টাকা ফেরত পাওয়া খুব কঠিন। আগে নিশ্চিত হোন আপনি কাকে টাকা দিচ্ছেন।",
        },
        [matchText(P.personalPayment, text)],
        isTrafficFine ? DMP_SOURCE : undefined,
      ),
    );
  }

  if (isTrafficFine && P.fastPayDiscount.test(text)) {
    signals.push(
      signal(
        "fast_pay_discount",
        "high",
        { en: "Offers a discount for paying quickly", bn: "দ্রুত পরিশোধে ছাড় দিচ্ছে" },
        {
          en: "One reported victim of this scam was told a Tk 3,000 fine would be halved if paid within 48 hours. It pushes you to pay before you check.",
          bn: "এই প্রতারণার এক ভুক্তভোগীকে বলা হয়েছিল, ৪৮ ঘণ্টার মধ্যে দিলে ৩,০০০ টাকার জরিমানা অর্ধেক হবে। এতে যাচাইয়ের আগেই টাকা দেওয়ার চাপ তৈরি হয়।",
        },
        [matchText(P.fastPayDiscount, text)],
        { label: "The Financial Express", url: "https://thefinancialexpress.com.bd/home/three-held-over-fake-traffic-fine-scam" },
      ),
    );
  }

  const patternSignals: [RegExp, string, Severity, Scenario | null, L10n, L10n][] = [
    [
      P.wrongSend,
      "wrong_send",
      "high",
      "wrong_send",
      { en: 'The "money sent by mistake" trick', bn: '"ভুলে টাকা পাঠিয়েছি" কৌশল' },
      {
        en: "Check your real balance in the app, not the SMS. Scammers send fake payment messages and ask you to return money you never received.",
        bn: "এসএমএস নয়, অ্যাপে আসল ব্যালেন্স দেখুন। প্রতারকরা ভুয়া পেমেন্ট মেসেজ পাঠিয়ে যে টাকা আপনি পাননি তা ফেরত চায়।",
      },
    ],
    [
      P.accountAlert,
      "account_alert",
      "high",
      "account_alert",
      { en: "Warns that your account or SIM will be blocked", bn: "অ্যাকাউন্ট বা সিম বন্ধের ভয় দেখাচ্ছে" },
      {
        en: "Fear of losing access is a common way to rush you. Check by opening the official app or calling the number on your card.",
        bn: "অ্যাক্সেস হারানোর ভয় দেখিয়ে তাড়াহুড়ো করানো একটি সাধারণ কৌশল। অফিসিয়াল অ্যাপ খুলে বা কার্ডে থাকা নম্বরে কল করে যাচাই করুন।",
      },
    ],
    [
      P.jobTask,
      "job_task",
      "high",
      "job_task",
      { en: "Promises easy online income", bn: "সহজ অনলাইন আয়ের প্রতিশ্রুতি দিচ্ছে" },
      {
        en: "Task job scams often pay a small amount first, then ask for larger deposits to unlock your earnings.",
        bn: "টাস্ক জবের প্রতারণায় অনেক সময় প্রথমে অল্প টাকা দেয়, তারপর আয় তুলতে আরও বড় অঙ্কের টাকা জমা দিতে বলে।",
      },
    ],
    [
      P.upfrontFee,
      "upfront_fee",
      "high",
      null,
      { en: "You have to pay before you get anything", bn: "কিছু পাওয়ার আগেই টাকা দিতে হবে" },
      {
        en: "A fee up front is the core of many job, loan and prize scams. Genuine employers don't charge you for a job.",
        bn: "আগাম ফি অনেক চাকরি, লোন ও পুরস্কার প্রতারণার মূল কৌশল। আসল নিয়োগকর্তা চাকরির জন্য টাকা নেয় না।",
      },
    ],
    [
      P.prize,
      "prize",
      links.some((link) => !link.isOfficial) || hasPersonalPayment ? "high" : "medium",
      "prize",
      { en: "Says you've won something you didn't enter", bn: "অংশ না নিয়েও জেতার কথা বলছে" },
      {
        en: "If you didn't enter a draw, you can't win it. Claiming these prizes usually means paying a fee or sharing your details.",
        bn: "কোনো ড্রতে অংশ না নিলে আপনি জিততে পারেন না। এসব পুরস্কার নিতে সাধারণত ফি দিতে বা তথ্য দিতে হয়।",
      },
    ],
    [
      P.relative,
      "relative",
      "high",
      "relative",
      { en: "Someone claims to be a relative in trouble", bn: "আত্মীয় পরিচয়ে বিপদের কথা বলছে" },
      {
        en: "Before you send anything, call the person on the number you already have for them.",
        bn: "টাকা পাঠানোর আগে আপনার কাছে আগে থেকে থাকা নম্বরে সেই ব্যক্তিকে ফোন করুন।",
      },
    ],
    [
      P.investment,
      "investment",
      "high",
      "investment",
      { en: "Promises guaranteed investment profit", bn: "বিনিয়োগে নিশ্চিত লাভের প্রতিশ্রুতি দিচ্ছে" },
      {
        en: "No real investment can guarantee profit. Fake groups often show invented earnings to build trust.",
        bn: "কোনো আসল বিনিয়োগ নিশ্চিত লাভ দিতে পারে না। ভুয়া গ্রুপ বিশ্বাস তৈরি করতে প্রায়ই বানানো আয় দেখায়।",
      },
    ],
    [
      P.loan,
      "loan",
      "medium",
      "loan",
      { en: "An instant loan offer", bn: "তাৎক্ষণিক লোনের প্রস্তাব" },
      {
        en: "Check that the lender is licensed. Be careful with apps that ask for a fee first or want access to your contacts.",
        bn: "ঋণদাতার লাইসেন্স আছে কি না যাচাই করুন। আগে ফি চাওয়া বা কন্টাক্টে অ্যাক্সেস চাওয়া অ্যাপ থেকে সাবধান থাকুন।",
      },
    ],
    [
      P.threat,
      "threat",
      "medium",
      null,
      { en: "Threatens legal trouble", bn: "আইনি ঝামেলার ভয় দেখাচ্ছে" },
      {
        en: "Fear makes people act before they check. Real legal notices can be confirmed with the office itself.",
        bn: "ভয়ে মানুষ যাচাইয়ের আগেই কাজ করে ফেলে। আসল আইনি নোটিশ সংশ্লিষ্ট অফিস থেকে নিশ্চিত করা যায়।",
      },
    ],
    [
      P.urgency,
      "urgency",
      "medium",
      null,
      { en: "Rushes you to act now", bn: "এখনই কাজ করতে চাপ দিচ্ছে" },
      {
        en: "A tight deadline leaves less time to check. Taking a few minutes is almost always safe.",
        bn: "কম সময় বেঁধে দিলে যাচাই করার সময় কমে যায়। কয়েক মিনিট সময় নেওয়া প্রায় সবসময়ই নিরাপদ।",
      },
    ],
  ];

  for (const [pattern, id, severity, patternScenario, title, detail] of patternSignals) {
    const found = matchText(pattern, text);
    if (!found) continue;
    signals.push(signal(id, severity, title, detail, [found]));
    if (patternScenario && scenario === "other") scenario = patternScenario;
  }

  const injection = matchText(P.promptInjection, text);
  if (injection) {
    signals.push(
      signal(
        "prompt_injection",
        "high",
        { en: "Tries to manipulate automated checkers", bn: "স্বয়ংক্রিয় যাচাই ব্যবস্থাকে প্রভাবিত করার চেষ্টা" },
        {
          en: "Normal messages don't give instructions to AI tools. This wording may be trying to get the message marked as safe.",
          bn: "সাধারণ মেসেজ এআই টুলকে নির্দেশ দেয় না। এই কথাগুলো মেসেজটিকে নিরাপদ দেখানোর চেষ্টা হতে পারে।",
        },
        [injection],
      ),
    );
  }

  return { text, scenario, signals, links };
}
