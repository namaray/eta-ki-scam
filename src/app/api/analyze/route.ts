import { z } from "zod";
import { analyze } from "@/lib/pipeline";
import type { AnalyzeEvent } from "@/lib/types";

const MAX_IMAGE_CHARS = 4_000_000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const requestSchema = z
  .object({
    text: z.string().max(5000).optional(),
    sender: z.string().max(80).optional(),
    image: z
      .string()
      .max(MAX_IMAGE_CHARS)
      .regex(/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i)
      .optional(),
    answers: z
      .array(z.object({ question: z.string().max(400), answer: z.enum(["yes", "no", "unsure"]) }))
      .max(4)
      .optional(),
  })
  .refine((body) => Boolean(body.text?.trim() || body.image));

// Best-effort limit per server instance. It protects the AI budget from casual abuse.
const recentRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentRequests.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  recentRequests.set(ip, recent);
  return false;
}

const encodeEvent = (event: AnalyzeEvent) => new TextEncoder().encode(`${JSON.stringify(event)}\n`);

const singleEvent = (event: AnalyzeEvent, status: number) =>
  new Response(encodeEvent(event), { status, headers: { "content-type": "application/x-ndjson" } });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(ip)) return singleEvent({ type: "error", code: "rate_limited" }, 429);

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return singleEvent({ type: "error", code: "invalid" }, 400);

  const events = analyze(body.data);
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await events.next();
      if (done) controller.close();
      else controller.enqueue(encodeEvent(value));
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" },
  });
}
