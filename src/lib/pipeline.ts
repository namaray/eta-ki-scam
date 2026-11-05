import { analyzeWithAi, readScreenshot } from "./ai";
import { checkDomainAges } from "./rdap";
import { runRules } from "./rules";
import type { AiAnalysis, AnalyzeEvent, AnalyzeInput, Signal } from "./types";
import { buildActions, buildSummary, decideVerdict } from "./verdict";

// Provider errors can quote the prompt, so only the error type and status are logged.
const logFailure = (step: string, error: unknown) =>
  console.error(
    `${step} failed:`,
    error instanceof Error ? error.name : "unknown",
    (error as { statusCode?: number })?.statusCode ?? "",
  );

function aiSignals(ai: AiAnalysis): Signal[] {
  return ai.tactics.map((tactic, index) => ({
    id: `ai_tactic:${index}`,
    severity: ai.risk === "scam" ? "high" : "medium",
    title: tactic.name,
    detail: tactic.explanation,
    evidence: [tactic.quote],
    origin: "ai",
  }));
}

export async function* analyze(
  input: AnalyzeInput,
  options: { useAi?: boolean; useRdap?: boolean } = {},
): AsyncGenerator<AnalyzeEvent> {
  const { useAi = true, useRdap = true } = options;
  let text = input.text?.trim() ?? "";
  let sender = input.sender?.trim() ?? "";

  if (input.image) {
    yield { type: "stage", stage: "reading" };
    try {
      const screenshot = await readScreenshot(input.image);
      if (!screenshot.text) {
        yield { type: "error", code: "no_message" };
        return;
      }
      text = screenshot.text;
      sender = sender || screenshot.sender;
    } catch (error) {
      logFailure("Screenshot reading", error);
      const isBusy = (error as { statusCode?: number })?.statusCode === 429;
      yield { type: "error", code: isBusy ? "busy" : "image_needs_ai" };
      return;
    }
  }

  if (!text) {
    yield { type: "error", code: "invalid" };
    return;
  }

  yield { type: "stage", stage: "rules" };
  const rules = runRules(text, sender);
  const signals = [...rules.signals];

  if (useRdap && rules.links.length > 0) {
    yield { type: "stage", stage: "domains" };
    signals.push(...(await checkDomainAges(rules.links)));
  }

  let ai: AiAnalysis | null = null;
  if (useAi) {
    yield { type: "stage", stage: "ai" };
    try {
      ai = await analyzeWithAi({ text: rules.text, sender, signals, answers: input.answers });
    } catch (error) {
      logFailure("AI analysis", error);
    }
  }

  const verdict = decideVerdict(signals, ai);
  const scenario = rules.scenario !== "other" ? rules.scenario : (ai?.scenario ?? "other");
  yield {
    type: "result",
    result: {
      verdict,
      text: rules.text,
      sender,
      scenario,
      summary: buildSummary(verdict, scenario, ai?.summary ?? null),
      // Warning signs next to "No warning signs found" would contradict the result.
      signals: [...signals, ...(ai && verdict !== "no_red_flags" ? aiSignals(ai) : [])],
      // A question can't change a clear result, and it distracts from the next steps.
      followUps: verdict === "likely_scam" ? [] : (ai?.followUps ?? []),
      actions: buildActions(verdict, scenario, rules.links.some((link) => !link.isOfficial)),
      aiUsed: ai !== null,
    },
  };
}
