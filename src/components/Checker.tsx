"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { COPY, SAMPLES, type Lang } from "@/lib/i18n";
import type { AnalysisResult, AnalyzeEvent, AnalyzeInput, FollowUpAnswer, Stage } from "@/lib/types";
import { ResultView } from "./ResultView";

const LANG_KEY = "eta-ki-scam-lang";
const MAX_IMAGE_SIDE = 1600;

type ErrorCode = keyof (typeof COPY)["en"]["errors"];
type CheckError = Extract<AnalyzeEvent, { type: "error" }>["code"] | "network";

// Kept in memory as well, so the toggle still works when browser storage is blocked.
let currentLang: Lang | null = null;
const langListeners = new Set<() => void>();

function readLang(): Lang {
  if (currentLang) return currentLang;
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    currentLang = saved === "bn" || saved === "en" ? saved : window.navigator.language.startsWith("bn") ? "bn" : "en";
  } catch {
    currentLang = "en";
  }
  return currentLang;
}

function writeLang(lang: Lang) {
  currentLang = lang;
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // The choice just won't be remembered.
  }
  langListeners.forEach((listener) => listener());
}

function subscribeToLang(listener: () => void) {
  langListeners.add(listener);
  return () => langListeners.delete(listener);
}

async function imageToDataUrl(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function Checker() {
  const lang = useSyncExternalStore(subscribeToLang, readLang, () => "en" as Lang);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [answers, setAnswers] = useState<FollowUpAnswer[]>([]);
  const [error, setError] = useState<ErrorCode | "image" | null>(null);
  const [fromScreenshot, setFromScreenshot] = useState(false);
  const [dragging, setDragging] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const copy = COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  async function runCheck(input: AnalyzeInput, keepResult = false): Promise<CheckError | null> {
    setBusy(true);
    setError(null);
    setStage(null);
    if (!keepResult) setResult(null);
    let failure: CheckError | null = null;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AnalyzeEvent;
          if (event.type === "stage") setStage(event.stage);
          if (event.type === "error") failure = event.code;
          if (event.type === "result") {
            setResult(event.result);
            if (input.image) {
              // Keep what the AI read, so people can correct it and check again.
              setText(event.result.text);
              setSender(event.result.sender);
              setFromScreenshot(true);
            }
            if (!keepResult) {
              requestAnimationFrame(() => {
                window.scrollTo({ top: 0 });
                resultRef.current?.focus({ preventScroll: true });
              });
            }
          }
        }
      }
    } catch {
      failure = "network";
    }
    setBusy(false);
    setError(failure);
    return failure;
  }

  function startCheck() {
    setAnswers([]);
    setFromScreenshot(false);
    setDragging(false);
  }

  function submitText() {
    if (!text.trim()) {
      setError("invalid");
      return;
    }
    startCheck();
    setPreview(null);
    runCheck({ text, sender });
  }

  async function checkScreenshot(file: Blob | undefined | null) {
    if (!file) return;
    startCheck();
    let image: string;
    try {
      image = await imageToDataUrl(file);
    } catch {
      setError("image");
      return;
    }
    setPreview(image);
    setSender("");
    runCheck({ image });
  }

  async function checkSample(sample: (typeof SAMPLES)[number]) {
    startCheck();
    setPreview(sample.image);
    setText(sample.text);
    setSender(sample.sender);
    setBusy(true);
    const image = await fetch(sample.image)
      .then((response) => response.blob())
      .then(imageToDataUrl)
      .catch(() => null);
    const failure = image ? await runCheck({ image }) : "image_needs_ai";
    // An example should always show a result, even when the screenshot reader is busy.
    if (failure === "busy" || failure === "image_needs_ai") {
      await runCheck({ text: sample.text, sender: sample.sender });
    }
  }

  function answerFollowUp(answer: FollowUpAnswer) {
    if (!result) return;
    const next = [...answers, answer];
    setAnswers(next);
    runCheck({ text: result.text, sender: result.sender, answers: next }, true);
  }

  function reset() {
    setTyping(false);
    setText("");
    setSender("");
    setPreview(null);
    setResult(null);
    setAnswers([]);
    setError(null);
    setStage(null);
    setFromScreenshot(false);
  }

  function fixText() {
    setResult(null);
    setPreview(null);
    setAnswers([]);
    setFromScreenshot(false);
    setTyping(true);
    window.scrollTo({ top: 0 });
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    checkScreenshot(Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/")));
  }

  const onPasteImage = useRef<(file: File) => void>(() => {});
  useEffect(() => {
    onPasteImage.current = checkScreenshot;
  });

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        onPasteImage.current(file);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const errorMessage = error === "image" ? copy.imageUnreadable : error ? copy.errors[error] : null;
  const isChecking = busy && !result;

  return (
    <>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
          <button type="button" onClick={reset} className="rounded-lg">
            <Image src="/logo.svg" alt="Eta ki Scam?" width={90} height={80} loading="eager" />
          </button>
          <div className="flex items-center rounded-full bg-paper p-1" role="group" aria-label="Language / ভাষা">
            {(["bn", "en"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={lang === option}
                onClick={() => writeLang(option)}
                className={`min-h-9 rounded-full px-3.5 text-sm font-semibold ${
                  lang === option ? "bg-brand text-brand-ink" : "text-muted hover:text-ink"
                }`}
              >
                {option === "bn" ? "বাংলা" : "English"}
              </button>
            ))}
          </div>
          <BuildathonSticker />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        {isChecking && (
          <section aria-live="polite" className="flex flex-col items-center gap-5 rounded-3xl bg-card p-8 text-center shadow-sm">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element -- local preview, often a data URL
              <img src={preview} alt={copy.screenshotAlt} className="max-h-64 rounded-2xl border border-line" />
            )}
            <span className="size-10 animate-spin rounded-full border-4 border-brand border-t-transparent" aria-hidden />
            <p className="font-display text-xl font-bold">{stage ? copy.stages[stage] : copy.stages.reading}</p>
          </section>
        )}

        {result && (
          <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-4 outline-none">
            <ResultView
              lang={lang}
              result={result}
              answered={answers}
              busy={busy}
              fromScreenshot={fromScreenshot}
              onAnswer={answerFollowUp}
              onFixText={fixText}
              onReset={reset}
            />
          </div>
        )}

        {!busy && !result && (
          <>
            <div className="text-center">
              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-lg leading-snug text-muted">{copy.subheading}</p>
            </div>

            {errorMessage && (
              <p role="alert" className="rounded-2xl bg-scam-tint p-4 text-center font-medium text-scam">
                {errorMessage}
              </p>
            )}

            {typing ? (
              <form
                className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitText();
                }}
              >
                <label className="flex flex-col gap-1.5 font-semibold">
                  {copy.messageLabel}
                  <textarea
                    autoFocus
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={6}
                    maxLength={5000}
                    placeholder={copy.messagePlaceholder}
                    className="resize-y rounded-2xl border border-line bg-paper p-4 text-lg font-normal leading-relaxed placeholder:text-muted"
                  />
                </label>
                <label className="flex flex-col gap-1.5 font-semibold">
                  {copy.senderLabel}
                  <input
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                    maxLength={80}
                    placeholder={copy.senderPlaceholder}
                    className="min-h-12 rounded-2xl border border-line bg-paper px-4 text-lg font-normal placeholder:text-muted"
                  />
                </label>
                <button
                  type="submit"
                  className="min-h-14 rounded-2xl bg-brand px-5 text-lg font-semibold text-brand-ink hover:opacity-90"
                >
                  {copy.check}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTyping(false);
                    setError(null);
                  }}
                  className="min-h-11 font-medium text-brand underline underline-offset-4"
                >
                  {copy.backToUpload}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center shadow-sm transition-colors has-focus-visible:outline-3 has-focus-visible:outline-brand sm:p-10 ${
                    dragging ? "border-brand bg-ok-tint" : "border-brand/40 bg-card hover:border-brand"
                  }`}
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-ok-tint text-brand" aria-hidden>
                    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <circle cx="8.5" cy="9.5" r="1.5" />
                      <path d="m21 16-4.5-4.5L7 20" />
                    </svg>
                  </span>
                  <span className="inline-flex min-h-14 items-center rounded-2xl bg-brand px-8 text-lg font-semibold text-brand-ink">
                    {copy.upload}
                  </span>
                  <span className="hidden text-muted sm:block">{copy.dragHint}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      checkScreenshot(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTyping(true);
                    setError(null);
                  }}
                  className="min-h-11 font-medium text-brand underline underline-offset-4"
                >
                  {copy.noScreenshot}
                </button>
              </div>
            )}

            <section aria-labelledby="examples-heading">
              <h2 id="examples-heading" className="font-display text-xl font-bold">
                {copy.examplesHeading}
              </h2>
              <p className="mt-1 text-muted">{copy.examplesNote}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => checkSample(sample)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card text-left shadow-sm hover:border-brand"
                  >
                    <span className="relative block h-32 w-full overflow-hidden bg-paper">
                      <Image
                        src={sample.image}
                        alt=""
                        width={780}
                        height={1400}
                        sizes="(max-width: 640px) 50vw, 160px"
                        className="w-full"
                      />
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/75 px-2 py-0.5 text-xs font-semibold text-white">
                        {copy.exampleTag}
                      </span>
                    </span>
                    <span className="flex min-h-14 items-center px-3 py-2 text-[0.95rem] font-semibold leading-tight">
                      {sample.label[lang]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <p className="text-center text-sm text-muted">{copy.privacy}</p>
          </>
        )}
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-2xl px-4 py-4 text-center text-sm text-muted">{copy.disclaimer}</p>
      </footer>
    </>
  );
}

/** The organisers' sticker. The rules require it near the top of the page, not only in the footer. */
function BuildathonSticker() {
  return (
    <Image
      src="/buildathon-sticker.png"
      alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
      width={260}
      height={77}
      loading="eager"
    />
  );
}
