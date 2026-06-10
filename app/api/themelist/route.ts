import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// Each batch covers different domains so we can chain 4 calls for full coverage
const BATCH_PROMPTS: Record<number, string> = {
  1: `Generate an exhaustive list of intellectual themes from these domains: Pure Mathematics (algebra, analysis, geometry, topology, number theory, combinatorics, logic, probability, statistics, foundations), Theoretical Computer Science (algorithms, complexity, information theory, computability, cryptography, formal languages, type theory), and Mathematical Physics (symmetry groups, differential geometry in physics, variational principles, conservation laws, phase transitions, renormalization).

For each theme give a plain one-sentence description a curious non-specialist would find interesting.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown:
{"c":"Category","n":"Theme Name","d":"Plain one-sentence description"}

Be exhaustive. Every significant theme, obvious and subtle. Aim for 250+ entries.`,

  2: `Generate an exhaustive list of intellectual themes from these domains: Physics (classical mechanics, quantum mechanics, relativity, thermodynamics, statistical mechanics, electromagnetism, optics, condensed matter, particle physics, cosmology, astrophysics), Chemistry (organic chemistry, physical chemistry, chemical bonding, reaction mechanisms, thermochemistry, spectroscopy, materials), and Biology (evolution, genetics, molecular biology, cell biology, developmental biology, ecology, neuroscience, physiology, systems biology).

For each theme give a plain one-sentence description a curious non-specialist would find interesting.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown:
{"c":"Category","n":"Theme Name","d":"Plain one-sentence description"}

Be exhaustive. Every significant theme, obvious and subtle. Aim for 250+ entries.`,

  3: `Generate an exhaustive list of intellectual themes from these domains: Economics (microeconomics, game theory, macroeconomics, behavioral economics, mechanism design, market structure, finance, political economy), Social Sciences (sociology, anthropology, political science, psychology, cognitive science, linguistics, semiotics, communication theory), and Philosophy (metaphysics, epistemology, philosophy of mind, ethics, logic, philosophy of science, aesthetics, philosophy of language, philosophy of mathematics).

For each theme give a plain one-sentence description a curious non-specialist would find interesting.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown:
{"c":"Category","n":"Theme Name","d":"Plain one-sentence description"}

Be exhaustive. Every significant theme, obvious and subtle. Aim for 250+ entries.`,

  4: `Generate an exhaustive list of intellectual themes from these domains: Systems & Complexity (complex systems, chaos theory, network theory, emergence, self-organisation, control theory, dynamical systems, cybernetics), Computer Science & AI (machine learning, algorithms, distributed systems, programming language theory, human-computer interaction, robotics), Cross-Domain Patterns (themes that appear across multiple fields — structural, dynamical, and conceptual patterns that recur in mathematics, physics, biology, economics, and beyond), and Arts & Humanities (music theory, visual arts, architecture, history, literary theory, cultural studies).

For each theme give a plain one-sentence description a curious non-specialist would find interesting.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown:
{"c":"Category","n":"Theme Name","d":"Plain one-sentence description"}

Be exhaustive. Every significant theme, obvious and subtle. Aim for 250+ entries.`,
};

export async function POST(req: NextRequest) {
  const { apiKey, batch } = await req.json();
  if (!apiKey || !batch) return new Response("apiKey and batch required", { status: 400 });

  const prompt = BATCH_PROMPTS[batch as number];
  if (!prompt) return new Response("Invalid batch", { status: 400 });

  const client = new Anthropic({ apiKey });
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
