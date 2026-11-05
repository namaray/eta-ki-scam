/**
 * Measures detection against src/data/eval-set.json.
 *   pnpm eval               rules + AI (needs GROQ_API_KEY, and is paced for Groq's rate limits)
 *   pnpm eval --rules-only  rules alone, with no network calls
 *
 * Add real messages with `"source": "community"`. Only those results belong in the deck: the
 * synthetic set was written alongside the rules, so its numbers will look better than reality.
 */
import evalSet from "../src/data/eval-set.json";
import { analyze } from "../src/lib/pipeline";
import type { AnalysisResult } from "../src/lib/types";

type Case = { id: string; label: "scam" | "legit"; source: string; sender: string; text: string };

const rulesOnly = process.argv.includes("--rules-only");
const cases = evalSet as Case[];
const delayMs = rulesOnly ? 0 : Number(process.env.EVAL_DELAY_MS ?? 20_000);

async function run(item: Case): Promise<AnalysisResult | null> {
  const events = analyze({ text: item.text, sender: item.sender }, { useAi: !rulesOnly, useRdap: false });
  for await (const event of events) {
    if (event.type === "result") return event.result;
  }
  return null;
}

function report(name: string, rows: { item: Case; result: AnalysisResult | null }[]) {
  const scams = rows.filter(({ item }) => item.label === "scam");
  const legit = rows.filter(({ item }) => item.label === "legit");
  const flagged = ({ result }: (typeof rows)[number]) =>
    result?.verdict === "likely_scam" || result?.verdict === "suspicious";
  console.log(`\n${name}`);
  console.log(`  Scams flagged: ${scams.filter(flagged).length}/${scams.length}`);
  console.log(`  Scams marked "Likely scam": ${scams.filter(({ result }) => result?.verdict === "likely_scam").length}/${scams.length}`);
  console.log(`  Genuine messages wrongly flagged: ${legit.filter(flagged).length}/${legit.length}`);
}

async function main() {
  const rows: { item: Case; result: AnalysisResult | null }[] = [];
  for (const item of cases) {
    rows.push({ item, result: await run(item) });
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.log(rulesOnly ? "Mode: rules only" : "Mode: rules + AI");
  const failedAi = rows.filter(({ result }) => !rulesOnly && !result?.aiUsed).length;
  if (failedAi) console.log(`WARNING: the AI step failed on ${failedAi} of ${rows.length} messages.`);

  for (const { item, result } of rows) {
    const flagged = result?.verdict === "likely_scam" || result?.verdict === "suspicious";
    if (flagged !== (item.label === "scam")) {
      console.log(`MISS ${item.id} [${item.label}] → ${result?.verdict}: ${item.text.slice(0, 90)}`);
    }
  }

  report("All messages", rows);
  const real = rows.filter(({ item }) => item.source !== "synthetic");
  if (real.length) report("Real messages only (use these in the deck)", real);
  else console.log("\nNo real messages yet. Don't quote these numbers in the deck.");
}

main();
