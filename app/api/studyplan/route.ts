import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let body: { apiKey?: string; term?: string; domain?: string; l1?: string; l2?: string; hoursPerWeek?: number; background?: string; goal?: string; learningStyle?: string; part?: number; coveredTitles?: string[] };
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

  const resourceFormat = `For each resource use this format:

### Title — Author(s) (Year) · TAG

Where TAG is exactly one of: CORE, ESSENTIAL, or OPTIONAL
- CORE: A work every serious student of this field must read — foundational and irreplaceable
- ESSENTIAL: Very important; a few might skip it depending on their path but most should not
- OPTIONAL: Valuable supplement for those with extra time or specific interests

One flowing paragraph written as natural prose — no bullet points, no bold labels. Explain what this work does, why it belongs at this specific point in the progression, and what the reader will be able to do after engaging with it that they couldn't before. Mention what they need to already know. End by weaving in search links: [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Google Scholar](https://scholar.google.com/scholar?q=Title+Author) or [arXiv](https://arxiv.org/search/?query=Title&searchtype=all) for papers. Encode spaces as + in URLs.

Every resource must be a real, verifiable work — exact title, exact author. If you are not certain a work exists with the exact title and author you have in mind, omit it rather than guess.`;

  const part = body.part ?? 1;
  const coveredTitles: string[] = body.coveredTitles ?? [];

  const noDuplicates = coveredTitles.length > 0
    ? `\nCRITICAL — these works were already covered in earlier parts of this curriculum. Do NOT include any of them again, even under a different level:\n${coveredTitles.map(t => `- ${t}`).join("\n")}\n`
    : "";

  const prompts: Record<number, string> = {
    1: `You are the world's most knowledgeable academic guide for ${context}.

This is Part 1 of a four-part complete literature map. You are building a single coherent progression — each work builds directly on the understanding gained from the previous one.

Student profile: ${profile}

${resourceFormat}
${noDuplicates}
---

## Level 0 — Before You Begin
These are not ${term}. These are the prerequisite subjects — math, theory, adjacent tools — you must already have before ${term} makes sense. Each entry should explain why it is a hard dependency. List every genuine prerequisite — do not stop at any fixed number.

---

## Level 1 — First Contact
Introductions assuming no prior knowledge of ${term} itself. After this level the reader understands what the field is, why it exists, and what it can do. List every resource that genuinely belongs here — do not stop at any fixed number.

---

## Level 2 — The Foundation
Core textbooks that rigorously establish the fundamentals. Each one builds directly on what Level 0–1 provided. List every resource that genuinely belongs here — do not stop at any fixed number.

IMPORTANT: Do not truncate any level. There is no cap — include everything genuinely relevant. Do not repeat any work across levels.`,

    2: `You are the world's most knowledgeable academic guide for ${context}.

This is Part 2 of a four-part curriculum. Part 1 covered prerequisites (Level 0), first contact (Level 1), and foundations (Level 2). This part bridges the gap from foundations to advanced depth.
${noDuplicates}
Student profile: ${profile}

${resourceFormat}

---

## Level 3 — Working Knowledge
Resources that take the reader from foundation to practitioner. After this level they can work in the field — solve real problems, read current papers. Each work should build on the foundations established in Levels 0–2. List every resource that genuinely belongs here — do not stop at any fixed number.

---

## Level 4 — Advanced Depth
Graduate-level textbooks and advanced monographs that assume full command of Levels 0–3. The reading list for a PhD student's first two years. List every resource that genuinely belongs here — do not stop at any fixed number.

IMPORTANT: Do not truncate any level. There is no cap — include everything genuinely relevant. Do not repeat any work from Part 1 or across levels.`,

    3: `You are the world's most knowledgeable academic guide for ${context}.

This is Part 3 of a four-part curriculum. Parts 1 and 2 covered Levels 0–4 (prerequisites through advanced depth). This entire part is dedicated to the seminal papers that defined the field.
${noDuplicates}
Student profile: ${profile}

${resourceFormat}

---

## Level 5 — The Papers Everyone Cites
The landmark original papers that defined this field — not textbook treatments, not tutorials, but the actual papers where the key ideas first appeared. Anyone serious about ${term} has read all of these. List every paper that genuinely belongs here — do not stop at any fixed number. Be exhaustive: include every paper a PhD student in this field would be expected to know.

IMPORTANT: Do not truncate. There is no cap — include every genuinely landmark paper. Do not repeat any work from Parts 1 or 2.`,

    4: `You are the world's most knowledgeable academic guide for ${context}.

This is Part 4 (the final part) of a four-part curriculum. Parts 1–3 covered Levels 0–5. This final part covers what researchers are reading right now and closes with the three works that define the field above all others.
${noDuplicates}
Student profile: ${profile}

${resourceFormat}

---

## Level 6 — The Research Frontier
High-impact recent papers and comprehensive surveys representing the current state of the art. What active researchers are reading and citing right now. List every paper that genuinely belongs here — do not stop at any fixed number.

---

## The Three That Define the Field
If someone asks "what are the three works that define this field above all others" — these are them. One sentence each on why each is irreplaceable. These must not duplicate anything already covered above.

IMPORTANT: Do not truncate any level. There is no cap — include everything genuinely relevant. Do not repeat any work from Parts 1, 2, or 3.`,
  };

  const prompt = prompts[part] ?? prompts[1];

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
