import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2 } = await req.json();

  if (!apiKey || !term) {
    return new Response("apiKey and term are required", { status: 400 });
  }

  const context = [domain, l1, l2].filter(Boolean).join(" › ");

  const prompt = `Explain "${term}" (${context}) to someone who has never studied this subject and knows nothing about it.

You are the world's best teacher — patient, clear, full of vivid analogies. Assume ZERO prior knowledge. Every technical term you use must be defined in the same sentence. Write like you are talking to a curious 16-year-old who just asked "what even is this?"

Use these sections:

**What it is — the simple version**
Start with the simplest possible one-sentence definition. Then build it up using a vivid analogy to everyday life (cooking, music, sports, building things — pick whatever fits best). Explain it from first principles. By the end of this section the reader should be able to say "oh, so it's basically like…" to a friend. Aim for 5-6 sentences.

**Why anyone should care**
Don't assume the reader wants an academic career. Make it personal and real: what problems does this solve? Where does it show up in daily life, in the technology they use, in medicine, in society? Name specific things (apps, buildings, medicines, historical events). 4-5 sentences.

**The core ideas, one by one**
Pick 4-6 core concepts. For EACH one:
- A plain-English name (not the technical jargon, or if you must use jargon, define it immediately)
- A 2-3 sentence explanation a 16-year-old can follow
- A concrete analogy or real-world example they'd recognize

**Examples that make it stick**
2-3 vivid, specific real-world examples. Don't say "applications include X" — tell a brief story. "Imagine you are doing X… this is where ${term} comes in because…" Make the reader see it in the real world.

**The one thing that trips everyone up**
The most common confusion or misconception beginners have. State it plainly, then correct it simply. 3-4 sentences.

**Your first steps as a beginner**
3 specific resources:
1. A free online course or YouTube series (name it, say who made it, one sentence on why)
2. A beginner-friendly textbook (title + author, one sentence on why this one)
3. A popular science / general-audience book on this topic (title + author, one sentence on why)

Write at length. Be thorough. Every sentence must be understandable to someone with no background in this subject. Total length: 800–1100 words.`;

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
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
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
