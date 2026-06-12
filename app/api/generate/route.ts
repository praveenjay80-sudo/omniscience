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
    ? `You are an academic taxonomist. List the named subfields within "${l2}" (a broad branch of "${l1}", domain "${domain}").

The hierarchy is: Domain → L1 → L2 (broad branch) → L3 (named subfields) → [L4: sub-concepts within each subfield].

L3 items must be NAMED SUBFIELDS — areas large enough to be an undergraduate or graduate course, each containing many specific techniques, theorems, and sub-concepts.

Examples of correct L3 granularity:
- L2 "Algebra" → L3: "Abstract Algebra", "Linear Algebra", "Commutative Algebra", "Homological Algebra", "Universal Algebra", "Lie Theory", "Algebraic K-Theory", "Representation Theory"
- L2 "Abstract Algebra" → L3: "Group Theory", "Ring Theory", "Field Theory", "Module Theory", "Galois Theory", "Category Theory"
- L2 "Analysis" → L3: "Real Analysis", "Complex Analysis", "Functional Analysis", "Harmonic Analysis", "Measure Theory", "Fourier Analysis", "Operator Theory"
- L2 "Geometry" → L3: "Differential Geometry", "Algebraic Geometry", "Riemannian Geometry", "Symplectic Geometry", "Convex Geometry", "Discrete Geometry"
- L2 "Group Theory" → L3: "Finite Group Theory", "Infinite Group Theory", "Geometric Group Theory", "Lie Groups", "Algebraic Groups", "Permutation Groups"

DO NOT list sub-concepts, specific theorems, or techniques (those belong at L4):
- WRONG for L2 "Abstract Algebra": "Sylow Theorems", "Galois Extensions", "Jordan-Hölder Theorem", "Noetherian Rings"
- WRONG for L2 "Algebra": "Group Theory", "Ring Theory", "Galois Theory" (those are L3 of "Abstract Algebra", not L3 of "Algebra")

List all named subfields within "${l2}". Be exhaustive — include every genuine subfield.
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
      controller.enqueue(encoder.encode(" "));
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
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
