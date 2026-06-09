import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2, hoursPerWeek, prerequisites } =
    await req.json();

  if (!apiKey || !term || !hoursPerWeek) {
    return new Response("apiKey, term, and hoursPerWeek are required", {
      status: 400,
    });
  }

  const client = new Anthropic({ apiKey });

  const prereqChain = Array.isArray(prerequisites)
    ? prerequisites.map((p: { name: string }) => p.name).join(" → ")
    : "";

  const context = l2
    ? `"${term}" (${l2} → ${l1} → ${domain})`
    : `"${term}" (${l1} → ${domain})`;

  const prompt = `You are an expert academic advisor. Create a detailed, actionable week-by-week study plan for learning ${context}.

Student profile: ${hoursPerWeek} hours per week available.
${prereqChain ? `Prerequisite chain to follow: ${prereqChain}` : ""}

Format the plan exactly like this:

## Study Plan: ${term}
**Total Duration:** X weeks (~Y months)
**Weekly commitment:** ${hoursPerWeek} hours/week

---

### Phase 1: [Phase Name] (Weeks 1–N)
**Goal:** What the student can do after this phase.

**Week 1–2: [Topic Name]**
- Key concept or skill to cover
- Key concept or skill to cover
- **Resource:** Specific book title / free course (e.g. MIT OpenCourseWare 18.06)
- **Milestone:** What "done" looks like

[Continue one block per 1–3 weeks for the full phase]

---

### Phase 2: [Phase Name] ...

[Continue phases until mastering ${term}]

---

## Tips for Success
- Specific tip 1 for this learning path
- Specific tip 2
- Specific tip 3

Be concrete. Name real textbooks, courses, or lecture series. Do not pad.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 4096,
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
      "Transfer-Encoding": "chunked",
    },
  });
}
