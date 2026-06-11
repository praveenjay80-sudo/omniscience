import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const {
    apiKey,
    mode = "generate",
    term,
    domain,
    l1,
    l2,
    insertTitle,
    existingChain,
  } = await req.json();

  if (!apiKey) return new Response("apiKey is required", { status: 400 });
  if (!term) return new Response("term is required", { status: 400 });

  const client = new Anthropic({ apiKey });
  const fieldPath = [domain, l1, l2, term].filter(Boolean).join(" → ");

  let prompt: string;

  if (mode === "insert") {
    if (!insertTitle || !existingChain) return new Response("insertTitle and existingChain required for insert mode", { status: 400 });
    prompt = `A reader studying "${term}" (${fieldPath}) has found a work they want to place in the reading chain below.

Work to place: "${insertTitle}"

Existing reading chain:
${existingChain}

Your task: determine exactly where "${insertTitle}" belongs in this chain and explain why.

Output in this exact format:

**Fits between:** [title of work it follows] → [title of work it precedes]
(Use "Chain start" if it belongs before all listed works, or "Chain end" if it belongs after all.)

**Why here:** Two sentences. First: what the reader will have from the works before this point that makes them ready for "${insertTitle}". Second: what "${insertTitle}" specifically contributes that prepares the reader for what comes after.

---

Then write the reading chain entry for "${insertTitle}" in the standard format:

### [Exact Title] — [Author(s)] ([Year])
[Language tag if not English, e.g. · German]

**Requires:** [What the reader needs before this — one sentence pointing to specific prerequisites or the previous work in the chain]
**Contributes:** [What the reader gains — the specific capability, insight, or framework this work provides — one sentence]
**Enables:** [What this prepares the reader for next — one sentence]`;
  } else {
    prompt = `Build a reading chain for someone who wants to develop genuine mastery of "${term}" (${fieldPath}).

A reading chain is a linear sequence of works where each one builds on the previous. The sequence should be the single most direct path from first encounter to genuine working knowledge. Not a comprehensive bibliography — a spine. Each step should feel necessary, not optional.

Selection criteria:
— Choose works that are genuinely the best next step at each point in the journey, regardless of fame, era, or language
— Include primary sources, textbooks, papers, and essays as appropriate to the actual learning sequence
— Include works from other fields if they provide the most direct path to understanding
— Include works in original languages if they are the genuine best step (note the language)
— Aim for 8–12 works total; include more only if the path genuinely requires it

For each work use this exact format:

### [Exact Title] — [Author(s)] ([Year])
[Language tag on same line if not English, e.g. · German]

**Requires:** [What the reader needs before this work — one sentence; for the first work write "Starting point — no prerequisites needed" or name the minimal background]
**Contributes:** [The specific capability, framework, or insight this work gives the reader — one sentence; be precise, not generic]
**Enables:** [What the reader can now do or read that they couldn't before — one sentence; for the last work write "Chain complete — [what mastery looks like]"]

Separate each entry with a line containing only three dashes: ---

Do not number the works. Do not add commentary outside the entry format. The chain should speak for itself.`;
  }

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
