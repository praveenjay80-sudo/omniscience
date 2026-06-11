import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6", term, domain, l1, l2 } = await req.json();
  if (!apiKey || !term) return new Response("apiKey and term are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const context = l2 ? `${term} (${l2} → ${l1} → ${domain})` : `${term} (${l1} → ${domain})`;

  const prompt = `You are a brilliant intellectual historian writing for a complete beginner who has never studied ${context}. Trace the complete intellectual genealogy of ${context} — the unbroken chain of thinkers and ideas that built this field, generation by generation.

Write every explanation as if the reader has zero prior knowledge. For every idea a thinker introduced, immediately explain it using a concrete everyday example or analogy before going deeper. Avoid jargon — when a technical term is unavoidable, define it in plain English on the spot.

For each generation use this format:

## [Descriptive Era Name] — [Time Period]

For each thinker in this generation:

### [Thinker Name] · [Birth–Death or active years]

3–4 sentences as a mentor speaking directly to the student using "you":
- What this thinker inherited from those before them
- The specific breakthrough they made — and why it was only possible because of what came before
- The exact idea or tool they handed forward like genetic material
- What new territory they opened for the next generation

**Key concepts:** A comprehensive list of the important terms, ideas, methods, and vocabulary this thinker introduced or fundamentally transformed. Include every term a serious student should know: theorems, named results, key distinctions, foundational techniques, named paradoxes, coined terms. Format as: *concept*, *concept*, *concept*, …

**Key works:** Every significant work — do not cap the list. Include all books, papers, and lectures that matter. [Title](https://www.amazon.com/s?k=Title+Author) for books, [Title](https://scholar.google.com/scholar?q=Title+Author) for papers. Encode spaces as +.

---

Rules:
- Begin with the 19th century — do not go earlier
- Show the **mutations** — where someone radically transformed what they inherited rather than just extending it
- Show the **extinctions** — important ideas that were lost and had to be rediscovered decades later
- Include the **heretics** whose ideas were rejected but later vindicated
- Trace continuously from the 19th century to the living generation — do not stop early

End with:

## The Living Generation — Present Day

Who carries this intellectual tradition forward right now, and what they are building.

---

## What the Genealogy Reveals

One paragraph: what does tracing this lineage show about ${term} that reading a textbook never would?`;

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
