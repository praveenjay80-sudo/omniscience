import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6", domain, l1 } = await req.json();
  if (!apiKey || !domain || !l1) return new Response("apiKey, domain, and l1 are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `List every significant intellectual theme within ${l1} (${domain}).

These are the deep ideas, recurring patterns, and conceptual frameworks that define what ${l1} is really about — the things a true master of the field carries in their head as lenses. Not just subfield names, but the profound organising principles and questions.

For each theme give:
- A compelling name (2–6 words, specific enough to search for)
- One sentence written for a complete beginner — use a concrete everyday analogy or example to capture what makes this idea genuinely exciting. No jargon.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown, no commentary:
{"n":"Theme Name","d":"One-sentence beginner-friendly description with an example"}

Be exhaustive. Cover foundational themes, structural themes, dynamical themes, and the surprising/counterintuitive ones. Aim for 40+ entries.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: (reqModel === "claude-haiku-4-5-20251001" ? reqModel : "claude-sonnet-4-6") as "claude-sonnet-4-6" | "claude-haiku-4-5-20251001",
          max_tokens: 4096,
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
