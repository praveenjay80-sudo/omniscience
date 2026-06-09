import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, domain, l1, l2 } = await req.json();

  if (!apiKey || !domain || !l1) {
    return new Response("apiKey, domain, and l1 are required", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const isL3 = !!l2;

  const prompt = isL3
    ? `You are an academic taxonomist. List the specific subfields and named areas within "${l2}" (which is a broad branch of "${l1}", domain "${domain}").

The hierarchy is: Domain → L1 → L2 (broad branch) → L3 (specific subfields within that branch).

Example of correct L3 items:
- For L2 "Algebra" → L3: "Abstract Algebra", "Linear Algebra", "Commutative Algebra", "Homological Algebra", "Universal Algebra", "Lie Algebras", "Group Theory", "Ring Theory", "Field Theory", "Galois Theory"
- For L2 "Analysis" → L3: "Real Analysis", "Complex Analysis", "Functional Analysis", "Harmonic Analysis", "Numerical Analysis", "Measure Theory", "Fourier Analysis"
- For L2 "Geometry" → L3: "Euclidean Geometry", "Differential Geometry", "Algebraic Geometry", "Projective Geometry", "Riemannian Geometry", "Topology"

Now list all the specific subfields/named areas within "${l2}". Be exhaustive.
Return ONLY a raw JSON array of strings. No markdown, no explanation, no code fences.

["Subfield 1","Subfield 2",...]`
    : `You are an academic taxonomist. List the broad top-level branches of "${l1}" (domain "${domain}").

The hierarchy is: Domain → L1 → L2 (broad branches) → L3 (specific subfields within each branch).

L2 items must be BROAD BRANCHES — high-level groupings that each contain many specific subfields.

Example of correct L2 items:
- For L1 "Mathematics" → L2: "Algebra", "Analysis", "Geometry", "Topology", "Number Theory", "Combinatorics", "Applied Mathematics", "Logic & Foundations", "Probability & Statistics"
- For L1 "Physics" → L2: "Classical Mechanics", "Quantum Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Relativity", "Particle Physics", "Condensed Matter", "Astrophysics"
- For L1 "Biology" → L2: "Cell Biology", "Genetics", "Ecology", "Evolutionary Biology", "Microbiology", "Physiology", "Developmental Biology", "Molecular Biology"

DO NOT list specific subfields like "Abstract Algebra", "Linear Algebra", "Real Analysis" — those belong at L3.

List all broad branches of "${l1}". Return ONLY a raw JSON array of strings. No markdown, no explanation, no code fences.

["Branch 1","Branch 2",...]`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
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
