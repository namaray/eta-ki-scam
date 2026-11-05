import type { LinkInfo } from "./links";
import type { Signal } from "./types";

const NEW_DOMAIN_DAYS = 90;
const MAX_LOOKUPS = 2;

/**
 * Only asks the public RDAP registry about the domain's registration date. It never requests the
 * suspicious site itself, and the fixed host means user input can't redirect this fetch.
 */
async function domainAgeInDays(domain: string): Promise<number | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(3500),
      headers: { accept: "application/rdap+json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
    const registered = data.events?.find((event) => event.eventAction === "registration")?.eventDate;
    if (!registered) return null;
    const age = Math.floor((Date.now() - new Date(registered).getTime()) / 86_400_000);
    return Number.isFinite(age) ? age : null;
  } catch {
    return null;
  }
}

export async function checkDomainAges(links: LinkInfo[]): Promise<Signal[]> {
  const targets = links
    .filter((link) => link.domain && !link.isOfficial && !link.isShortener && !link.isIp)
    .slice(0, MAX_LOOKUPS);
  const results = await Promise.all(
    targets.map(async (link) => ({ link, age: await domainAgeInDays(link.domain as string) })),
  );
  return results.flatMap(({ link, age }): Signal[] =>
    age === null || age >= NEW_DOMAIN_DAYS
      ? []
      : [
          {
            id: `new_domain:${link.domain}`,
            severity: "high",
            title: {
              en: `This website is only ${age} day${age === 1 ? "" : "s"} old`,
              bn: `এই ওয়েবসাইটের বয়স মাত্র ${age} দিন`,
            },
            detail: {
              en: `${link.domain} was registered very recently. Scam sites are often new because old ones get reported and blocked.`,
              bn: `${link.domain} খুব সম্প্রতি নিবন্ধিত হয়েছে। প্রতারণার সাইট প্রায়ই নতুন হয়, কারণ পুরোনোগুলো রিপোর্ট হয়ে বন্ধ হয়ে যায়।`,
            },
            evidence: [link.raw],
            origin: "rule",
            source: { label: "Public RDAP registry", url: `https://rdap.org/domain/${link.domain}` },
          },
        ],
  );
}
