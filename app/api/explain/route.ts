import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2 } = await req.json();

  if (!apiKey || !term) {
    return new Response("apiKey and term are required", { status: 400 });
  }

  const context = [domain, l1, l2].filter(Boolean).join(" › ");

  const prompt = `Explain "${term}" (${context}) to a complete beginner who has never studied this subject.

Structure your response with these sections using markdown bold headers:

**What it is**
A simple, jargon-free definition in 2-3 sentences. Explain it like the person is 16 years old.

**Why it matters**
Real-world significance — why should anyone care? What problems does it solve or what does it help us understand?

**Key concepts**
3-5 core ideas explained simply. Use analogies to everyday things.

**Concrete examples**
2-3 specific, real-world examples that anyone can relate to. Be vivid and specific.

**A beginner's path**
2-3 specific book titles or free resources (with authors where known) that a total beginner should start with.

Keep language simple. Immediately explain any technical term you must use. Total length: ~500 words.`;

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 2048,
          thinking: { type: "adaptive" },
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
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
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
