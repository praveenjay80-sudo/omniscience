import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, domain, l1 } = await req.json();
  if (!apiKey || !domain || !l1) return new Response("apiKey, domain, and l1 are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `List the deepest unanswered questions in ${l1} (${domain}).

Not technical open problems — the fundamental philosophical and scientific questions that the field keeps running into, that resist easy answers, that the best minds in this field carry with them for their entire careers. Questions that would genuinely haunt a curious non-specialist.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown, no commentary:
{"n":"Question as a direct sentence ending in ?","d":"One sentence: why this question is genuinely hard and why it matters deeply"}

Aim for 20–25 questions. Include both the obvious profound questions AND the ones only insiders know are fundamental.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: "claude-sonnet-4-6",
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
