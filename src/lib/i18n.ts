import type { Scenario, Stage, Verdict } from "./types";

export type Lang = "en" | "bn";

type Copy = {
  heading: string;
  subheading: string;
  upload: string;
  dragHint: string;
  noScreenshot: string;
  backToUpload: string;
  messageLabel: string;
  messagePlaceholder: string;
  senderLabel: string;
  senderPlaceholder: string;
  check: string;
  screenshotAlt: string;
  examplesHeading: string;
  examplesNote: string;
  exampleTag: string;
  stages: Record<Stage, string>;
  privacy: string;
  verdicts: Record<Verdict, { label: string; note: string }>;
  scenario: Record<Scenario, string>;
  checkedBy: string;
  aiMissing: string;
  checkAnother: string;
  actionsHeading: string;
  emergencyHeading: string;
  emergency: string[];
  whyHeading: string;
  noSignals: string;
  seeAllReasons: (count: number) => string;
  sourceLabel: string;
  messageHeading: string;
  screenshotNote: string;
  fixText: string;
  followUpHeading: string;
  yes: string;
  no: string;
  unsure: string;
  rechecking: string;
  warnFamily: string;
  whatsapp: string;
  copy: string;
  copied: string;
  warningText: (scenario: string) => string;
  errors: Record<"no_message" | "image_needs_ai" | "busy" | "rate_limited" | "invalid" | "network", string>;
  disclaimer: string;
  imageUnreadable: string;
};

export const COPY: Record<Lang, Copy> = {
  en: {
    heading: "Is this message a scam?",
    subheading: "Send us a screenshot. We'll tell you if it looks risky and what to do next.",
    upload: "Choose a screenshot",
    dragHint: "or drag it here",
    noScreenshot: "No screenshot? Type or paste the message",
    backToUpload: "Use a screenshot instead",
    messageLabel: "The message",
    messagePlaceholder: "Type or paste the message here…",
    senderLabel: "Who sent it? (you can skip this)",
    senderPlaceholder: "Number or name",
    check: "Check this message",
    screenshotAlt: "Your screenshot",
    examplesHeading: "Try an example",
    examplesNote: "Tap one to see how it works. These are made-up examples with dummy numbers.",
    exampleTag: "Example",
    stages: {
      reading: "Reading your screenshot…",
      rules: "Checking the link and sender…",
      domains: "Checking the website…",
      ai: "Almost done. Reading the message carefully…",
    },
    privacy: "We don't save your messages. They're sent to AI services to be checked, and a backup service may use them to improve its products, so please hide any passwords or codes first.",
    verdicts: {
      likely_scam: { label: "This looks like a scam", note: "Don't tap, pay or reply." },
      suspicious: { label: "Be careful with this one", note: "Some things here don't add up. Check before you do anything." },
      no_red_flags: { label: "No warning signs found", note: "This doesn't prove it's safe, so still be careful if you weren't expecting it." },
      unchecked: { label: "We couldn't fully check this", note: "We found nothing wrong, but that doesn't mean it's safe." },
    },
    scenario: {
      traffic_fine: "fake traffic fine",
      account_alert: "account or SIM block threat",
      wrong_send: "\"money sent by mistake\"",
      prize: "fake prize",
      job_task: "fake online job",
      investment: "fake investment",
      relative: "relative in trouble",
      loan: "instant loan",
      shop: "online shop",
      other: "suspicious",
    },
    checkedBy: "Checked by AI and our safety rules.",
    aiMissing: "Our AI check isn't available right now, so this comes from our safety rules only.",
    checkAnother: "Check another message",
    actionsHeading: "What to do now",
    emergencyHeading: "Already tapped, paid or shared a code?",
    emergency: [
      "Call your wallet or bank helpline right away and tell them what happened. bKash: 16247. Nagad: 16167.",
      "Change your PIN and passwords using the official app, not the link in the message.",
      "Keep your screenshots and transaction IDs, then file a General Diary (GD) at your police station. In an emergency, call 999.",
    ],
    whyHeading: "Why we think this",
    noSignals: "We didn't find any specific warning signs in this message.",
    seeAllReasons: (count) => `See ${count} more`,
    sourceLabel: "Source",
    messageHeading: "The message, with warning signs marked",
    screenshotNote: "We read this from your screenshot and may have got some words wrong.",
    fixText: "Fix the text and check again",
    followUpHeading: "One quick question",
    yes: "Yes",
    no: "No",
    unsure: "Not sure",
    rechecking: "Checking again with your answer…",
    warnFamily: "Warn your family and friends",
    whatsapp: "Share on WhatsApp",
    copy: "Copy warning",
    copied: "Copied",
    warningText: (scenario) =>
      `Scam alert: watch out for ${scenario} messages. Don't tap their links or share a PIN or OTP. Check suspicious messages at`,
    errors: {
      no_message: "We couldn't find a message in that image. Try a clearer screenshot or type the message.",
      image_needs_ai: "We can't read screenshots right now. Please type or paste the message instead.",
      busy: "We're a bit busy right now. Wait a minute and try again, or type the message instead.",
      rate_limited: "Too many checks in a short time. Please wait a few minutes and try again.",
      invalid: "Please type or paste the message first.",
      network: "We couldn't connect. Check your internet and try again.",
    },
    disclaimer: "Eta Ki Scam? gives guidance, not a guarantee, and can be wrong. It isn't connected to BRTA, DMP, bKash, Nagad or any bank.",
    imageUnreadable: "We couldn't open that image. Please try a JPG or PNG screenshot.",
  },
  bn: {
    heading: "এই মেসেজটি কি প্রতারণা?",
    subheading: "একটি স্ক্রিনশট দিন। এটি ঝুঁকিপূর্ণ মনে হচ্ছে কি না এবং এখন কী করবেন, তা আমরা জানাব।",
    upload: "স্ক্রিনশট বেছে নিন",
    dragHint: "অথবা এখানে টেনে আনুন",
    noScreenshot: "স্ক্রিনশট নেই? মেসেজটি লিখুন বা পেস্ট করুন",
    backToUpload: "বরং স্ক্রিনশট দিন",
    messageLabel: "মেসেজ",
    messagePlaceholder: "মেসেজটি এখানে লিখুন বা পেস্ট করুন…",
    senderLabel: "কে পাঠিয়েছে? (না দিলেও চলবে)",
    senderPlaceholder: "নম্বর বা নাম",
    check: "মেসেজটি যাচাই করুন",
    screenshotAlt: "আপনার স্ক্রিনশট",
    examplesHeading: "একটি উদাহরণ দেখুন",
    examplesNote: "কীভাবে কাজ করে দেখতে একটিতে ট্যাপ করুন। এগুলো বানানো উদাহরণ, এবং নম্বরগুলোও ডামি।",
    exampleTag: "উদাহরণ",
    stages: {
      reading: "আপনার স্ক্রিনশট পড়া হচ্ছে…",
      rules: "লিংক ও প্রেরক দেখা হচ্ছে…",
      domains: "ওয়েবসাইটটি দেখা হচ্ছে…",
      ai: "প্রায় শেষ। মেসেজটি ভালোভাবে পড়া হচ্ছে…",
    },
    privacy: "আমরা আপনার মেসেজ সংরক্ষণ করি না। যাচাইয়ের জন্য এগুলো এআই সেবায় পাঠানো হয়, এবং একটি ব্যাকআপ সেবা তাদের পণ্য উন্নত করতে এগুলো ব্যবহার করতে পারে, তাই আগে পাসওয়ার্ড বা কোড ঢেকে দিন।",
    verdicts: {
      likely_scam: { label: "এটি সম্ভবত প্রতারণা", note: "ট্যাপ করবেন না, টাকা দেবেন না, উত্তরও দেবেন না।" },
      suspicious: { label: "এটি নিয়ে সাবধান থাকুন", note: "কিছু বিষয় মিলছে না। কিছু করার আগে যাচাই করুন।" },
      no_red_flags: { label: "কোনো সতর্ক সংকেত পাইনি", note: "এতে প্রমাণ হয় না যে এটি নিরাপদ। আপনি এটি আশা না করলে সাবধান থাকুন।" },
      unchecked: { label: "পুরোপুরি যাচাই করা যায়নি", note: "আমরা কোনো সমস্যা পাইনি, তবে এর মানে এই নয় যে এটি নিরাপদ।" },
    },
    scenario: {
      traffic_fine: "ভুয়া ট্রাফিক জরিমানার",
      account_alert: "অ্যাকাউন্ট বা সিম বন্ধের ভয় দেখানো",
      wrong_send: "\"ভুলে টাকা পাঠিয়েছি\" ধরনের",
      prize: "ভুয়া পুরস্কারের",
      job_task: "ভুয়া অনলাইন চাকরির",
      investment: "ভুয়া বিনিয়োগের",
      relative: "আত্মীয়ের বিপদের নামে",
      loan: "তাৎক্ষণিক লোনের",
      shop: "অনলাইন শপের",
      other: "সন্দেহজনক",
    },
    checkedBy: "এআই ও আমাদের নিরাপত্তা নিয়ম দিয়ে যাচাই করা হয়েছে।",
    aiMissing: "এই মুহূর্তে এআই যাচাই পাওয়া যাচ্ছে না, তাই ফলাফলটি শুধু আমাদের নিরাপত্তা নিয়ম থেকে এসেছে।",
    checkAnother: "আরেকটি মেসেজ যাচাই করুন",
    actionsHeading: "এখন কী করবেন",
    emergencyHeading: "ইতিমধ্যে ট্যাপ করেছেন, টাকা বা কোড দিয়েছেন?",
    emergency: [
      "এখনই ওয়ালেট বা ব্যাংকের হেল্পলাইনে ফোন করে ঘটনাটি জানান। বিকাশ: ১৬২৪৭। নগদ: ১৬১৬৭।",
      "মেসেজের লিংক নয়, অফিসিয়াল অ্যাপ ব্যবহার করে পিন ও পাসওয়ার্ড বদলান।",
      "স্ক্রিনশট ও ট্রানজ্যাকশন আইডি রাখুন, তারপর থানায় সাধারণ ডায়েরি (জিডি) করুন। জরুরি প্রয়োজনে ৯৯৯-এ ফোন করুন।",
    ],
    whyHeading: "কেন এমন মনে হচ্ছে",
    noSignals: "এই মেসেজে নির্দিষ্ট কোনো সতর্ক সংকেত পাইনি।",
    seeAllReasons: (count) => `আরও ${count.toLocaleString("bn-BD")}টি দেখুন`,
    sourceLabel: "সূত্র",
    messageHeading: "মেসেজটি, সতর্ক সংকেত চিহ্নিত করে",
    screenshotNote: "আমরা এটি আপনার স্ক্রিনশট থেকে পড়েছি, তাই কিছু শব্দ ভুল হতে পারে।",
    fixText: "লেখা ঠিক করে আবার যাচাই করুন",
    followUpHeading: "একটি ছোট প্রশ্ন",
    yes: "হ্যাঁ",
    no: "না",
    unsure: "নিশ্চিত নই",
    rechecking: "আপনার উত্তরসহ আবার যাচাই হচ্ছে…",
    warnFamily: "পরিবার ও বন্ধুদের সতর্ক করুন",
    whatsapp: "হোয়াটসঅ্যাপে শেয়ার করুন",
    copy: "সতর্কবার্তা কপি করুন",
    copied: "কপি হয়েছে",
    warningText: (scenario) =>
      `প্রতারণা সতর্কতা: ${scenario} মেসেজ থেকে সাবধান। এর লিংকে ট্যাপ করবেন না, পিন বা ওটিপি দেবেন না। সন্দেহজনক মেসেজ যাচাই করুন:`,
    errors: {
      no_message: "ছবিতে কোনো মেসেজ পাইনি। আরও পরিষ্কার স্ক্রিনশট দিন বা মেসেজটি লিখুন।",
      image_needs_ai: "এই মুহূর্তে স্ক্রিনশট পড়া যাচ্ছে না। অনুগ্রহ করে মেসেজটি লিখুন বা পেস্ট করুন।",
      busy: "আমরা এখন একটু ব্যস্ত। এক মিনিট পর আবার চেষ্টা করুন, অথবা মেসেজটি লিখুন।",
      rate_limited: "অল্প সময়ে অনেকবার যাচাই করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।",
      invalid: "আগে মেসেজটি লিখুন বা পেস্ট করুন।",
      network: "সংযোগ করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
    },
    disclaimer: "এটা কি স্ক্যাম? শুধু পরামর্শ দেয়, নিশ্চয়তা নয়, এবং এটি ভুলও হতে পারে। বিআরটিএ, ডিএমপি, বিকাশ, নগদ বা কোনো ব্যাংকের সাথে এর সম্পর্ক নেই।",
    imageUnreadable: "ছবিটি খোলা যায়নি। অনুগ্রহ করে JPG বা PNG স্ক্রিনশট দিন।",
  },
};

/** Made-up screenshots in public/samples. `text` is what each one shows, used if the screenshot reader is busy. */
export const SAMPLES: { id: string; image: string; label: Record<Lang, string>; text: string; sender: string }[] = [
  {
    id: "brta-fine",
    image: "/samples/brta-fine.png",
    label: { en: "BRTA fine SMS", bn: "বিআরটিএ জরিমানার এসএমএস" },
    sender: "+63 900 000 0000",
    text: "BRTA NOTICE: Your vehicle was caught speeding by AI camera. Fine Tk 3000 is due. Pay within 48 hours and pay only 50%. Otherwise legal action will be taken. Pay now: https://bspbrtcar-payfeebd.icu",
  },
  {
    id: "fake-support",
    image: "/samples/fake-support.png",
    label: { en: "bKash support call", bn: "বিকাশ কাস্টমার কেয়ার" },
    sender: "01700000001",
    text: "বিকাশ কাস্টমার কেয়ার থেকে বলছি। আপনার অ্যাকাউন্ট আজই বন্ধ হয়ে যাবে। এখনই আপনার ওটিপি কোডটি আমাদের দিন।",
  },
  {
    id: "online-job",
    image: "/samples/online-job.png",
    label: { en: "Online job offer", bn: "অনলাইন চাকরির প্রস্তাব" },
    sender: "01700000003",
    text: "Ghore boshe mobile diye daily 3000 taka income korun! Shudhu YouTube video like korben. Registration fee matro 500 taka. Bkash korun 01700000003 number e.",
  },
  {
    id: "normal-bkash",
    image: "/samples/normal-bkash.png",
    label: { en: "Normal bKash message", bn: "সাধারণ বিকাশ মেসেজ" },
    sender: "bKash",
    text: "You have received Tk 500.00 from 01700000002. Fee Tk 0.00. Balance Tk 1,250.50. TrxID AB12CD34EF at 03/11/2026 10:00",
  },
];
