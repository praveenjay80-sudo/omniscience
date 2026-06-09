import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let body: { apiKey?: string; term?: string; domain?: string; l1?: string; l2?: string; hoursPerWeek?: number; background?: string; goal?: string; learningStyle?: string };
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const { apiKey, term, domain, l1, l2, hoursPerWeek, background, goal, learningStyle } = body;

  if (!apiKey || !term || !hoursPerWeek) {
    return new Response("apiKey, term, and hoursPerWeek are required", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const context = l2
    ? `"${term}" (${l2} → ${l1} → ${domain})`
    : `"${term}" (${l1} → ${domain})`;

  const profile = [
    background ? `Background: ${background}` : null,
    goal ? `Goal: ${goal}` : null,
    `${hoursPerWeek} hours/week`,
    learningStyle ? `Learns best by: ${learningStyle}` : null,
  ].filter(Boolean).join(" | ");

  const prompt = `You are the world's most knowledgeable academic guide for ${context}. You know every serious book, every landmark paper, every foundational text that has ever mattered in this field and its prerequisite subjects.

Create a complete, exhaustive learning literature map for ${context} — from the absolute zero prerequisite foundations through to the current research frontier. This is the definitive reading order for a serious learner.

Student profile: ${profile}

---

Write every resource as a flowing paragraph — no labels like "Teaches:" or "Prerequisites:", no type tags, no form-style bullets. Just natural prose, as if a knowledgeable mentor is telling you about each work in conversation. Make it readable.

For each resource, write it in this flowing style:

### Title — Author(s) (Year)

One or two paragraphs. First: what this work actually does and why it exists in this position in the curriculum. What you will be able to think or do after working through it that you couldn't before. Second sentence or two: what you need to already know before it makes sense. End with the search links woven naturally: [Amazon](search url) for books, [arXiv](search url) or [Google Scholar](search url) for papers.

For search link URLs: encode spaces as +, use the exact title and first author.

---

Produce all levels in order:

## Level 0 — Before You Begin
These are not ${term}. These are the prerequisite subjects you must already have — the math, the theory, the adjacent tools — before ${term} will make sense. If you're missing any of these, start here.

[all relevant prerequisite resources — as many as genuinely belong here]

---

## Level 1 — First Contact
Introductions that assume no prior knowledge of ${term} itself. After this level you understand what the field is, why it exists, and what it is capable of.

[all relevant resources — as many as genuinely belong here]

---

## Level 2 — The Foundation
The core textbooks that rigorously establish the fundamentals. What every serious student works through in their first formal year.

[all relevant resources]

---

## Level 3 — Working Knowledge
After this level you can work in the field — solve real problems, read current papers, contribute to projects.

[all relevant resources]

---

## Level 4 — Advanced Depth
Graduate-level textbooks and advanced monographs. The reading list for a PhD student's first two years.

[all relevant resources]

---

## Level 5 — The Papers Everyone Cites
The landmark papers and seminal works that defined this field. Anyone calling themselves serious about ${term} has read all of these. Include the originals — the papers that introduced the field's key ideas, not tutorials about them.

[all relevant papers — do not artificially limit this list]

---

## Level 6 — The Research Frontier
High-impact recent papers and surveys defining the current state of the art. What researchers are reading and citing right now.

[all relevant papers]

---

## The Three That Define the Field
*If someone asks "what are the 3 books that define this field" — these are them. The canon. Explain in 2 sentences why each one is irreplaceable.*

If someone asks "what are the three books that define this field" — these are them. Write a sentence on why each one is irreplaceable.

[3 resources]

---

Include every resource that genuinely belongs — do not cap or truncate any level. A deep field may have 50+ resources. Every resource earns its place. Real titles, real authors only — no invented works. If uncertain of a detail, use search links so the reader can verify.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
