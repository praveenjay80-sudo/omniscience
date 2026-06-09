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
      return `You are explaining to a complete beginner — assume zero prior knowledge of "${term}" (${context}). Define every technical term you use.\n\nIdentify THE single most important insight about this field — the one "aha moment" that, once truly understood, makes everything else click. This is NOT a general overview or a definition. It is the one deep idea that separates someone who truly understands from someone who has just memorized facts.\n\nWrite 4–5 substantial paragraphs:\n1. State the insight in plain English, as simply as possible\n2. Explain WHY this insight is so fundamental — what does it unlock?\n3. Give a vivid real-world analogy that a non-expert would instantly grasp\n4. Show concretely how this insight shows up in actual problems or questions in the field\n5. Explain what a beginner gets WRONG before they have this insight, and what changes after\n\nBe specific. Be detailed. Write for a curious person who has never studied this subject.`;

    case "mentalmodels":
      return `You are explaining to a complete beginner who has never studied "${term}" (${context}). Define every technical term you use.\n\nDescribe the 5 core mental models — the actual thinking frameworks that experts use to reason about problems. Not facts to memorize. Ways of seeing.\n\nFor each mental model:\n## [Model Name — in plain English]\n[What this mental model is. Explain it as if to someone with zero background — 3–4 sentences]\n**Everyday analogy:** [Relate it to something from daily life — cooking, driving, building, sport]\n**How experts use it:** [A concrete example of applying this model to a real problem in ${term}]\n**What a beginner misses without it:** [What changes once you have this lens]`;

    case "conceptdna":
      return `You are explaining to a complete beginner who knows nothing about "${term}" (${context}).\n\nBreak this field into its 5–7 irreducible atomic concepts — the building blocks that, if you truly understand all of them, you understand the field. Think of these as the alphabet of the subject. Everything else is built from these atoms.\n\nFor each atom:\n## [Atom Name — in plain English]\n[Define this concept for someone who has never heard of it. No jargon without immediate explanation. 3–4 sentences.]\n**Everyday analogy:** [Make this concrete with something familiar]\n**Why everything else depends on this:** [Explain what breaks if you don't understand this atom]`;

    case "originstory":
      return `Tell the origin story of "${term}" (${context}) for a complete beginner. Write it like a narrative — vivid, human, dramatic.\n\nFirst: briefly explain what ${term} is in plain English (1–2 sentences), so the reader knows what story they're about to hear.\n\nThen tell the story:\n- What unsolved problem or mystery existed before this field/concept was invented?\n- Who were the key figures? What were they like as people?\n- What were the false starts and competing ideas?\n- What was the "eureka moment" or series of breakthroughs?\n- What did the world look like BEFORE this existed — and what changed AFTER?\n\nExplain all technical terms when you use them. Write at length — this should feel like reading a great popular-science book. Aim for 600–800 words.`;

    case "misconceptions":
      return `You are writing for a complete beginner learning "${term}" (${context}) for the first time.\n\nList the top 5 misconceptions that beginners and students commonly hold. These should be real, subtle errors that even fairly serious students make — not obviously wrong ideas.\n\nFor each misconception:\n## Misconception [N]: [State the myth as a catchy, specific claim]\n**The myth:** [Exactly what the beginner believes, in their own words — be specific, not vague]\n**Why so many people believe it:** [The logical reason this mistake makes sense — be sympathetic]\n**Why it's actually wrong:** [The correct understanding, explained step by step for a beginner. Use an analogy if helpful. 4–5 sentences.]\n**The real truth:** [A clear, simple restatement of the correct idea in plain language]\n\nDefine all technical terms. Write for someone with zero background.`;

    case "schools":
      return `You are explaining to a complete beginner — assume they know nothing about "${term}" (${context}).\n\nDescribe the main schools of thought — the different camps of people who disagree about fundamental questions in this field. Before diving in, briefly explain (in 2–3 plain-English sentences) what ${term} is, so the reader understands the context for the debates.\n\nFor each school of thought:\n## [School Name] — [1-sentence plain-English label]\n**What they believe:** [Their core position, explained in simple terms a beginner can follow. No jargon without explanation. 3–4 sentences.]\n**Key figures:** [Names and a brief word on who they are]\n**Their strongest argument:** [Why smart people find this view compelling — explained for a non-expert]\n**What critics say:** [The main objection, in plain language]\n\nIf the field is relatively unified, describe historical vs. modern debates, or theoretical vs. applied factions.`;

    case "elevator":
      return `Write three versions of a plain-English explanation of "${term}" (${context}). Each should be self-contained and require zero prior knowledge.\n\n## For a curious 10-year-old\n[Use only words a child knows. Start with an analogy to something they see every day. Make it feel exciting and accessible. 4–5 sentences.]\n\n## For a curious adult at a dinner party who has never studied this\n[No jargon at all. Explain why it matters to their daily life. Make them want to learn more. 4–6 sentences.]\n\n## For a professional in a completely different field\n[You can use adult vocabulary but no field-specific jargon. Draw a parallel to something in their professional world. 4–5 sentences.]`;

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
      return `You are writing for a complete beginner who just learned about "${term}" (${context}) and is wondering: "could I make a career out of this?"\n\nFirst, in 2–3 plain sentences, explain what kind of work people in this field actually do at a high level — so a beginner understands the career landscape before seeing specifics.\n\nThen list 6–8 specific careers. For each:\n## [Job Title]\n**What you'd actually do day-to-day:** [Concrete description of the work — specific tasks, not vague labels]\n**Who hires for this:** [Specific types of companies, government bodies, research labs, hospitals — name real examples]\n**Skills that make you competitive:** [What to learn alongside ${term}]\n**Entry point for a beginner:** [How someone with no experience starts — degree, bootcamp, portfolio, certification]\n**Salary range and demand:** [Realistic numbers and honest assessment of job market]\n\nWrite clearly for someone deciding whether to invest time in learning this field.`;

    case "frontiers":
      return `You are writing for a curious beginner who wants to know: "what are the biggest unsolved mysteries and recent breakthroughs in ${term} (${context})?" They have no background — explain all technical terms.\n\nStructure your response as:\n\n## The Big Unsolved Questions\nFor each of 3–4 open problems:\n- State the problem in plain English (what exactly don't we know?)\n- Why does it matter — what would solving it change?\n- Why is it so hard — what has blocked progress?\n\n## Recent Breakthroughs (post-2018)\nFor each of 2–3 recent advances:\n- What was discovered or invented?\n- Explain it simply — no jargon without definition\n- Why was it a big deal? What did it change?\n\n## Where the Action Is Now\nWhich subfields or approaches are most active today, and why?\n\n## If You Were Starting a PhD Today\nWhat problems would be most promising to work on, and why?`;

    case "history":
      return `Tell the complete intellectual history of "${term}" (${context}) for a complete beginner. Assume they know nothing — define all technical terms.\n\nWrite it like a great popular-science narrative: vivid, human, with real people and real stakes. Cover:\n- The earliest origins: what problem or question existed before this field?\n- The founding era: who were the pioneers and what did they contribute?\n- Each major era of development: what changed, why, and who drove it?\n- The paradigm shifts: moments when the whole field had to rethink its assumptions\n- Controversies and debates that shaped the field\n- Where the field stands today\n\nFor every era, explain what the work MEANT — not just what happened, but why it mattered and what it changed. Aim for 700–900 words. Write in flowing prose, not bullet points.`;

    case "genealogy":
      return `Map the intellectual genealogy of "${term}" (${context}) for a complete beginner who knows nothing about the field. Define all technical terms.\n\nWrite this as a narrative that shows where ideas come from and where they went.\n\n## The Parents: Fields That Gave Birth to This One\n[What older fields or ideas did ${term} grow out of? Explain each parent field in plain English and how it contributed.]\n\n## The Founders\n[Who are the 3–5 people most responsible for creating this field? For each: who they were, what they contributed, why it mattered — explained simply.]\n\n## Generation by Generation\nFor each generation of thinkers (founding, classical, modern, contemporary):\n- Who were the key figures?\n- What did they add or change?\n- What does a beginner need to know about their work?\n\n## The Children: Fields This One Spawned\n[What fields or sub-fields grew out of ${term}? How did the ideas spread?]\n\n## Living at the Frontier\n[Who are the important living figures working in this field today, and what are they working on?]`;

    case "resources":
      return `You are helping a complete beginner find the best resources to start learning "${term}" (${context}). They have no background — they need a clear, trustworthy starting kit.\n\nFor each category, give ONE specific recommendation and explain why it's the right choice for a beginner:\n\n## Best Free Online Course\n[Name of course, platform (Coursera, edX, MIT OCW, YouTube, etc.), who made it, link if known, and 2–3 sentences on why this is the best starting point]\n\n## Best Beginner Textbook\n[Full title, author, year, publisher if relevant, and 2–3 sentences on why this book works for complete beginners — what makes it accessible]\n\n## Best YouTube Channel or Lecture Series\n[Channel or series name, who runs it, and 2–3 sentences on what makes it exceptional for learning this subject]\n\n## Best Community to Join\n[Specific subreddit, Discord, forum, or mailing list — name it and explain what kind of help and discussion beginners find there]\n\n## Best Approachable Book for the General Public\n[A popular-science or general-interest book, not a textbook — title, author, and why it's a great way to get excited about the subject]\n\n## Best First Paper to Read\n[Title, author, year, and 2–3 sentences on why this paper is accessible and why it's a good introduction to how the field thinks]`;

    case "analogies":
      return `You are writing for a complete beginner learning "${term}" (${context}). Explain this field's core ideas using only concepts from ${params.domain || "everyday life"}.\n\nFirst, briefly explain what ${term} is in 2–3 plain sentences (no jargon).\n\nThen for each of 4–5 core concepts:\n## [Core Concept Name — in plain English]\n**The analogy:** [Explain this concept using ONLY the language and ideas of ${params.domain || "everyday life"}. Be specific and vivid. 3–4 sentences.]\n**Why this analogy works:** [What structural similarity makes this a genuine parallel, not just a surface resemblance?]\n**Where the analogy breaks down:** [Be honest — every analogy has limits. What does the real concept do that the analogy can't capture?]\n\nEnd with a paragraph on what insight this way of thinking reveals that a standard textbook explanation typically misses.`;

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

    case "phdexam":
      return `You are a PhD examination committee at a top research university designing a qualifying exam for "${term}" (${context}). Write for a complete beginner so they understand exactly what mastery looks like — this exam is their north star for years of study, not something they sit today. Define any technical terms.\n\n## The Reading List\n25 essential works (papers, books, review articles) a PhD candidate must have read deeply before this exam. For each:\n**[Author(s), Year — Title]**\nType: [paper / textbook / monograph / review article]\nWhy required: [The specific argument, result, or method it contains that a PhD candidate must know — 2–3 sentences]\n\n## Essay Questions\n6 PhD-level essay questions that require synthesis, critical thinking, and original argument — not recall. For each:\n**Q[N]: [Question]**\n*What a strong answer covers:* [Key debates, depth of knowledge, and quality of argument a top candidate would demonstrate — 3–4 sentences]\n\n## Technical Problems (or Source Analysis)\nIf the field has technical problems (mathematics, physics, economics, formal methods): provide 3 problems of escalating difficulty with what a full solution requires. If primarily humanistic: provide 3 close-reading or primary-source analysis exercises instead.\n\n## What Separates a Pass from a Fail\nA frank description of what examiners actually look for: depth vs. breadth, command of literature, quality of argument, ability to think on your feet. What does the best candidate do that the weakest does not?\n\nBe thorough. Do not abbreviate the reading list or questions.`;

    case "annotatedbib":
      return `Create a comprehensive annotated bibliography for "${term}" (${context}). This is for a serious beginner who wants to engage with the actual literature.\n\nInclude at minimum 15 works — papers, books, and review articles. Cover the foundational classics, key empirical and theoretical papers, important critiques, recent developments, and at least 2 works that challenge the mainstream view.\n\nFor EVERY work, write a full scholarly annotation. Do not summarise. Do not add a word cap. Write the complete annotation:\n\n**[Author(s), Year. "Title." Journal or Publisher.]**\n[A full annotation of 6–8 sentences covering:\n— What question or problem this work addresses\n— The central argument or main finding\n— The evidence or methodology used\n— How it fits into the broader conversation in ${term} — who it responds to, who responds to it\n— Its key strengths\n— Its limitations or what it misses or leaves open\n— Who specifically should read it and at what stage of study]\n\nDo not shorten any annotation. Do not add a total word limit. A reader must be able to decide intelligently whether to read each work based solely on your annotation.`;

    case "depmap":
      return `Build a complete concept dependency map for "${term}" (${context}). This is for a complete beginner — explain every concept in plain English with no assumed knowledge.\n\nGoal: reveal the hidden LEARNING ORDER beneath the curriculum. Which concepts are truly foundational, and which can only be understood after others are in place?\n\n## Foundation Layer — Learn These First\n[3–5 bedrock concepts. Nothing else is needed to understand these. For each:\n**[Concept Name]**\nWhat it is: [Plain-English definition, 2–3 sentences, no jargon without explanation]\nWhy it comes first: [What it directly unlocks in the next layer]]\n\n## Layer 2 — Requires Foundation Layer\n[Concepts that build directly on foundations. For each:\n**[Concept Name]**\nWhat it is: [Plain-English, 2–3 sentences]\nDepends on: [Specific foundation concepts — name them]\nWhat it unlocks: [Which Layer 3 concepts become accessible once this is understood]]\n\n## Layer 3 — Requires Layer 2\n[Same format — go as deep as the field requires]\n\n## Layer 4+ — Advanced\n[Same format for any remaining advanced concepts]\n\n## The Full Dependency Graph\nEnd with a compact text map showing the chains:\n[Concept A] → [Concept B] → [Concept C]\n[Concept A] + [Concept D] → [Concept E]\n\nInclude every major concept in the field. A student must be able to use this as a literal study sequence from day one.`;

    case "longread":
      return `Write a long-form essay about "${term}" (${context}) — the kind of piece published in The Atlantic, Aeon, or The New Yorker. Your reader is highly curious but has zero background in this subject.\n\nThis is NOT a definition, a survey, or a list of facts. Choose the single most important, surprising, or counterintuitive idea in this field and develop it at full depth.\n\nRequirements:\n— Open with a vivid scene, a striking anecdote, or a provocation that hooks the reader in the first paragraph. Do not start with a definition.\n— Build a sustained argument or tell a story — every paragraph advances it\n— Introduce technical ideas gradually through narrative and analogy, never assuming prior knowledge. Every technical term defined on first use.\n— Show the human side: the people who built this field, the struggles, the stakes, the moments of doubt and breakthrough\n— Take a position. This is not Wikipedia. Have a point of view.\n— Reach a conclusion that changes how the reader sees something familiar\n— Leave the reader wanting to learn more\n\nWrite at full length — 1500 to 2000 words. Do not rush. Do not summarise. Every paragraph must earn its place. Write with a strong, clear authorial voice.`;

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
      "Transfer-Encoding": "chunked",
    },
  });
}
