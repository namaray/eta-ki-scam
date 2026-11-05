import library from "../data/library.json";

export type LibraryEntry = {
  id: string;
  label: "scam" | "legit";
  type: string;
  text: string;
  /** synthetic = written by us; reported = based on published reports; community = real, shared with permission; dataset = see the README. */
  source: "synthetic" | "reported" | "community" | "dataset";
};

const ENTRIES = library as LibraryEntry[];
const NGRAM = 3;
const MIN_SIMILARITY = 0.05;

// Character n-grams work for Bangla, English and Banglish without needing a tokenizer.
function vectorise(text: string): Map<string, number> {
  const clean = text.normalize("NFC").toLowerCase().replace(/\s+/g, " ");
  const counts = new Map<string, number>();
  for (let i = 0; i <= clean.length - NGRAM; i++) {
    const gram = clean.slice(i, i + NGRAM);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

function norm(vector: Map<string, number>): number {
  let sum = 0;
  for (const value of vector.values()) sum += value * value;
  return Math.sqrt(sum) || 1;
}

const INDEX = ENTRIES.map((entry) => {
  const vector = vectorise(entry.text);
  return { entry, vector, length: norm(vector) };
});

/** Returns the closest scams and the closest genuine messages, so the model sees both sides. */
export function findSimilar(text: string, scams = 3, legit = 2): LibraryEntry[] {
  const query = vectorise(text);
  const queryLength = norm(query);
  const ranked = INDEX.map(({ entry, vector, length }) => {
    let dot = 0;
    for (const [gram, count] of query) dot += count * (vector.get(gram) ?? 0);
    return { entry, similarity: dot / (queryLength * length) };
  })
    .filter(({ similarity }) => similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity);
  const pick = (label: LibraryEntry["label"], count: number) =>
    ranked.filter(({ entry }) => entry.label === label).slice(0, count).map(({ entry }) => entry);
  return [...pick("scam", scams), ...pick("legit", legit)];
}
