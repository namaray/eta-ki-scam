# Eta Ki Scam? (এটা কি স্ক্যাম?)

Paste or upload a suspicious SMS or message and see the warning signs and what to do next, in Bangla or English. Built for the Ostad Presents YUNet AIgnite Buildathon 2026.

## How detection works

1. **Rule checks** (`src/lib/rules.ts`, `src/lib/links.ts`): lookalike and known-bad links, senders, PIN or OTP requests, and common Bangladeshi scam patterns. These give the same answer every time.
2. **Domain age** (`src/lib/rdap.ts`): asks a public registry how old a link's domain is, without opening the suspicious site.
3. **AI analysis** (`src/lib/ai.ts`): reads Bangla, English, Banglish and screenshots, using the closest labelled examples from `src/data/library.json`.
4. **Verdict** (`src/lib/verdict.ts`): combines the results. The AI can raise the risk, but it can't clear a rule finding. If the AI is down and the rules find nothing, the app says it couldn't fully check.

## Run it

Requires Node 22 or later.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Add your Groq API key to `.env.local`. Without one, the app still runs on rule checks, but screenshots and AI analysis are unavailable. You can also add `GOOGLE_GENERATIVE_AI_API_KEY` as a last-resort backup. Google's free tier may use messages to improve its products, which the app's privacy note tells people.

## Test and measure

```bash
pnpm test
pnpm eval --rules-only
pnpm eval
```

To add data, put labelled examples in `src/data/library.json` and test messages in `src/data/eval-set.json`, with `"source": "community"` for real messages. Remove names and phone numbers, and keep a message in only one of the two files. Only quote results from real messages in the deck.

## Example screenshots

The examples on the home page are made-up screenshots in `public/samples`, listed in `SAMPLES` in `src/lib/i18n.ts`. To use real ones, get permission first, remove names and numbers, and update each entry's `text` to match its image.

## Dataset credit

Some examples in `src/data/library.json` (`"source": "dataset"`) come from the train split of the [Bengali SMS Smishing Dataset](https://huggingface.co/datasets/shariul-islam/bengali-sms-smishing-dataset), tagged MIT by its publisher. Its validation and test splits are only used for measuring.

## Before submitting

- Deploy, then add `GROQ_API_KEY` (and `GOOGLE_GENERATIVE_AI_API_KEY`, if used) to the hosting provider's environment variables.
- Turn on Zero Data Retention in Groq's Data Controls settings.
