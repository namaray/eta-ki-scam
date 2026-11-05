import type { L10n } from "./types";

export const TACTIC_IDS = [
  "impersonation",
  "sensitive_info",
  "upfront_payment",
  "too_good_to_be_true",
  "emotional_pressure",
  "urgency",
  "threat",
  "secrecy",
  "suspicious_link",
  "unverifiable_claim",
] as const;

export type TacticId = (typeof TACTIC_IDS)[number];

/**
 * The model picks a tactic and quotes the message, but this wording is ours. The available models
 * write unreliable Bangla, and safety advice is too important to leave to them.
 */
export const TACTICS: Record<TacticId, { name: L10n; explanation: L10n }> = {
  impersonation: {
    name: { en: "Pretends to be someone you trust", bn: "বিশ্বস্ত কেউ সেজে কথা বলছে" },
    explanation: {
      en: "Scammers borrow the name of an office, company or person to lower your guard. Contact them directly to check.",
      bn: "প্রতারকরা কোনো অফিস, প্রতিষ্ঠান বা ব্যক্তির নাম ব্যবহার করে, যাতে আপনি সহজে বিশ্বাস করেন। তাদের সাথে সরাসরি যোগাযোগ করে যাচাই করুন।",
    },
  },
  sensitive_info: {
    name: { en: "Asks for private information", bn: "ব্যক্তিগত তথ্য চাইছে" },
    explanation: {
      en: "Codes, card details and ID numbers can be used to get into your accounts. Don't share them with someone who contacted you first.",
      bn: "কোড, কার্ডের তথ্য ও পরিচয়পত্রের নম্বর দিয়ে আপনার অ্যাকাউন্টে ঢোকা যেতে পারে। যে নিজে থেকে যোগাযোগ করেছে, তাকে এগুলো দেবেন না।",
    },
  },
  upfront_payment: {
    name: { en: "Wants money before you get anything", bn: "কিছু পাওয়ার আগেই টাকা চাইছে" },
    explanation: {
      en: "Once you've paid, the sender may disappear or keep asking for more. Be sure the offer is real first.",
      bn: "টাকা পাওয়ার পর প্রেরক হারিয়ে যেতে পারে বা আরও টাকা চাইতে পারে। আগে নিশ্চিত হোন প্রস্তাবটি আসল কি না।",
    },
  },
  too_good_to_be_true: {
    name: { en: "Sounds too good to be true", bn: "প্রস্তাবটি অবিশ্বাস্য রকমের ভালো" },
    explanation: {
      en: "Big rewards for little effort are a common hook. Ask why this person is offering it to you.",
      bn: "অল্প পরিশ্রমে বড় লাভের কথা বলে ফাঁদে ফেলা একটি সাধারণ কৌশল। ভাবুন, এই ব্যক্তি কেন আপনাকেই এটি দিতে চাইছে।",
    },
  },
  emotional_pressure: {
    name: { en: "Plays on your emotions", bn: "আবেগকে কাজে লাগাচ্ছে" },
    explanation: {
      en: "Worry, sympathy or excitement can make you act before you think. Pause and talk to someone you trust.",
      bn: "দুশ্চিন্তা, মায়া বা উত্তেজনায় মানুষ না ভেবেই কাজ করে ফেলে। একটু থামুন এবং বিশ্বস্ত কারও সাথে কথা বলুন।",
    },
  },
  urgency: {
    name: { en: "Rushes you to act now", bn: "এখনই কাজ করতে চাপ দিচ্ছে" },
    explanation: {
      en: "A tight deadline leaves less time to check. Taking a few minutes is almost always safe.",
      bn: "কম সময় বেঁধে দিলে যাচাই করার সময় কমে যায়। কয়েক মিনিট সময় নেওয়া প্রায় সবসময়ই নিরাপদ।",
    },
  },
  threat: {
    name: { en: "Uses threats to scare you", bn: "ভয় দেখাচ্ছে" },
    explanation: {
      en: "Fear makes people act before they check. Confirm any real problem through an official contact.",
      bn: "ভয়ে মানুষ যাচাইয়ের আগেই কাজ করে ফেলে। সত্যিই সমস্যা আছে কি না, অফিসিয়াল মাধ্যমে নিশ্চিত হোন।",
    },
  },
  secrecy: {
    name: { en: "Tells you to keep it secret", bn: "গোপন রাখতে বলছে" },
    explanation: {
      en: "Scammers don't want anyone to warn you. Tell someone you trust before you do anything.",
      bn: "প্রতারকরা চায় না কেউ আপনাকে সতর্ক করুক। কিছু করার আগে বিশ্বস্ত কাউকে জানান।",
    },
  },
  suspicious_link: {
    name: { en: "Pushes you towards a link", bn: "লিংকে যেতে চাপ দিচ্ছে" },
    explanation: {
      en: "Fake pages can look real and steal what you type. Go to the official app or website yourself instead.",
      bn: "ভুয়া পেজ দেখতে আসলের মতো হতে পারে এবং আপনার লেখা তথ্য চুরি করতে পারে। লিংকে না গিয়ে নিজে অফিসিয়াল অ্যাপ বা ওয়েবসাইটে যান।",
    },
  },
  unverifiable_claim: {
    name: { en: "Makes a claim you can't easily check", bn: "এমন দাবি করছে যা সহজে যাচাই করা যায় না" },
    explanation: {
      en: "Don't rely on the message's own word. Find the person or organisation's contact details yourself.",
      bn: "শুধু মেসেজের কথায় ভরসা করবেন না। ব্যক্তি বা প্রতিষ্ঠানের যোগাযোগের তথ্য নিজে খুঁজে নিন।",
    },
  },
};
