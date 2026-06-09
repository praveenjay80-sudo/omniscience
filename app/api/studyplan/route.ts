import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2, hoursPerWeek, background, goal, learningStyle } =
    await req.json();

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

Create a COMPLETE, EXHAUSTIVE learning literature map for ${context} — from the absolute zero prerequisite foundations through to the current research frontier. This should be the definitive list: every serious learner's complete reading order.

**Student profile:** ${profile}

---

**FORMAT RULES — follow exactly for every single resource:**

### [TYPE] Full Title
*Author(s) · Year · Publisher/Venue*
**Teaches:** 2-3 sentences on what you actually learn and what capability you gain
**Prerequisites:** Exactly what you must already know before opening this
**Find it:** [Amazon](https://www.amazon.com/s?k=Title+Author) for books · [arXiv](https://arxiv.org/search/?query=Title&searchtype=all) or [Google Scholar](https://scholar.google.com/scholar?q=Title+Author) for papers

TYPE is one of: TEXTBOOK · BOOK · PAPER · SURVEY · LECTURE NOTES

For search links: replace spaces with + in the URL. Use the exact title and primary author.

---

Now produce all levels in order. Do not skip levels. Do not merge levels:

## Level 0 — Prerequisites: What You Must Know Before Starting
*These are not ${term}. These are the adjacent fields you must already have before ${term} makes sense. If you're missing any of these, start here.*

[List 4–6 foundational prerequisite resources from other fields — the math, the theory, the tools, whatever ${term} builds on]

---

## Level 1 — First Contact: Accessible Introductions
*Books and survey papers that introduce ${term} from scratch, assuming no prior knowledge of the subject itself. After this level you understand what the field is and why it exists.*

[List 3–5 resources]

---

## Level 2 — The Foundation: Core Textbooks
*The textbooks that rigorously establish the field's fundamentals. These are what every serious student reads in their first formal year with the subject.*

[List 4–6 resources]

---

## Level 3 — Working Knowledge: Becoming a Practitioner
*After this level you can work in the field — solve real problems, read current papers, contribute to projects. The gap between Level 2 and Level 3 is large; name the resources that bridge it.*

[List 4–6 resources]

---

## Level 4 — Advanced Depth: Graduate Level
*Graduate-level textbooks, advanced monographs, and specialized texts. The reading list for a PhD student's first two years.*

[List 4–6 resources]

---

## Level 5 — The Papers Every Expert Has Read
*The landmark papers and seminal works that defined this field. Anyone calling themselves an expert has read all of these. Include the original papers that introduced the field's key ideas — not just modern tutorials about them.*

[List 6–10 papers — include the real seminal works with real authors and real years]

---

## Level 6 — The Research Frontier
*High-impact recent papers, comprehensive surveys, and preprints defining the current state of the art. What researchers are reading and citing right now.*

[List 5–8 papers/surveys — be specific, real titles and authors only]

---

## The Non-Negotiables
*If someone asks "what are the 3 books that define this field" — these are them. The canon. Explain in 2 sentences why each one is irreplaceable.*

[List exactly 3 resources]

---

Aim for 30–40 resources total. Every resource must earn its place with a unique contribution. Use real titles and real authors only — do not invent resources. If you're uncertain of a detail, use the search link format so the reader can verify.`;

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
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
