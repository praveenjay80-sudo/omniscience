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

### Title — Author(s) (Year) · TAG · SPECIALIZATION

Where TAG is exactly one of: CORE, ESSENTIAL, or OPTIONAL
- CORE: Every serious student must read this — foundational and irreplaceable
- ESSENTIAL: Very important; most should not skip it
- OPTIONAL: Valuable supplement for those with extra time or specific interests

Where SPECIALIZATION is:
- For Level 3 and above: the exact name of the specialization from the Specializations map this work primarily serves, or "General" if it applies to all paths equally. Use the exact specialization name from the map — no paraphrasing.
- For Levels 0, 1, and 2: omit the · SPECIALIZATION part entirely. Write only · TAG.

DESCRIPTION RULES — follow these exactly:
- Address the student as "you" throughout. This is a mentor speaking, not a catalog.
- BANNED phrases: "this book", "this work", "this text", "the author", "the reader", "it covers", "it explores", "it introduces", "this volume". Never describe the book from the outside.
- START with the transition from what came before: "Now that you have X, you need..." / "Before you can tackle Y, read this..." / "After finishing the previous, you're ready for..." / "Your first stop is..." (for the very first resource).
- MIDDLE: one concrete sentence on what you will actually be able to DO after reading it that you couldn't do before.
- END: one sentence on where it leads — what you can pick up next because of this. Then weave in the search link: [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Google Scholar](https://scholar.google.com/scholar?q=Title+Author) or [arXiv](https://arxiv.org/search/?query=Title&searchtype=all) for papers. Encode spaces as +.
- Total length: 2–4 sentences. Tight. Conversational.

Every resource must be a real, verifiable work — exact title, exact author. Omit rather than guess.`;

  const part = body.part ?? 1;
  const coveredTitles: string[] = body.coveredTitles ?? [];

  const noDuplicates = coveredTitles.length > 0
    ? `\nCRITICAL — these works were already covered in earlier parts of this curriculum. Do NOT include any of them again, even under a different level:\n${coveredTitles.map(t => `- ${t}`).join("\n")}\n`
    : "";

  const prompts: Record<number, string> = {
    1: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

Your voice is direct, warm, and practical — like a brilliant professor who actually cares whether you get there. You address the student as "you" throughout. Every resource you describe is a step in a continuous journey, not an isolated entry. Each description must feel like advice ("read this next because..."), not a book review.

This is Part 1 of a four-part roadmap. Cover Levels 0, 1, and 2.

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

    2: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

Your voice is direct, warm, and practical — like a brilliant professor who actually cares whether you get there. You address the student as "you" throughout. Every resource you describe is a step in a continuous journey. Each description must feel like advice ("read this next because..."), not a book review.

This is Part 2 of a four-part roadmap. Part 1 covered Levels 0–2 (prerequisites, first contact, foundations). The student now has a solid foundation. Open with a Specializations map, then cover Levels 3 and 4.
${noDuplicates}
Student profile: ${profile}

${resourceFormat}

---

## Specializations — Where This Field Branches

The foundation is done. Before going further, map out every major specialization and research direction within ${term}. Write this as a mentor orienting a student who has just finished the foundations and is deciding where to go next. For each specialization, write two plain sentences: what it focuses on and what kind of person or problem it is for. Use this format:

**Specialization Name** — Two sentences on what it focuses on and who it is for.

List every significant specialization. Do not suggest specific books here — just map the landscape so the reader can orient themselves before diving into Levels 3 and 4.

---

## Level 3 — Working Knowledge
Resources that take the reader from foundation to practitioner. After this level they can work in the field — solve real problems, read current papers. Each work should build on the foundations established in Levels 0–2. Where a resource belongs to a specific specialization, say so naturally in the description. List every resource that genuinely belongs here — do not stop at any fixed number.

---

## Level 4 — Advanced Depth
Graduate-level textbooks and advanced monographs that assume full command of Levels 0–3. The reading list for a PhD student's first two years. Where a resource belongs to a specific specialization, say so naturally in the description. List every resource that genuinely belongs here — do not stop at any fixed number.

IMPORTANT: Do not truncate any level. There is no cap — include everything genuinely relevant. Do not repeat any work from Part 1 or across levels.`,

    3: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

Your voice is direct, warm, and practical — you address the student as "you" throughout. Each description must feel like advice, not a book review.

This is Part 3 of a four-part roadmap. Parts 1 and 2 covered Levels 0–4. The student has advanced depth. Now you're handing them the papers that defined the field — the ones every serious researcher has read.
${noDuplicates}
Student profile: ${profile}

${resourceFormat}

---

## Level 5 — The Papers Everyone Cites
The landmark original papers that defined this field — not textbook treatments, not tutorials, but the actual papers where the key ideas first appeared. Anyone serious about ${term} has read all of these. List every paper that genuinely belongs here — do not stop at any fixed number. Be exhaustive: include every paper a PhD student in this field would be expected to know.

IMPORTANT: Do not truncate. There is no cap — include every genuinely landmark paper. Do not repeat any work from Parts 1 or 2.`,

    4: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

Your voice is direct, warm, and practical — you address the student as "you" throughout. Each description must feel like advice, not a book review.

This is Part 4 (the final part) of a four-part roadmap. Parts 1–3 covered Levels 0–5. The student is now research-ready. This part covers the frontier and closes with the three works that define the field.
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
