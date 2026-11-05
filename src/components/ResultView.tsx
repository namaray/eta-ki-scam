"use client";

import { useMemo, useState } from "react";
import { COPY, type Lang } from "@/lib/i18n";
import type { AnalysisResult, FollowUpAnswer, Severity, Signal, Verdict } from "@/lib/types";

const VERDICT_STYLE: Record<Verdict, { box: string; icon: string; path: string }> = {
  likely_scam: { box: "bg-scam-tint text-scam", icon: "bg-scam", path: "M7 7l10 10M17 7 7 17" },
  suspicious: { box: "bg-warn-tint text-warn", icon: "bg-warn", path: "M12 5v9M12 18.5v.5" },
  no_red_flags: { box: "bg-ok-tint text-ok", icon: "bg-ok", path: "m5.5 12.5 4.5 4.5 8.5-9.5" },
  unchecked: { box: "bg-neutral-tint text-neutral", icon: "bg-neutral", path: "M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18.5v.5" },
};

const SEVERITY_STYLE: Record<Severity, { mark: string; dot: string }> = {
  critical: { mark: "bg-scam-tint decoration-scam", dot: "bg-scam" },
  high: { mark: "bg-scam-tint decoration-scam", dot: "bg-scam" },
  medium: { mark: "bg-marker/60 decoration-warn", dot: "bg-warn" },
  info: { mark: "bg-ok-tint decoration-ok", dot: "bg-ok" },
};

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "info"];
const REASONS_SHOWN = 3;

// Matches the limit in /api/analyze.
const MAX_FOLLOW_UP_ANSWERS = 4;

type Piece = { text: string; severity?: Severity };

function markEvidence(text: string, signals: Signal[]): Piece[] {
  const severityAt: (Severity | undefined)[] = new Array(text.length);
  const strongestFirst = [...signals].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  for (const signal of strongestFirst) {
    for (const phrase of signal.evidence) {
      const start = text.indexOf(phrase);
      if (start < 0) continue;
      for (let i = start; i < start + phrase.length; i++) severityAt[i] ??= signal.severity;
    }
  }
  const pieces: Piece[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = pieces[pieces.length - 1];
    if (last && last.severity === severityAt[i]) last.text += text[i];
    else pieces.push({ text: text[i], severity: severityAt[i] });
  }
  return pieces;
}

export function ResultView({
  lang,
  result,
  answered,
  busy,
  fromScreenshot,
  onAnswer,
  onFixText,
  onReset,
}: {
  lang: Lang;
  result: AnalysisResult;
  answered: FollowUpAnswer[];
  busy: boolean;
  fromScreenshot: boolean;
  onAnswer: (answer: FollowUpAnswer) => void;
  onFixText: () => void;
  onReset: () => void;
}) {
  const copy = COPY[lang];
  const [showAllReasons, setShowAllReasons] = useState(false);
  const verdictCopy = copy.verdicts[result.verdict];
  const style = VERDICT_STYLE[result.verdict];
  const pieces = useMemo(() => markEvidence(result.text, result.signals), [result.text, result.signals]);
  const signals = useMemo(
    () =>
      [...result.signals].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
      ),
    [result.signals],
  );
  const visibleSignals = showAllReasons ? signals : signals.slice(0, REASONS_SHOWN);
  const hiddenCount = signals.length - visibleSignals.length;
  const isRisky = result.verdict === "likely_scam" || result.verdict === "suspicious";
  const followUp =
    answered.length >= MAX_FOLLOW_UP_ANSWERS
      ? undefined
      : result.followUps.find((item) => !answered.some((answer) => answer.question === item.question.en));

  return (
    <>
      <section aria-live="polite" className={`flex flex-col items-center rounded-3xl p-6 text-center sm:p-8 ${style.box}`}>
        <span className={`flex size-16 items-center justify-center rounded-full text-white ${style.icon}`} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d={style.path} />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{verdictCopy.label}</h1>
        {result.summary?.[lang] && <p className="mt-3 text-lg leading-snug text-ink">{result.summary[lang]}</p>}
        <p className="mt-2 text-lg font-semibold">{verdictCopy.note}</p>
        <p className="mt-3 text-sm text-muted">{result.aiUsed ? copy.checkedBy : copy.aiMissing}</p>
      </section>

      {followUp && (
        <section className="rounded-3xl bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold">{copy.followUpHeading}</h2>
          <p className="mt-1 text-lg">{followUp.question[lang]}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["yes", "no", "unsure"] as const).map((answer) => (
              <button
                key={answer}
                type="button"
                disabled={busy}
                onClick={() => onAnswer({ question: followUp.question.en, answer })}
                className="min-h-12 rounded-2xl border border-brand font-semibold text-brand hover:bg-brand hover:text-brand-ink disabled:opacity-50"
              >
                {copy[answer]}
              </button>
            ))}
          </div>
          {busy && <p className="mt-3 text-muted">{copy.rechecking}</p>}
        </section>
      )}

      <section className="rounded-3xl bg-brand p-5 text-brand-ink sm:p-6">
        <h2 className="font-display text-xl font-bold">{copy.actionsHeading}</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-lg leading-snug">
          {result.actions.map((action) => (
            <li key={action.en}>{action[lang]}</li>
          ))}
        </ol>
      </section>

      {isRisky && (
        <details className="group rounded-3xl border-2 border-scam bg-card p-5">
          <summary className="min-h-6 cursor-pointer font-display text-lg font-bold text-scam">
            {copy.emergencyHeading}
          </summary>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-lg leading-snug">
            {copy.emergency.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      )}

      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-bold">{copy.whyHeading}</h2>
        {signals.length === 0 ? (
          <p className="mt-2 text-muted">{copy.noSignals}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {visibleSignals.map((signal) => (
              <li key={signal.id} className="flex gap-3">
                <span className={`mt-2 size-3 shrink-0 rounded-full ${SEVERITY_STYLE[signal.severity].dot}`} aria-hidden />
                <div>
                  <p className="text-lg font-semibold leading-snug">{signal.title[lang]}</p>
                  <p className="mt-0.5 leading-snug text-muted">{signal.detail[lang]}</p>
                  {signal.source && (
                    <a
                      href={signal.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm text-brand underline"
                    >
                      {copy.sourceLabel}: {signal.source.label}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllReasons(true)}
            className="mt-4 min-h-11 font-semibold text-brand underline underline-offset-4"
          >
            {copy.seeAllReasons(hiddenCount)}
          </button>
        )}

        <h3 className="mt-6 font-display text-lg font-bold">{copy.messageHeading}</h3>
        {result.sender && <p className="mt-2 break-words text-muted">{result.sender}</p>}
        <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-paper p-4 text-lg leading-relaxed">
          {pieces.map((piece, index) =>
            piece.severity ? (
              <mark
                key={index}
                className={`rounded-sm px-0.5 text-ink underline decoration-2 underline-offset-2 ${SEVERITY_STYLE[piece.severity].mark}`}
              >
                {piece.text}
              </mark>
            ) : (
              <span key={index}>{piece.text}</span>
            ),
          )}
        </p>
        {fromScreenshot && (
          <p className="mt-3 text-muted">
            {copy.screenshotNote}{" "}
            <button type="button" onClick={onFixText} className="font-semibold text-brand underline underline-offset-4">
              {copy.fixText}
            </button>
          </p>
        )}
      </section>

      {isRisky && <WarnFamily lang={lang} scenario={result.scenario} />}

      <button
        type="button"
        onClick={onReset}
        className="min-h-14 rounded-2xl border-2 border-brand text-lg font-semibold text-brand hover:bg-brand hover:text-brand-ink"
      >
        {copy.checkAnother}
      </button>
    </>
  );
}

function WarnFamily({ lang, scenario }: { lang: Lang; scenario: AnalysisResult["scenario"] }) {
  const copy = COPY[lang];
  const [copied, setCopied] = useState(false);
  // Built from the scam type only, so nothing from the user's private message is ever shared.
  const warning = `${copy.warningText(copy.scenario[scenario])} ${window.location.origin}`;

  async function copyWarning() {
    try {
      await navigator.clipboard.writeText(warning);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-3xl bg-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold">{copy.warnFamily}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(warning)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center rounded-2xl bg-brand px-5 font-semibold text-brand-ink"
        >
          {copy.whatsapp}
        </a>
        <button
          type="button"
          onClick={copyWarning}
          className="min-h-12 rounded-2xl border border-brand px-5 font-semibold text-brand"
        >
          {copied ? copy.copied : copy.copy}
        </button>
      </div>
    </section>
  );
}
