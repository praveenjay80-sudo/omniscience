import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, title, abstract = "" } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });
  if (!title) return new Response("title is required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const abstractSection = abstract.trim()
    ? `\n\nAbstract / description provided by user:\n${abstract.trim()}`
    : "";

  const prompt = `You are helping a curious non-specialist understand a book or academic paper and find exactly where it fits in the structure of human knowledge.

Work to decode: "${title}"${abstractSection}

Write in exactly six sections using these headers verbatim:

## PLAIN LANGUAGE SUMMARY

Two to three paragraphs (200–250 words total). Write for someone who has never encountered this work and has no specialist background. First paragraph: what does this work argue or demonstrate? State the central claim in one clear sentence, then explain it using a concrete analogy from everyday life. Second paragraph: give one specific example from the work — a particular argument, theorem, experiment, or case study — that makes the core idea tangible. Third paragraph (if needed): what is genuinely new or important about this? Why does it matter beyond the field?

## CURRICULUM PLACEMENT

Use this exact format, filling in the brackets:
**Field:** [Domain] → [L1 subfield] → [L2 topic if applicable]
**Level:** [0–6] ([label: Orientation / Introductory / Undergraduate / Advanced Undergraduate / Graduate / Research / Cutting Edge])
**Priority:** [CORE / ESSENTIAL / OPTIONAL]
**Type:** [e.g. Foundational textbook / Research paper / Philosophical treatise / Popular science / Primary source / Technical reference]

Then one sentence (25–40 words) explaining the placement — why this level, why this field, why this priority. Be precise.

## WHAT YOU NEED FIRST

List 3 to 6 specific prerequisites — concepts, works, or competencies — that a reader genuinely needs before engaging seriously with this work. For each, give one sentence explaining what it contributes and why its absence makes this work hard. Format as a numbered list with bold title:

1. **[Name]** — [one sentence]

## WHAT IT RESPONDED TO

One paragraph (120–160 words). What intellectual problem, open question, error, or gap was this work responding to? Name the specific state of the field or the specific positions it was arguing against or building beyond. Write as if explaining the intellectual context to someone who wasn't there — make it vivid and specific, not generic.

## WHAT IT OPENED UP

One paragraph (120–160 words). What did this work make possible that wasn't possible before? Name specific fields, research programs, debates, or works that it directly enabled or that responded directly to it. Be specific: name actual works, researchers, or developments. If the work is recent and its consequences are still unfolding, say so and name the early signs.

## READINESS CHECK

Three brief assessments — one sentence each — for three reader types. Use this exact format:

**Level 1–2 reader:** [Can they read this productively now, or what should they do first?]
**Level 3–4 reader:** [What will they get from this, and what will still be hard?]
**Level 5–6 reader:** [What is this work's relationship to where they already are?]

Prose only in paragraphs. Be honest and specific throughout. Total target: 700–900 words.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
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
