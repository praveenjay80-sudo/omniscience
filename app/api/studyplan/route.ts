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

  const track =
    goal === "Academic mastery" ? "RESEARCH" :
    goal === "Build job skills" ? "PRACTITIONER" :
    "EXPLORER";

  const trackDesc =
    track === "RESEARCH" ? "Academic/Research — pursuing theoretical mastery and original research" :
    track === "PRACTITIONER" ? "Practitioner — building professional, applied skills for industry" :
    "Intellectual Explorer — seeking deep conceptual understanding and cross-disciplinary breadth";

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
- For Level 3 and above: if a work primarily serves one track (RESEARCH / PRACTITIONER / EXPLORER), weave that into the description naturally ("If you're building toward research, this is where the mathematical foundations become non-negotiable" or "For practitioners, this is the work that bridges theory and production").

Every resource must be a real, verifiable work — exact title, exact author. Omit rather than guess.`;

  const part = body.part ?? 1;
  const coveredTitles: string[] = body.coveredTitles ?? [];

  const noDuplicates = coveredTitles.length > 0
    ? `\nCRITICAL — these works were already covered in earlier parts of this curriculum. Do NOT include any of them again, even under a different level:\n${coveredTitles.map(t => `- ${t}`).join("\n")}\n`
    : "";

  const prompts: Record<number, string> = {
    1: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

Your voice is direct, warm, and practical — like a brilliant professor who actually cares whether you get there. You address the student as "you" throughout. Every resource you describe is a step in a continuous journey, not an isolated entry. Each description must feel like advice, not a book review.

This is Part 1 of a six-part Mastery Map. Cover the Field Orientation, Level 0, and Level 1.

Student profile: ${profile}
Student track: ${trackDesc}

${resourceFormat}
${noDuplicates}
---

## Field Orientation

Write three paragraphs of flowing prose (no sub-headers, addressed directly to "you"):

First paragraph: What ${term} actually IS — not a textbook definition, but a visceral account of what the field does and why it was invented. What fundamental question did humanity need to answer that this field was created to address? What does it mean to work in this field?

Second paragraph: What mastery looks like. What can someone who has truly mastered ${term} do, explain, or see that a non-specialist cannot? Give one concrete, specific example — a particular problem they can solve, a pattern they immediately recognize, an error they can immediately diagnose.

Third paragraph: Where ${term} sits among adjacent fields. What it borrows from, what it gives back, what makes it irreducibly its own discipline rather than a branch of something else.

---

## Your Path

One paragraph tailored to this student's track (${trackDesc}). Describe what their version of this curriculum emphasizes at the advanced levels — which specializations will matter most, what the work at Level 3+ will feel and look like, and what the destination looks like for someone on this specific path. Make it motivating and concrete.

---

## Level 0 — Before You Begin

These are not ${term}. These are the prerequisite subjects — math, theory, adjacent tools — you must already have before ${term} makes sense. Each entry should explain why it is a hard dependency. List every genuine prerequisite — do not stop at any fixed number.

---

## Level 1 — First Contact

Introductions assuming no prior knowledge of ${term} itself. After this level the reader understands what the field is, why it exists, and what it can do. List every resource that genuinely belongs here.

---

#### MILESTONE: FIRST CONTACT

Write one paragraph. Describe exactly what you can now do, explain, or understand that you couldn't before Level 1 — be specific, not vague. Then end with: "Before advancing to Level 2, test yourself: [one concrete diagnostic question or task]. If you can't yet answer it, return to [specific title from Level 1 that covers this gap] before continuing."

IMPORTANT: Do not truncate any level. There is no cap — include everything genuinely relevant. Do not repeat any work across levels.`,

    2: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

This is Part 2 of a six-part Mastery Map. Part 1 covered the Field Orientation, Levels 0 and 1. The student has first contact — they know what the field is. Now build the rigorous foundation.

Student profile: ${profile}
Student track: ${trackDesc}

${resourceFormat}
${noDuplicates}
---

## Level 2 — The Foundation

Core textbooks and foundational works that rigorously establish the fundamentals. Each one builds directly on what Levels 0–1 provided. After this level the student can reason precisely within ${term}. List every resource that genuinely belongs here — do not stop at any fixed number.

---

#### MILESTONE: FOUNDATION COMPLETE

Write one paragraph. Name the specific conceptual capability the student now has: what can they derive, prove, or precisely formulate that they couldn't before? Make it concrete — name the kind of problem they can now solve. Then: "Before advancing to Level 3, you should be able to [one specific test — a question, derivation, or explanation]. If you can't yet, [specific title] covers exactly this gap."

---

#### FOUNDATION PRACTICE

Before advancing, attempt these three things. Not more reading — doing:

1. [A specific problem to derive or prove from scratch without looking at the solution]
2. [A specific concept to explain in plain language to someone outside the field — name the concept]
3. [A specific thing to build, implement, replicate, or write — concrete and completable]

These are checkpoints. If you can't do them, the reading hasn't become usable knowledge yet.

IMPORTANT: Do not truncate. Include every resource that genuinely belongs at Level 2. Do not repeat any work from Part 1.`,

    3: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

This is Part 3 of a six-part Mastery Map. Parts 1–2 covered Field Orientation and Levels 0–2. The student has solid foundations. Now: map the full landscape, expose the live intellectual debates, then cover Level 3.

Student profile: ${profile}
Student track: ${trackDesc}

${resourceFormat}
${noDuplicates}
---

## Specializations — Where This Field Branches

The foundation is done. Before going further, map every major specialization and research direction within ${term}. Write as a mentor orienting a student who just finished the foundations and is deciding where to go next. For each specialization: two plain sentences — what it focuses on and what kind of person or problem it is for. Note which specializations are most relevant for the ${track} track.

**Specialization Name** — Two sentences on what it focuses on and who it is for.

List every significant specialization. No books here — just map the landscape.

---

## The Great Debates

These are the live intellectual fault lines where serious practitioners in ${term} genuinely disagree. Knowing these debates is what separates someone who read the books from someone who understands the field. A PhD student is expected to have positions on these.

For each debate use this exact format:

#### DEBATE: [NAME IN CAPS — 4 words max]

**The question:** One sentence stating exactly what is at stake — the precise point of disagreement.

- **[Camp A name]**: One sentence describing this position. *Key works: Author — Title, Author — Title*
- **[Camp B name]**: One sentence describing this position. *Key works: Author — Title, Author — Title*

**Why it matters:** One sentence on what is practically or theoretically at stake — what changes if one position turns out to be right.

List 4–6 debates. Choose only debates that are still live — where serious practitioners still disagree in the current literature. Do not include questions that have been settled.

---

## Level 3 — Working Knowledge

Resources that take you from foundation to practitioner. After this level you can work in the field — solve real problems, read current papers, contribute to a team. Each work should build directly on Levels 0–2. Where a resource belongs to a specific specialization, tag it. Where it primarily serves one track (RESEARCH / PRACTITIONER / EXPLORER), weave that into the description naturally.

List every resource that genuinely belongs here — do not stop at any fixed number.

IMPORTANT: Do not truncate any level. There is no cap. Do not repeat any work from Parts 1 or 2.`,

    4: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

This is Part 4 of a six-part Mastery Map. Parts 1–3 covered Levels 0–3. The student can work in the field. Now: graduate-level depth, then the landmark papers every serious researcher has read.

Student profile: ${profile}
Student track: ${trackDesc}

${resourceFormat}
${noDuplicates}
---

## Level 4 — Advanced Depth

Graduate-level textbooks and advanced monographs that assume full command of Levels 0–3. The reading list for a PhD student's first two years. Where a resource belongs to a specific specialization, tag it. ${
  track === "RESEARCH"
    ? "For the RESEARCH track: emphasize mathematical rigor, theoretical foundations, and works that directly open research directions."
    : track === "PRACTITIONER"
    ? "For the PRACTITIONER track: emphasize advanced applied works, production-grade systems, and works that bridge theory and professional practice."
    : "For the EXPLORER track: emphasize synthesis works, comprehensive surveys, and works that reveal the deep structure and cross-disciplinary connections."
} Weave track relevance into descriptions naturally. List every resource that genuinely belongs here.

---

## Level 5 — The Papers Everyone Cites

The landmark original papers where the key ideas in ${term} first appeared — not textbook treatments, not tutorials, but the actual papers. Anyone serious about ${term} has read all of these. Be exhaustive: include every paper a PhD student in this field would be expected to know. These are the documents that defined the vocabulary and problems.

---

#### MILESTONE: RESEARCH READY

Write one paragraph. The student who has completed Levels 0–5 is now research-ready. Describe precisely what this means: what can they read cold that they couldn't before, what kind of original contribution can they now imagine making for the first time, and how has their relationship to the field's open questions changed? End with: "You are research-ready when [one concrete diagnostic — a task that clearly demonstrates readiness, such as reading a specific type of paper or identifying a gap]."

IMPORTANT: Do not truncate any level. There is no cap. Do not repeat any work from Parts 1–3.`,

    5: `You are a world-class mentor guiding a student through ${context} from zero to mastery.

This is Part 5 of a six-part Mastery Map. Parts 1–4 covered Levels 0–5. The student is research-ready. Now: the current frontier, the three works that define the field, and what no book will tell them.

Student profile: ${profile}
Student track: ${trackDesc}

${resourceFormat}
${noDuplicates}
---

## Level 6 — The Research Frontier

High-impact recent papers and comprehensive surveys representing the current state of the art. What active researchers are reading and citing right now. Include every paper that genuinely belongs here — do not stop at any fixed number.

---

## The Three That Define the Field

If someone asks "what are the three works that define ${term} above all others" — these are them. One sentence each on why each is irreplaceable. These must not duplicate anything already covered in this curriculum.

---

## Tacit Knowledge

What experienced practitioners in ${term} know that isn't in any book or paper. The understanding that only comes from doing — the things every expert knows but nobody bothered to write down, because you're expected to absorb them through years of practice.

Write as numbered items, 4–6 total. For each: one sentence naming the tacit knowledge, one sentence on why it matters and why no textbook captures it. This is the mentor speaking from experience, not summarizing the literature. Be specific and honest — generic "practice matters" observations don't belong here.

1. [Specific tacit knowledge item]
[Why it matters and why it's unwritten]

IMPORTANT: Do not truncate any level. There is no cap. Do not repeat any work from Parts 1–4.`,

    6: `You are a world-class mentor adding the final synthesis layer to a study plan for ${context}.

Parts 1–5 gave the student the complete literature from prerequisites through the research frontier, plus the live debates and tacit knowledge. Part 6 is the meta-layer: the intellectual architecture beneath the literature, and the structural limit they will eventually stand before.

Student profile: ${profile}

Keep this part compact and precise — depth over coverage. Target 1,800–2,500 words total. Two sections only.

---

## The Deep Themes

The 4–6 deep intellectual themes that organise ${term} beneath its surface — not subfields or specialisations, but recurring organising ideas that keep reappearing across different parts of the literature and connect the field to the rest of human knowledge. A student who sees these themes will understand *why* the literature is shaped the way it is and will read everything they've already read differently.

For each theme use this format exactly:

#### [THEME NAME — four words or fewer, all caps]

Two sentences: what this theme is at its core and why it keeps recurring throughout ${term}. Then 2–4 key works — these may be works already in the curriculum (a theme is a new lens on the same reading, not new books) or works from other fields that illuminate the theme from outside. For each work, one sentence on why it is the best lens on this theme.

- **Title — Author (Year)**: One sentence on why this work best illuminates the theme. [Amazon](https://www.amazon.com/s?k=Title+Author) or [Scholar](https://scholar.google.com/scholar?q=Title+Author)

Do not pad. If a theme's list naturally has 2 works, list 2. Genuine insight only.

---

## The Horizon

Every field has a structural limit — a question it cannot answer using its own methods, not an open research problem that will eventually be solved, but a place where the field's tools are constitutively unable to reach. This is the horizon you will eventually stand at after mastering everything in this curriculum. Not a failure. The shape of the view.

#### THE CENTRAL APORIA

Two paragraphs (200–250 words). First: an everyday analogy that makes the paradox viscerally understandable before any technical language — something from ordinary experience that has exactly this structure. Second: the precise structural limit of ${term}, with one real historical moment when it surfaced and forced a fundamental rethinking. Write for the student who has now read the full curriculum — they can handle full precision. No hedging.

#### THE LOAD-BEARING METAPHOR

One paragraph (120–150 words). The hidden organising metaphor that shaped everything in this curriculum without being named. Show what it reveals about the field's subject matter. Show what it necessarily hides or makes invisible. Give one concrete example of a question this metaphor makes impossible to even formulate — something a person outside the field would naturally ask, but that the field's vocabulary has no room for.

#### WORKS THAT GET CLOSEST

3–5 works — from any era, any language, any tradition — that make the most genuine progress toward this structural limit. Selection criterion: how much genuine intellectual progress toward the horizon, not prestige or citation count. Include ancient texts, untranslated works, and approaches from adjacent fields if they get closest.

For each use this exact format:
### Title — Author (Year)
One sentence: what it attempts and precisely how close it gets. What it resolves and where the horizon still remains.

---

Write as a mentor who has guided many students to this level and finds this layer the most interesting of all. No hedging. Prose in body sections only.`,
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
