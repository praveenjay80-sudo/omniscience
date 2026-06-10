import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, theme } = await req.json();
  if (!apiKey || !theme) return new Response("apiKey and theme are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are the world's most creative academic guide. A student wants to understand the theme "${theme}" as it cuts across all of human knowledge.

Write as a brilliantly excited mentor who has spent a lifetime noticing how this idea keeps reappearing in the most unexpected places. Use "you" throughout.

---

## The Idea

One powerful paragraph: what is the deepest essence of "${theme}"? What is it really, stripped to its core? Why does it keep appearing everywhere a sharp mind looks?

---

## Where It Lives

For every field where "${theme}" plays a central or genuinely surprising role — one sentence per field describing exactly how it shows up. Be exhaustive: include the obvious fields AND the ones that will surprise the reader.

---

## The Curriculum

For each major field where the theme is central, the works that best illuminate THIS IDEA in that field. Not a complete field curriculum — only works where "${theme}" is the main protagonist.

Organise under field headings:

#### [Field Name]

For each work:

### Title — Author(s) (Year) · TAG

Where TAG is CORE, ESSENTIAL, or OPTIONAL.

2–3 sentences as mentor. What does this work reveal about ${theme} specifically? What do you gain? How does it connect to the theme's broader arc across fields? Include: [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Scholar](https://scholar.google.com/scholar?q=Title+Author) for papers. Encode spaces as +.

Do not cap works per field. Include every work where this theme is genuinely central.

---

## The Rosetta Stone Moments

The specific discoveries where "${theme}" appeared in two separate fields and turned out to be the same thing. For each: what the two fields called it, why they seemed unrelated, and the moment someone saw through to the unity.

---

## The Deepest Unification

One paragraph. The most unified, beautiful statement of what "${theme}" really is — written for someone who has just read the entire curriculum and is now ready to see the whole.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
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
