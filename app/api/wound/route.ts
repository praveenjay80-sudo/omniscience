import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const {
    apiKey,
    model: reqModel = "claude-sonnet-4-6",
    term,
    domain,
    l1,
    l2,
    mode = "field",
  } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });

  const client = new Anthropic({ apiKey });

  let prompt: string;

  if (mode === "universal") {
    prompt = `Write a philosophical meditation on the structural limits of all human knowledge — the places where every field eventually reaches its own boundary.

Use this structure with these exact headers:

## THE SEVEN WOUNDS

For each wound use this exact format:
### [Name of the wound]
One paragraph (130–160 words). What this paradox is at its deepest level. Where it appears across different fields — name specific theorems, specific scientists, specific historical moments, at least three concrete examples from different domains. Why it cannot be dissolved by better methods or more data. It can only be acknowledged.

The seven should be the deepest structural limits — self-reference and incompleteness, the observer problem, the is-ought gap, emergence vs. reduction, the problem of induction, the hard problem of consciousness, and the measurement problem are candidates. But find the seven that are genuinely the most irreducible, not merely the most difficult.

## THE COMMON STRUCTURE

One paragraph (160–200 words). What all seven share — the meta-pattern that gives human understanding this particular shape. Why does knowledge always find this specific edge? End with one sentence that speaks to what it means to be the kind of beings whose knowledge has these limits.

Prose only. No bullet lists. No hedging. This is the deepest layer of the app — the place where browsing stops and thinking begins.`;
  } else {
    if (!term) return new Response("term is required for field mode", { status: 400 });
    const fieldPath = l2 ? `${l1} → ${l2}` : l1;
    const context = domain ? `${domain} / ${fieldPath}` : fieldPath;

    prompt = `You are writing a philosophical meditation on the structural limits of a field of human knowledge.

Field context: ${context}
Specific topic: ${term}

Write in exactly three sections using these headers verbatim:

## THE CENTRAL APORIA

One paragraph (180–220 words). The question this field cannot answer using its own methods — not an open research problem but a structural wound. The paradox that motivated the field into existence and that it circles forever without resolution. Begin with the wound itself. Be precise, unflinching, exact. No hedging.

## THE LOAD-BEARING METAPHOR

One paragraph (120–160 words). Every field thinks with a root metaphor it rarely examines. Name this field's organizing metaphor. Show what it reveals about reality. Show what it necessarily hides or distorts. Show how the field's characteristic blind spots follow inevitably from this metaphor.

## THE THREE WORKS

Exactly three works — not the canonical introductions, not the most-cited papers, but the three that most honestly confront the field's central wound. The works where the field looks at its own limits and reports back.

For each, use this exact format:
### [Exact Title] — [Author(s)] ([Year])
One paragraph (100–130 words). Not what the work achieves or teaches. Why it belongs in the canon of honest reckoning — what wound does it face, what does it dare to say about the limits of this field that more comfortable works look away from.

Prose only. No bullet lists. Write as if you have thought about nothing else for twenty years.`;
  }

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
