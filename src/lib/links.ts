import { parse } from "tldts";

/** Registered domains we treat as genuine. All of *.gov.bd is added in `isOfficial`. */
const OFFICIAL_DOMAINS = new Set([
  "bb.org.bd",
  "bkash.com",
  "bka.sh",
  "nagad.com.bd",
  "upaybd.com",
  "dutchbanglabank.com",
  "communitybankbd.com",
]);

const BRAND_TOKENS = [
  "brta",
  "bkash",
  "nagad",
  "upay",
  "dbbl",
  "dutchbangla",
  "bangladeshbank",
  "communitybank",
  "dmp",
  "police",
];

/** Domains named in published warnings about active scams. */
const KNOWN_BAD_DOMAINS = new Set(["bspbrtcar-payfeebd.icu"]);

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.ly",
  "cutt.ly",
  "rb.gy",
  "is.gd",
  "goo.gl",
  "shorturl.at",
  "ow.ly",
  "tiny.cc",
  "rebrand.ly",
  "t.co",
  "s.id",
]);

const RISKY_SUFFIXES = new Set([
  "icu",
  "xyz",
  "top",
  "click",
  "buzz",
  "cfd",
  "sbs",
  "monster",
  "rest",
  "quest",
  "cyou",
  "lol",
  "vip",
  "link",
  "work",
  "site",
  "online",
]);

const BARE_DOMAIN_SUFFIXES =
  "com\\.bd|gov\\.bd|org\\.bd|net\\.bd|edu\\.bd|com|net|org|info|bd|xyz|top|icu|click|site|online|shop|live|link|buzz|vip|cc|ly|gl|co|io|app|cfd|sbs|monster|rest|quest|cyou|lol|work|sh|at|id|me";

const URL_PATTERN = new RegExp(
  `(?:(?:https?|hxxps?)://[^\\s<>"'“”]+)|(?:www\\.[^\\s<>"'“”]+)|(?<![@\\w.-])(?:[a-z0-9-]+\\.)+(?:${BARE_DOMAIN_SUFFIXES})(?:/[^\\s<>"'“”]*)?(?![\\w.-]*[\\w@])`,
  "gi",
);

export type LinkInfo = {
  raw: string;
  host: string;
  domain: string | null;
  suffix: string | null;
  isIp: boolean;
  isPunycode: boolean;
  isOfficial: boolean;
  isShortener: boolean;
  isKnownBad: boolean;
  isRiskySuffix: boolean;
  /** The brand a non-official host is imitating, if any. */
  imitates: string | null;
};

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function findImitatedBrand(host: string): string | null {
  const direct = BRAND_TOKENS.find((token) => host.includes(token));
  if (direct) return direct;
  const parts = host.split(/[.-]/);
  for (const token of BRAND_TOKENS) {
    if (token.length < 5) continue;
    if (parts.some((part) => part.length >= 4 && editDistance(part, token) === 1)) return token;
  }
  return null;
}

function normaliseCandidate(raw: string): string {
  return raw
    .replace(/[.,;:!?)\]।]+$/u, "")
    .replace(/\[\.\]|\(\.\)/g, ".")
    .replace(/^hxxp/i, "http");
}

export function extractLinks(text: string): LinkInfo[] {
  const deobfuscated = text.replace(/\[\.\]|\(\.\)/g, ".");
  const seen = new Set<string>();
  const links: LinkInfo[] = [];
  for (const match of deobfuscated.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(/[.,;:!?)\]।]+$/u, "");
    const candidate = normaliseCandidate(raw);
    const parsed = parse(/^https?:\/\//i.test(candidate) ? candidate : `http://${candidate}`);
    if (!parsed.hostname) continue;
    if (!parsed.isIp && !parsed.domain) continue;
    const host = parsed.hostname.toLowerCase();
    if (seen.has(host)) continue;
    seen.add(host);
    const domain = parsed.domain?.toLowerCase() ?? null;
    const suffix = parsed.publicSuffix?.toLowerCase() ?? null;
    const isOfficial =
      suffix === "gov.bd" || suffix === "mil.bd" || (domain !== null && OFFICIAL_DOMAINS.has(domain));
    links.push({
      raw,
      host,
      domain,
      suffix,
      isIp: Boolean(parsed.isIp),
      isPunycode: host.includes("xn--"),
      isOfficial,
      isShortener: domain !== null && SHORTENERS.has(host),
      isKnownBad: domain !== null && KNOWN_BAD_DOMAINS.has(domain),
      isRiskySuffix: suffix !== null && RISKY_SUFFIXES.has(suffix),
      imitates: isOfficial ? null : findImitatedBrand(host),
    });
  }
  return links;
}
