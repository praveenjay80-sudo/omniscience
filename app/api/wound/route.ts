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
    prompt = `Write a philosophical meditation on the structural limits of all human knowledge, written for an intelligent person with no specialist background. These are the places where every field eventually reaches its own boundary — not because we haven't thought hard enough, but because the tools of inquiry hit the edge of what they can reach.

Use this structure with these exact headers:

## THE SEVEN WOUNDS

For each wound use this exact format:
### [Name of the wound]
Two paragraphs (180–220 words). First paragraph: open with a vivid everyday analogy or story — something from ordinary experience — that makes this paradox intuitively graspable before any technical language. Then show where this same structure appears across at least three different fields, naming specific theorems, specific scientists, specific historical moments (e.g. "Gödel proved in 1931 that...", "When Heisenberg showed that..."). Second paragraph: explain why this wound cannot be dissolved by better methods or more data — what would it even mean to "solve" it, and why that solution is unavailable in principle. End with one sentence about what it costs a field to keep working despite this wound.

The seven should be the deepest structural limits: self-reference and incompleteness, the observer problem, the is-ought gap, emergence vs. reduction, the problem of induction, the hard problem of consciousness, and the measurement problem are strong candidates. Choose the seven that are genuinely most irreducible.

## THE COMMON STRUCTURE

Two paragraphs (200–240 words). First paragraph: explain in plain language what all seven share — the meta-pattern that gives human understanding this particular shape. Use an analogy a non-specialist can follow. Second paragraph: reflect on what it means to be the kind of beings whose knowledge has these limits — not as a defeat, but as a feature of what it is to be finite minds reaching toward infinite complexity. End with a single sentence that a reader will remember.

Prose only. No bullet lists. Write with the care of someone who finds this genuinely beautiful.`;
  } else {
    if (!term) return new Response("term is required for field mode", { status: 400 });
    const fieldPath = l2 ? `${l1} → ${l2}` : l1;
    const context = domain ? `${domain} / ${fieldPath}` : fieldPath;

    prompt = `You are writing a philosophical meditation on the structural limits of a field of human knowledge, aimed at a complete beginner who has never studied this field.

Field context: ${context}
Specific topic: ${term}

Write in exactly three sections using these headers verbatim:

## THE CENTRAL APORIA

Two paragraphs (250–300 words total). Explain the wound the way you would to a curious, intelligent person who has never studied this field at all.

First paragraph: Start with a concrete everyday analogy or story that makes the paradox viscerally understandable — something from ordinary life, not from the field itself. Then show how ${term} runs into exactly this same structure. Use plain language throughout.

Second paragraph: Now deepen it. Show why this is not just a hard unsolved problem but a structural limit — something the field's own methods are constitutively unable to reach. Give a specific real example from the history of the field where this wound actually surfaced and caused a crisis or a fundamental rethinking. Be precise and honest.

## THE LOAD-BEARING METAPHOR

One paragraph (160–200 words). Every field thinks with a root metaphor it rarely examines. Name this field's organizing metaphor clearly. Give a concrete example of a question this metaphor makes easy and natural to ask. Then give a concrete example of a question this metaphor makes impossible to even formulate — something a person outside the field would naturally ask, but that the field's vocabulary has no room for. Show how the field's characteristic blind spots follow directly from this metaphor. Write for someone who has never thought about how metaphors shape inquiry.

## THE WORKS

List every significant work — books, papers, essays — that makes genuine progress toward confronting or understanding this wound. Include the full spectrum: accessible popular works that introduce the limit to non-specialists, philosophical explorations, landmark technical papers, historical accounts of how the wound was discovered, and the most rigorous honest confrontations. Do not cap the number — include all works that genuinely matter here, typically 8–15.

For each work use this exact format:
### [Exact Title] — [Author(s)] ([Year])
Two paragraphs (150–180 words). First paragraph: what does this work actually say, in plain language — explain the core argument as if to someone who will never read it, with at least one concrete example of what it claims or demonstrates. Second paragraph: how does it relate to the wound — how close does it get, what does it honestly confront, what does it still leave unresolved, and why does it belong in this list rather than the ordinary canon.

Prose only in body paragraphs. No bullet lists. Write with genuine intellectual care — these explanations should make a beginner feel they have grasped something real.`;
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
