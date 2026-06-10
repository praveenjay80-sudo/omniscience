import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, theme } = await req.json();
  if (!apiKey || !theme) return new Response("apiKey and theme are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are the world's most creative academic guide. A student has asked you to trace one deep theme across all of human knowledge.

Theme: "${theme}"

Write as a brilliantly excited mentor who has spent a lifetime noticing how this theme keeps reappearing in the most unexpected places. Use "you" throughout — mentor speaking to student, not encyclopedia entry.

---

## The Theme

One powerful paragraph: what is the deepest essence of "${theme}"? What is it really, at its core? Why does it keep appearing everywhere? What would fully understanding it mean?

---

## Where It Lives

For every field where "${theme}" plays a central or genuinely surprising role — write one sentence per field on how the theme manifests there. Be exhaustive and surprising. Include obvious fields AND the non-obvious ones that will delight the reader.

---

## The Curriculum

For each major field where the theme is central, a focused reading progression of the works that best illuminate THIS THEME in that field. Not a complete field curriculum — only works where "${theme}" is the main protagonist. Use "you" voice connecting each work to the theme.

For each resource:

### Title — Author(s) (Year) · TAG

Where TAG is CORE, ESSENTIAL, or OPTIONAL.

2–3 sentences as mentor. Start with transition from what came before. Say what you gain. End with where it leads or how it connects to the theme's broader arc. Weave in: [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Google Scholar](https://scholar.google.com/scholar?q=Title+Author) or [arXiv](https://arxiv.org/search/?query=Title&searchtype=all) for papers. Encode spaces as +.

Organise resources under field headings:

#### [Field Name]

[resources for this field]

Do not cap resources per field. Include every work where this theme is genuinely central.

---

## The Rosetta Stone Moments

The specific discoveries where the theme appeared in two completely separate fields and turned out to be secretly the same thing. For each moment: what the two fields called it, why they seemed unrelated, and the exact moment someone saw through to the unity. These are the most electrifying events in intellectual history.

---

## The Deepest Unification

One paragraph. If all these manifestations are aspects of one underlying truth — what is that truth? The most unified, beautiful statement of what "${theme}" really is, written for someone who has just read the entire curriculum and is now ready to see the whole.`;

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
