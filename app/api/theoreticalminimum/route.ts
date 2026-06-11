import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6" } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are designing the Theoretical Minimum for all of human knowledge — inspired by Lev Landau's legendary exam, which required students to demonstrate mastery of a strict sequence of physics concepts before he would work with them. Only 43 people ever passed in his lifetime. Each concept was a gatekeeper: you could not proceed until you truly owned the previous one.

Your task: produce the Theoretical Minimum for ALL of human knowledge — not just physics. The irreducible sequence of concepts that, if truly mastered in this order, builds the mental infrastructure to understand anything.

Rules (as Landau would insist):
- Every entry is a GATEKEEPER — if you cannot answer the test question, you are not ready to proceed
- Strict dependency order — concept N genuinely requires concept N-1
- No fluff, no "nice to know" — only what is truly load-bearing
- Span all domains: logic, mathematics, physics, chemistry, biology, computation, evolution, statistics, economics, philosophy of mind, language

For each concept:

## [Number]. [Concept Name]

**What it is:** One sentence for a complete beginner, with a concrete everyday example.

**Why it must come here:** One sentence on why this concept cannot be skipped and why it must come before the next.

**Prerequisites:** The specific concepts from earlier in the list that this requires (by number and name).

**The gatekeeper question:** A single concrete question or problem that, if you can answer it fully and from first principles, proves you own this concept. Not a recall question — a thinking question. If you cannot answer this, go back.

**What it unlocks:** What becomes possible to understand once you have this.

---

Be thorough — include every concept that is genuinely load-bearing. Do not cap the list. This is the minimum, not the maximum — but the minimum is longer than people expect.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: (reqModel === "claude-haiku-4-5-20251001" ? reqModel : "claude-sonnet-4-6") as "claude-sonnet-4-6" | "claude-haiku-4-5-20251001",
          max_tokens: 16000,
          messages: [{ role: "user", content: prompt }],
        });
        for await (const chunk of s) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta")
            controller.enqueue(encoder.encode(chunk.delta.text));
        }
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n__ERROR__:${message}`));
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
