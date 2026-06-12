import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, term, domain, l1, l2 } = await req.json();

  if (!apiKey) return new Response("apiKey is required", { status: 400 });
  if (!term) return new Response("term is required", { status: 400 });

  const client = new Anthropic({ apiKey });
  const fieldPath = [domain, l1, l2, term].filter(Boolean).join(" → ");

  const prompt = `List the L4 sub-concepts of "${term}" (${fieldPath}) — the specific named topics within this subfield that each deserve their own reading chain.

The hierarchy is: Domain → L1 → L2 (broad branch) → L3 (named subfield, which is "${term}") → L4 (specific topics within "${term}").

L4 items must be one level MORE specific than "${term}" — named topics, techniques, or theory clusters that a serious student would study as a distinct body of work within "${term}".

Examples of correct L4 granularity:
- L3 "Abstract Algebra" → L4: "Group Theory", "Ring Theory", "Field Theory", "Module Theory", "Galois Theory", "Category Theory", "Homological Algebra"
- L3 "Group Theory" → L4: "Finite Groups", "Abelian Groups", "Free Groups", "Geometric Group Theory", "Lie Groups", "Permutation Groups", "Group Representations"
- L3 "Real Analysis" → L4: "Measure Theory", "Lebesgue Integration", "Metric Spaces", "Sequences and Series", "Differentiation Theory", "Function Spaces"
- L3 "Quantum Mechanics" → L4: "Wave Mechanics", "Matrix Mechanics", "Angular Momentum", "Perturbation Theory", "Quantum Scattering", "Many-Body Theory"

Requirements:
— Each item must be one level deeper than "${term}", not the same level or broader
— Order them in prerequisite sequence: foundational before advanced
— Include every genuine major division; typically 5–10 items but let the subject determine the count

Return ONLY a JSON array of strings. No explanation, no markdown, no commentary.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(" "));
      try {
        const s = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
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
