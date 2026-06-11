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

Your sole selection criterion: which works get CLOSEST to actually answering, resolving, or dissolving the specific structural paradox described above? Not works chosen for prestige, citation count, or canonical status in the field. Only works that make genuine intellectual progress toward the horizon itself.

Include works regardless of era (ancient, medieval, early modern, contemporary), language (include German, French, Arabic, Sanskrit, Chinese, Latin originals by their original title with translation), subject area (works from adjacent or completely different fields that happen to approach the same underlying structure), or difficulty level. If a dialogue written in 350 BCE gets closer to answering this paradox than a 2010 paper, include the dialogue. If the most important work was written in German and never translated, include it.

Types of works that belong here:
— Works that directly attack the paradox and make partial progress toward resolving it
— Works that reframe the problem so that new progress becomes possible
— Works that prove or precisely characterize WHY this is a structural limit (which is itself a form of resolution)
— Works from entirely different traditions or fields that approach the same underlying structure from an unexpected angle
— Works that propose to DISSOLVE the paradox by questioning its framing — serious attempts even if ultimately unsuccessful
— Works that construct partial solutions, approximations, or workarounds that reveal something true about the limit's structure

Do not include a work merely because it is famous or foundational in the field if it does not specifically advance toward this horizon.

For each work use this exact format:
### [Exact Title] — [Author(s)] ([Year]) · [Language if not English]
Two paragraphs (160–200 words total).

First paragraph: What does this work claim or demonstrate, in completely plain language? Give one specific, concrete example — a particular argument, theorem, thought experiment, or claim — that shows exactly how it engages with the paradox. Write as if explaining to someone who will never read the work.

Second paragraph: How close does it actually get? Be honest and precise. What exactly does it resolve or illuminate, and where does the horizon remain untouched? Name the specific move it makes: does it partially dissolve the paradox, reframe it productively, prove its structural necessity, construct a partial bypass, or approach from a tradition that makes unexpected progress? End with one sentence: what would still need to happen for this work's approach to fully cross the horizon.

Include all works that genuinely advance toward this horizon — typically 8–15 but include more if the horizon has attracted serious treatment across multiple traditions. Prose only in body paragraphs. No bullet lists.`;
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
