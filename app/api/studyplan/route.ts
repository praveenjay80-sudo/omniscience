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
    `${hoursPerWeek} hours/week available`,
    learningStyle ? `Learns best by: ${learningStyle}` : null,
  ].filter(Boolean).join(" | ");

  const prompt = `You are the world's best mentor for ${context}. You know this field not just from textbooks but from the inside — what actually works when learning it, what trips beginners up, which resources are genuinely good vs just famous, and what separates people who truly master it from people who dabble for years without getting anywhere.

Your student wants to learn ${context}.

**Their profile:** ${profile}

Create a **Mastermind Plan** — a phase-by-phase learning journey designed for exactly this person. Not a generic syllabus. An insider's roadmap written as personal advice.

---

Use this exact structure:

## Mastermind Plan: ${term}
*For: [echo their profile back in one crisp sentence — e.g. "A complete beginner aiming for academic mastery, studying 10 hours/week, learns best by building things"]*
*Honest time to real competence: [realistic estimate — don't sugarcoat]*

---

### Phase 1: [Give this phase a cinematic, evocative name — not "Phase 1: Basics". Something that captures what this phase actually feels like or achieves.]
*The mission: [One sentence — what mental shift or new capability this phase produces]*

**What you're going for**
[2-3 sentences. Not what you'll read — what you'll be able to think and do differently when this phase is done.]

**Your path**
1. [Specific resource — name the book with exact chapters, or name the course with exact modules] — [One opinionated sentence: WHY this resource and not the other famous one]
2. [Second resource, same format]
3. [Third resource only if genuinely needed]

**Proof test — before you move on, you must be able to:**
[One specific, concrete challenge. Not "understand X." Something like: "Explain X to someone at a dinner party without notes" or "Derive Y from scratch" or "Build Z from zero" or "Sit the exam in [book] chapters 1-4 and score 80%+."]

**The cheat code**
[The one insight or trick that makes this phase click — what an insider would whisper to you. Something you won't find in the table of contents.]

**Skip this**
[What most beginners waste time on in this phase and why it's a trap at this stage.]

**Time at ${hoursPerWeek}h/week:** ~[X] weeks

---

[4 to 6 phases total. Each phase should build on the last. Phase names should feel like chapters in a story.]

---

## The Graduation Test
[A specific, tangible project or artifact they could show the world. Not "keep studying." Something concrete: build X, write Y, solve Z, present W. Something that proves they've arrived.]

## The Mistake That Kills Most Learners
[The single biggest trap — what most self-studiers do wrong that stalls them for months or years. Be direct.]

## The Insider's Edge
[3 non-obvious pieces of advice that most resources won't tell you. Things that come from real experience with this field. Can include: what order NOT to do things in, an underrated resource everyone ignores, a mental model that changes everything, how professionals in this field actually think vs how textbooks present it.]

---

Be ruthlessly specific. Real book titles, real chapter numbers, real course names and module numbers. Be opinionated — say what's overrated by name. This is the plan you'd give your most promising student who trusted you completely and said "don't hold back, tell me exactly what to do."

Total length: 1200–1800 words.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 6144,
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
