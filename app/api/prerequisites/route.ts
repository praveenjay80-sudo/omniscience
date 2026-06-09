import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2 } = await req.json();

  if (!apiKey || !term) {
    return new Response("apiKey and term are required", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const context = l2
    ? `"${term}" (a specific subfield of ${l2} → ${l1} → ${domain})`
    : `"${term}" (a broad branch of ${l1} → ${domain})`;

  const prompt = `You are an academic curriculum expert. Analyze the prerequisites for studying ${context}.

Return a JSON object with this EXACT structure (no markdown, no explanation, raw JSON only):
{
  "difficulty": {
    "depth": <integer 1-10, number of prerequisite steps>,
    "estimatedMonths": <integer, total months from zero for a dedicated student studying ~10h/week>,
    "level": <"Introductory" | "Undergraduate" | "Graduate" | "Research">,
    "hoursTotal": <integer, estimated total study hours>
  },
  "chain": [
    {
      "name": "<prerequisite name>",
      "why": "<one sentence: why this is a hard requirement>",
      "months": <integer, months to learn this step, 0 if trivial/assumed>
    }
  ]
}

Rules:
- The chain must start from the most basic prerequisite (high school level if applicable)
- The LAST item in the chain must be "${term}" itself with why: "Target field" and months: 0
- Include only genuine hard prerequisites — not "nice to haves"
- Be honest about difficulty — do NOT underestimate
- For estimatedMonths assume ~10h/week dedicated study
- Return ONLY the raw JSON object`;

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
