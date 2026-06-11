import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const RESOLUTION_LEVELS: Record<string, {
  name: string;
  instruction: string;
  format_w: string;
  format_f: string;
  examples: string;
  exclusions: string;
}> = {
  questions: {
    name: "Root Questions",
    instruction: `List every ROOT QUESTION that has organized a major domain of human inquiry. A root question is a question that, once articulated with precision, made an entire field of systematic investigation both possible and necessary. Before it was asked, the field had no center; after it was asked, researchers had a shared target. These are the founding interrogatives — not rhetorical, not vague, but specific enough that entire careers and institutions have been organized around attacking them.

Include questions from every domain: mathematics ("Are there infinitely many prime numbers?"), physics ("What is the nature of motion?"), biology ("What is the basic unit of heredity?"), psychology ("What drives behavior we cannot consciously access?"), economics ("Why do nations differ in wealth?"), philosophy ("What can we know, and how?"), linguistics ("What is the underlying structure of all human language?"), sociology ("What holds societies together despite self-interest?"), and every other domain.

Each entry is the question itself — phrased as the field's founding interrogative — along with who first formulated it precisely enough to generate a research program.`,
    format_w: "Thinker who first formulated this question precisely enough to generate systematic inquiry",
    format_f: "Fields that organized themselves around attacking this question",
    examples: `"What are the rules that make an argument valid regardless of its content?" (Aristotle) → logic, formal reasoning, mathematics
"What is the mechanism by which traits are inherited from parent to offspring?" (Mendel, Galton) → genetics, heredity, evolutionary biology
"What determines the exchange value of goods?" (Smith, Ricardo, Marx) → economics, political economy
"What is the nature of conscious experience, and how does it arise from matter?" (Descartes, Locke) → philosophy of mind, cognitive science, neuroscience`,
    exclusions: `Do not list concepts, methods, or specific findings — only the founding QUESTIONS. Do not list vague questions like "What is truth?" unless a specific field was actually built around attacking that precise formulation. Only questions that generated real research programs.`,
  },

  concepts: {
    name: "Root Concepts",
    instruction: `List every ROOT CONCEPT that gave thinkers a new handle on reality — a conceptual invention that, before it existed, made entire domains of thought impossible, and after it existed, made those domains inevitable. These are not discovered facts but invented lenses: new vocabulary that carved nature at joints no one had seen before.

A root concept is recognizable by this test: remove it from intellectual history, and an entire way of thinking becomes literally unthinkable. Not just harder — impossible. You cannot do genetics without "the gene." You cannot do computer science without "the algorithm." You cannot do psychoanalysis without "the unconscious." You cannot do information theory without "information" as Shannon defined it.

Include root concepts from every domain. Span mathematics (group, set, limit, proof by contradiction), physics (field, entropy, quantum state, spacetime), biology (natural selection, the gene, the cell, the ecosystem), psychology (the unconscious, conditioning, schema, cognitive dissonance), economics (marginal utility, externality, equilibrium), sociology (the social fact, anomie, habitus), linguistics (the phoneme, deep structure, the sign), political theory (sovereignty, social contract, rights), and every other domain.`,
    format_w: "Thinker who invented or first precisely defined this concept",
    format_f: "Fields that became possible or were transformed by this concept",
    examples: `The gene (Mendel/Johannsen) — a discrete, transmissible unit of heredity; without it, genetics cannot exist as a field
The field (Faraday/Maxwell) — force as a property of space itself, not action at a distance; without it, electromagnetism and quantum field theory cannot exist
The unconscious (Freud) — mental processes that are inaccessible to conscious introspection but causally potent; without it, depth psychology cannot exist
Information (Shannon) — a quantifiable, substrate-independent measure of uncertainty reduction; without it, computer science and communication theory cannot exist
Natural selection (Darwin) — differential reproduction as the mechanism of heritable change; without it, evolutionary biology cannot explain adaptation`,
    exclusions: `Do not list questions, methods, or specific findings — only ROOT CONCEPTS. Do not list broad subject areas like "evolution" or "quantum mechanics" — find the specific concept within them that was the key invention. Do not list generic tools like "model," "abstraction," "system," "optimization" — these are structural scaffolding, not intellectual roots.`,
  },

  methods: {
    name: "Root Methods",
    instruction: `List every ROOT METHOD that made systematic knowledge possible in a domain — a way of knowing, investigating, or proving that, before it was invented, left a domain as speculation or craft, and after it was invented, turned that domain into a rigorous discipline.

These are the epistemic inventions: the techniques by which humanity learned how to learn. Not subject-matter discoveries but the machinery of discovery itself. Without the controlled experiment, medicine is folklore. Without mathematical proof, mathematics is calculation. Without statistical inference, population-level claims are guesswork. Without ethnographic fieldwork, anthropology is travel writing.

Include root methods from every domain: mathematics (proof by contradiction, mathematical induction, axiomatic method), natural sciences (controlled experiment, double-blind trial, carbon dating, spectral analysis, X-ray crystallography), social sciences (ethnographic fieldwork, survey-based measurement, comparative historical analysis, randomized controlled trial in economics), humanities (textual criticism, comparative philology, hermeneutics, source criticism), psychology (introspection, psychophysics, behavior experiments, talk therapy), and every other domain.`,
    format_w: "Thinker or tradition that invented or formalized this method",
    format_f: "Fields that became rigorous or were transformed by this method",
    examples: `Controlled experiment (Bacon/Harvey) — varying one factor while holding all others constant to establish causation; turned natural philosophy into empirical science
Mathematical proof by contradiction (Greek mathematics/Euclid) — assuming the negation and deriving absurdity to establish necessity; made mathematics a domain of certain knowledge
Ethnographic fieldwork (Malinowski/Boas) — sustained immersive participation in a culture to understand it from within; turned anthropology from armchair speculation into a discipline
Spectral analysis (Bunsen/Kirchhoff) — identifying elements from their light emission signatures; opened astrophysics and analytical chemistry
Randomized controlled trial (Fisher/Bradford Hill) — random assignment to treatment and control to establish causal efficacy; made evidence-based medicine possible`,
    exclusions: `Do not list questions, concepts, or specific findings — only ROOT METHODS. Do not list broad approaches like "scientific method" — find the specific methodological invention. Do not list technologies (the telescope, the microscope) unless the key contribution was the investigative technique, not the instrument.`,
  },

  findings: {
    name: "Root Findings",
    instruction: `List every ROOT FINDING — a specific empirical discovery or mathematical result that, once established, permanently changed what was thinkable or doable in its field. These are specific things that were actually found out: not questions, not conceptual inventions, not methods — but results. Concrete, named, specific.

The test: is this known by a specific name, associated with a specific moment, and does it represent a single concrete intellectual contribution that the field now builds on as bedrock? "The earth orbits the sun" is a finding. "Natural selection" is a concept. "DNA is a double helix" is a finding. "The gene" is a concept.

Include findings from every domain: mathematics (Gödel's incompleteness theorems, the irrationality of √2, the prime number theorem, Cantor's uncountable infinities), physics (the constancy of the speed of light, black-body radiation quantization, the equivalence of mass and energy), biology (DNA carries hereditary information, the genetic code is a triplet code, the endosymbiotic origin of mitochondria), astronomy (the universe is expanding, galaxies are receding at speeds proportional to distance, the cosmic microwave background), chemistry (the periodic recurrence of elemental properties, the electron shell structure of atoms), medicine (germs cause specific diseases, neurons communicate via synapses), and every other domain.

Be exhaustive and specific. Named theorems, named effects, named experimental results, named discoveries.`,
    format_w: "Thinker(s) who established this finding",
    format_f: "Fields permanently changed by this finding",
    examples: `The irrationality of √2 (Pythagoreans/Hippasus) — some quantities cannot be expressed as ratios of integers; shattered the Pythagorean worldview and forced the development of real analysis
DNA is the molecule of heredity (Avery/Hershey-Chase) — the chemical identity of the gene; made molecular biology possible and redirected all of biology
The universe is expanding (Hubble) — galaxies recede at speeds proportional to distance; implied a beginning (Big Bang) and transformed cosmology from geometry to physics
Gödel's incompleteness theorems (Gödel) — any sufficiently powerful consistent formal system contains true statements it cannot prove; ended Hilbert's program and transformed foundations of mathematics
The constancy of the speed of light (Michelson-Morley/Einstein) — light speed is observer-independent; made special relativity necessary and shattered Newtonian absolute space and time`,
    exclusions: `Do not list questions, concepts, or methods — only specific FINDINGS. Do not list broad theories like "quantum mechanics" or "evolution" — find the specific result within them. Every entry must be a concrete named result, not a framework or a discipline.`,
  },
};

export async function POST(req: NextRequest) {
  const { apiKey, model: reqModel = "claude-sonnet-4-6", resolution = "concepts" } = await req.json();
  if (!apiKey) return new Response("apiKey is required", { status: 400 });

  const client = new Anthropic({ apiKey });
  const level = RESOLUTION_LEVELS[resolution] ?? RESOLUTION_LEVELS["concepts"];

  const prompt = `${level.instruction}

EXAMPLES OF WHAT BELONGS:
${level.examples}

WHAT DOES NOT BELONG HERE:
${level.exclusions}

Span all domains without bias: mathematics, logic, physics, chemistry, biology, medicine, earth sciences, astronomy, economics, psychology, sociology, anthropology, linguistics, philosophy, political theory, history, theology, arts.

Do not aim for any particular count. Generate every item that genuinely satisfies the definition above — and nothing that doesn't.

Return ONLY newline-delimited JSON, one object per line, no array brackets, no markdown, no commentary:
{"n":"Name","d":"One sentence for a complete beginner: what this is and why it mattered when it appeared","w":"${level.format_w}","f":["${level.format_f}"]}`;

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
