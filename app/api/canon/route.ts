import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6", domain, l1, l2 } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });
  if (!l1) return new Response("l1 is required", { status: 400 });

  const client = new Anthropic({ apiKey });
  const topic = l2 ? `${l1} → ${l2}` : l1;
  const specific = l2 || l1;

  const prompt = `Generate the core canon for: **${topic}**

These are the most influential works that any serious student, researcher, or practitioner in **${specific}** must know. Include seminal papers, definitive textbooks, important monographs, and landmark classics — works that shaped the field, established its methods, or remain the authoritative resource at their level.

For each work provide:
- Exact title as commonly known
- Author name(s)
- Year of first publication (negative for BCE)
- 2-sentence description for someone starting out: what the work covers and why it belongs in the canon of ${specific}
- Level: exactly one of "Introductory" (accessible to a curious non-specialist), "Undergraduate" (first/second year), "Graduate" (advanced coursework), "Research" (frontier-level, specialists)
- Type: exactly one of "Textbook" (pedagogical resource), "Monograph" (research contribution), "Paper" (journal/conference article), "Classic" (foundational work that established the field)
- Amazon search URL for books (encode spaces as +), null for papers/ancient texts
- Google Scholar URL for papers and academic articles, null for trade books

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown fences, no commentary:
{"t":"Title","a":"Author","y":year,"d":"Description","lvl":"Graduate","tp":"Textbook","amazon":"url_or_null","scholar":"url_or_null"}

EXAMPLE ENTRIES (format reference only):
{"t":"Algebra","a":"Serge Lang","y":1965,"d":"Lang's comprehensive graduate algebra text covering groups, rings, fields, modules, and Galois theory with full rigour. The standard reference that every algebraist keeps on their desk.","lvl":"Graduate","tp":"Textbook","amazon":"https://www.amazon.com/s?k=Serge+Lang+Algebra","scholar":null}
{"t":"Topics in Algebra","a":"I.N. Herstein","y":1964,"d":"Herstein's elegant undergraduate introduction to abstract algebra that taught a generation of mathematicians. Renowned for its clean proofs and well-chosen exercises.","lvl":"Undergraduate","tp":"Textbook","amazon":"https://www.amazon.com/s?k=Herstein+Topics+in+Algebra","scholar":null}
{"t":"Abstract Algebra","a":"Dummit and Foote","y":1991,"d":"The most comprehensive modern undergraduate–graduate bridge text in algebra, covering all standard topics with unusual depth and a wealth of examples. The go-to reference for graduate students.","lvl":"Undergraduate","tp":"Textbook","amazon":"https://www.amazon.com/s?k=Dummit+Foote+Abstract+Algebra","scholar":null}

Now generate the complete canon for ${topic}. Be thorough — include 20–35 works spanning the full difficulty spectrum from introductory to research level.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: (reqModel === "claude-haiku-4-5-20251001" ? reqModel : "claude-sonnet-4-6") as "claude-sonnet-4-6" | "claude-haiku-4-5-20251001",
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
