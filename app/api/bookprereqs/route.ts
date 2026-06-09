import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, title, term, domain, l1 } = await req.json();

  if (!apiKey || !title) {
    return new Response("apiKey and title are required", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const context = term ? ` in the context of studying ${term} (${l1} → ${domain})` : "";

  const prompt = `List the prerequisite works for "${title}"${context}.

These are the specific books and papers a reader should have engaged with before tackling this work. Focus on direct prerequisites — works whose concepts, notation, or results are assumed by the author without re-derivation.

For each prerequisite write exactly:
**Title — Author (Year)** [TAG]: One sentence on what specific knowledge from it is assumed.

Where TAG is one of: CORE (must read before this work), ESSENTIAL (highly recommended), OPTIONAL (helpful but not required).

List prerequisites in the order they should be read. Include only genuine direct prerequisites. If this work has no specific prerequisites beyond general background at its level, say so in one sentence.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
