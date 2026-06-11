import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6" } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `What are the deepest questions that span ALL of human inquiry — questions that every field eventually runs into, that no single discipline can answer alone, that humanity has been seriously asking for centuries and still cannot resolve?

Not domain-specific questions. Truly universal ones: about consciousness, causation, time, existence, free will, meaning, the nature of knowledge, the foundations of logic and mathematics, the origin of order, the relationship between mind and world, why there is something rather than nothing.

Write for a complete beginner. For each question, immediately give a concrete everyday example or scenario that shows the reader they have already bumped into this question without knowing it — before explaining why it's so hard.

Format:

### [The Question stated directly]

3–4 sentences as an excited mentor using "you": the everyday moment where you've felt this question, why it matters for everything, and the specific reason brilliant minds across all fields have been stuck on it for so long.

---

Be exhaustive — include every question that genuinely belongs at this level. Do not cap the list.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: (reqModel === "claude-haiku-4-5-20251001" ? reqModel : "claude-sonnet-4-6") as "claude-sonnet-4-6" | "claude-haiku-4-5-20251001",
          max_tokens: 8192,
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
