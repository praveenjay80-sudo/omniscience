import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, question, domain, l1 } = await req.json();
  if (!apiKey || !question) return new Response("apiKey and question are required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are the world's most thoughtful intellectual guide. A student wants to understand this deep question: "${question}" — in the context of ${l1} (${domain}).

Write as a brilliant, excited mentor using "you" throughout. This is not an encyclopedia entry — it is a conversation with someone who genuinely wants to think.

---

## The Question

What exactly is being asked? Why is this particular formulation the right one? What would it actually mean — for the field and for human understanding — if we had a real answer?

---

## Why It Resists Answer

Not "it's complicated" — the specific structural reasons why brilliant people have been stuck here for so long. What approaches have been tried and where exactly did they break down? What would you need — philosophically, technically, conceptually — to even begin?

---

## What Each Field Says

Every discipline that has seriously attacked this question. For each:

#### [Field Name]

2–3 sentences as mentor: what this field brings to the question, how far it gets, and exactly where it stops. Be exhaustive — include the obvious fields and the surprising ones.

---

## The Closest We've Come

Not a list — a narrative of the most serious attempts. The specific thinkers, works, and moments that came nearest. What each achieved and where it stopped.

---

## Why It Stays Open

The deepest reason. Not lack of data or tools, but the structural or philosophical reason this question resists resolution. Is the question itself possibly malformed? Could there be multiple incompatible answers that are all valid? Is there a fundamental limit to what any mind can know here?

---

## Essential Works

The works that best illuminate this question from multiple angles.

### Title — Author(s) (Year) · TAG

Where TAG is CORE, ESSENTIAL, or OPTIONAL. 2 sentences as mentor on what this work contributes specifically to this question. Include [Amazon](https://www.amazon.com/s?k=Title+Author) for books, [Scholar](https://scholar.google.com/scholar?q=Title+Author) for papers. Encode spaces as +.

Do not cap the list. Include every work that genuinely advances the question.`;

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
