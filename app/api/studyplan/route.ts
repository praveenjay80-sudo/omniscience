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

  const resourceFormat = `For each resource, write it as:

### Title — Author(s) (Year)

A flowing paragraph (not bullet points, no bold labels like "Teaches:" or "Prerequisites:"). Tell the reader what this work actually does and why it belongs here — what capability or understanding they'll gain. Mention what they need to know before it. End with search links woven naturally into the prose: [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Google Scholar](https://scholar.google.com/scholar?q=Title+Author) or [arXiv](https://arxiv.org/search/?query=Title&searchtype=all) for papers. Encode spaces as + in URLs.`;

  const part = (body as { part?: number }).part ?? 1;

  const prompt = part === 1
    ? `You are the world's most knowledgeable academic guide for ${context}.

Create the first half of a complete literature map for ${context} — covering the foundational levels from zero prerequisites through working knowledge. Be thorough: include every resource that genuinely belongs.

Student profile: ${profile}

${resourceFormat}

---

## Level 0 — Before You Begin
These are not ${term}. These are the prerequisite subjects — math, theory, adjacent tools — you must already have before ${term} makes sense. Start here if you're missing any.

[all genuinely relevant prerequisite resources]

---

## Level 1 — First Contact
Introductions assuming no prior knowledge of ${term} itself. After this level you understand what the field is, why it exists, and what it can do.

[all relevant resources]

---

## Level 2 — The Foundation
Core textbooks that rigorously establish the fundamentals. What every serious student reads in their first formal year.

[all relevant resources]

---

## Level 3 — Working Knowledge
After this level you can work in the field — solve real problems, read current papers, contribute to projects.

[all relevant resources]

Real titles and real authors only. Do not truncate any level.`

    : `You are the world's most knowledgeable academic guide for ${context}.

Create the second half of a complete literature map for ${context} — covering graduate level, the seminal papers, and the research frontier.

Student profile: ${profile}

${resourceFormat}

---

## Level 4 — Advanced Depth
Graduate-level textbooks and advanced monographs. The reading list for a PhD student's first two years.

[all relevant resources]

---

## Level 5 — The Papers Everyone Cites
The landmark papers and seminal works that defined this field. The originals — the papers that introduced the key ideas, not tutorials about them. Anyone serious about ${term} has read all of these.

[all relevant papers — do not artificially limit this list]

---

## Level 6 — The Research Frontier
High-impact recent papers and surveys defining the current state of the art. What researchers are reading and citing right now.

[all relevant papers]

---

## The Three That Define the Field
If someone asks "what are the three works that define this field" — these are them. One sentence each on why each is irreplaceable.

Real titles and real authors only. Do not truncate any level.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Write one byte immediately so Railway's proxy doesn't close the idle connection
      // during Anthropic's initial processing delay.
      controller.enqueue(encoder.encode(" "));
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
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
