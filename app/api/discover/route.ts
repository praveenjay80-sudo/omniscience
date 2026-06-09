import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

function buildPrompt(
  feature: string,
  term: string,
  context: string,
  params: Record<string, string>
): string {
  switch (feature) {
    case "insight":
      return `For the topic "${term}" (${context}), identify THE single most important insight — the one "aha moment" that, once truly understood, makes everything else in the field click. This is NOT a general overview. It is the deepest, most non-obvious insight that separates real understanding from surface familiarity. Write 2–3 focused paragraphs. Be specific. Name the exact insight.`;

    case "mentalmodels":
      return `For "${term}" (${context}), describe the 5 core mental models — actual thinking frameworks that experts use to reason about problems in this field. Not facts. Lenses for thinking.\n\nFor each:\n## [Model Name]\n[What it is and how experts use it — 2–3 sentences]\n**Example:** [One concrete use case]`;

    case "conceptdna":
      return `Break "${term}" (${context}) into its 5–7 irreducible atomic concepts — the building blocks that, if you truly understand all of them, you understand the field. These are the "atoms", not the "molecules".\n\nFor each:\n## [Atom Name]\n[What it is in 1–2 sentences]\n**Why essential:** [Why the whole field cannot exist without this]`;

    case "originstory":
      return `Tell the origin story of "${term}" (${context}). Who invented or discovered it? What specific unsolved problem forced its invention? What was the intellectual climate? Were there false starts or competing ideas? Make it vivid and narrative — include names, dates, human drama. End with: what changed for humanity once this concept existed?`;

    case "misconceptions":
      return `List the top 5 misconceptions students commonly hold about "${term}" (${context}). These should be real, subtle errors — not obvious ones.\n\nFor each:\n## Misconception [N]\n**The myth:** [As a student might say it]\n**Why it's wrong:** [Precise explanation]\n**The truth:** [The correct understanding]`;

    case "schools":
      return `Describe the main schools of thought in "${term}" (${context}). What are the fundamental disagreements? Who are the key thinkers on each side? What does each camp believe, and what is the strongest argument for their view? For unified fields, describe historical vs. modern debates or theoretical vs. applied factions. Be specific about names and positions.`;

    case "elevator":
      return `Write three versions of a 30-second elevator pitch for "${term}" (${context}):\n\n## For a 10-year-old\n[Familiar words and a vivid analogy, 2–4 sentences]\n\n## For a curious adult at a party\n[Engaging, no jargon, why it matters to them, 2–4 sentences]\n\n## For an expert in a different field\n[Technically precise but cross-disciplinary, 2–4 sentences]`;

    case "canon":
      return `Build the reading canon for "${term}" (${context}). Give exactly 5 books:\n1. **The Original Classic** — founding work or earliest essential text\n2. **The Standard Textbook** — what university courses assign\n3. **The Accessible Entry Point** — best for a complete beginner\n4. **The Advanced Monograph** — for serious depth\n5. **The Hidden Gem** — brilliant but underappreciated\n\nFor each: title, author, year, and one sentence on why this specific book.`;

    case "rabbithole":
      return `Create a reading chain for "${term}" (${context}). Start with the single best first book for a curious beginner. Then chain 6 more books, each naturally following from the previous — building on it, deepening it, or opening the next door.\n\nFormat a numbered list. For each: **[Title]** by [Author] — [one sentence: "After [previous book], read this because..."]`;

    case "papers":
      return `Name the 5 most foundational academic papers in "${term}" (${context}). For each:\n\n**[Title]** ([Author, Year])\n- What question it asked\n- What it proved or discovered\n- Why it still matters\n\nPrioritize papers that changed the direction of the field. Use real papers.`;

    case "semsimaltimeline":
      return `Create a timeline of landmark works and discoveries in "${term}" (${context}), from earliest origins to today.\n\nFormat: **[Year]** — [Event, paper, or book] — [Why it mattered]\n\nCover at least 8–10 entries spanning the full intellectual history of the field.`;

    case "hiddengems":
      return `What are the 5 best-kept secrets in "${term}" (${context})? Brilliant books, papers, essays, courses, or lectures that most learners never find — but that experts quietly recommend when asked "what actually changed how you think?" Avoid the famous names everyone already knows.\n\nFor each: what it is, who made it, and why experts love it despite being obscure.`;

    case "flashcards":
      return `Generate 10 Anki-style flashcards for "${term}" (${context}). Cover key definitions, important theorems or principles, historical facts, common misconceptions, and applications.\n\nFormat:\n**Q:** [precise question]\n**A:** [precise answer]\n\n---\n\n(repeat for all 10)`;

    case "careers":
      return `For someone who deeply masters "${term}" (${context}), what careers become available? List 6–8 specific job titles or roles (not vague fields), with:\n- What companies or organizations hire for this\n- What they do day-to-day\n- What complementary skills increase value\n- Realistic demand and salary range\n\nBe concrete. No generic "researcher" without specifics.`;

    case "frontiers":
      return `What are researchers and scholars actively working on in "${term}" (${context}) right now? Describe:\n- 3–4 open problems that remain unsolved\n- 2–3 recent breakthroughs (post-2018) that changed the field's direction\n- The most active subfields\n- What a PhD student entering today would likely work on\n\nBe specific about actual questions, not vague descriptions.`;

    case "history":
      return `Tell the complete intellectual history of "${term}" (${context}). Start from its earliest origins. How did the field evolve? What were the major paradigm shifts? Who were the key figures at each stage? What crises or controversies shaped it? End with where the field stands today. Write as a narrative with clear chronological sections.`;

    case "genealogy":
      return `Map the intellectual genealogy of "${term}" (${context}):\n1. What older fields gave birth to this one?\n2. Who are the founding figures?\n3. Key thinkers by generation: founding → classical → modern → contemporary\n4. What fields has this one spawned or heavily influenced?\n5. Who are the living thinkers at the frontier?\n\nWrite as a structured narrative.`;

    case "resources":
      return `Find the best learning resources for "${term}" (${context}). Give exactly one recommendation per category:\n\n## Best Free Online Course\n[Name, platform, why it's the best]\n\n## Best Textbook\n[Title, author, why beginners should start here]\n\n## Best YouTube or Lecture Series\n[Channel/series name, what makes it exceptional]\n\n## Best Community\n[Subreddit, Discord, forum, or mailing list]\n\n## Best Blog or Podcast\n[Name, host/author, what it covers]\n\n## Best First Paper to Read\n[Title, author, why start here]\n\nName the actual resource. Be specific.`;

    case "analogies":
      return `Explain "${term}" (${context}) using only concepts from ${params.domain || "everyday life"}. Find deep structural analogies — not superficial word-play, but genuine isomorphisms where the logic of one maps onto the logic of the other.\n\nExplain 3–4 core concepts through these analogies. End with: what insight does this analogy reveal that a textbook explanation misses?`;

    case "collision":
      return `Two apparently unrelated topics: "${term}" (${context}) and "${params.topic2 || "an unrelated field"}".\n\nFind the hidden connections:\n1. What structural similarities exist between them?\n2. Is there a shared mathematical or logical framework?\n3. Has research in one directly influenced the other?\n4. What insight from studying one makes you better at the other?\n5. If you designed a course combining both, what would it cover?\n\nBe specific. Surprise me.`;

    case "compare":
      return `Compare "${term}" (${context}) with "${params.topic2 || "a related field"}":\n\n## Core Similarities\n[What they fundamentally share — structure, goals, methods, or applications]\n\n## Key Differences\n[Where they diverge — scope, tools, assumptions, or audience]\n\n## Which to Learn First\n[And why — dependencies, generality, practical value]\n\n## Where They Intersect\n[Real research areas or applications using both together]\n\n## The Surprising Connection\n[One non-obvious relationship most people miss]`;

    case "quiz":
      return `Generate exactly 5 multiple-choice questions to test understanding of "${term}" (${context}). Mix difficulty: 2 beginner, 2 intermediate, 1 advanced.\n\nReturn ONLY a raw JSON array — no markdown fences, no other text:\n[\n  {\n    "question": "...",\n    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},\n    "correct": "A",\n    "explanation": "Why this answer is correct in 1–2 sentences."\n  }\n]`;

    case "feynman":
      return `A student is learning "${term}" (${context}) and wrote this explanation:\n\n---\n${params.userText || "(no text provided)"}\n---\n\nEvaluate their understanding precisely. Format:\n\n## What You Got Right\n[Specific concepts they understood correctly]\n\n## What's Missing or Imprecise\n[Specific gaps, vague statements, or errors]\n\n## What to Study Next\n[Specific concepts or resources to address the gaps]\n\n## Overall\n[1-sentence honest assessment of their current level]`;

    case "socratic": {
      const history = params.history ? (JSON.parse(params.history) as Array<{ role: string; content: string }>) : [];
      if (history.length === 0) {
        return `You are Socrates. A student wants to explore "${term}" (${context}) through dialogue. Your role is NOT to explain — it is to ask questions that help the student discover what they already know and where understanding breaks down. Ask ONE probing opening question. Not too hard, not trivial. Do not explain anything yet.`;
      }
      const formatted = history
        .map((m) => `${m.role === "user" ? "Student" : "Socrates"}: ${m.content}`)
        .join("\n\n");
      return `You are Socrates. You are in dialogue with a student about "${term}" (${context}). Ask questions, do not lecture.\n\nConversation so far:\n${formatted}\n\nRespond as Socrates: briefly acknowledge their answer (1 sentence), then ask ONE deeper follow-up question that probes further or exposes a gap.`;
    }

    default:
      return `Provide a comprehensive overview of "${term}" (${context}).`;
  }
}

export async function POST(req: NextRequest) {
  const { apiKey, feature, term, domain, l1, l2, params } = await req.json();

  if (!apiKey || !feature || !term) {
    return new Response("apiKey, feature, and term are required", { status: 400 });
  }

  const context = l2 ? `${l2} → ${l1} → ${domain}` : `${l1} → ${domain}`;
  const prompt = buildPrompt(feature, term, context, params || {});

  const client = new Anthropic({ apiKey });
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
      "Transfer-Encoding": "chunked",
    },
  });
}
