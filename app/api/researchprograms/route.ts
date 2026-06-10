import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2 } = await req.json();
  if (!apiKey || !term) return new Response("apiKey and term are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const context = l2
    ? `"${term}" (${l2} → ${l1} → ${domain})`
    : `"${term}" (${l1} → ${domain})`;

  const prompt = `You are a world-class mentor guiding a student through ${context}.

List every significant research program in ${term} — the grand, organised efforts that define the field's trajectory and span decades or generations. These are the cathedrals: enormous projects where entire careers contribute just one brick, where the goal is too large for any individual to complete alone.

For each program use this exact format:

### Program Name · STATUS

Where STATUS is exactly one of: ONGOING, COMPLETED, or ABANDONED

Write 3–4 sentences as a mentor speaking directly to the student using "you":
- What enormous problem this program is trying to solve, in plain language — no jargon
- Why it requires an organised multi-generational effort rather than individual work
- What has been achieved so far and what remains open or unresolved
- Why knowing this program exists changes how you see the entire field

**Key works to understand this program:**
List 3–5 essential works (books or papers) with search links: [Title](https://www.amazon.com/s?k=Title+Author) for books, [Title](https://scholar.google.com/scholar?q=Title+Author) for papers.

---

Include every significant research program — major and niche. Do not stop at any fixed number. Do not truncate.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: "claude-sonnet-4-6",
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
