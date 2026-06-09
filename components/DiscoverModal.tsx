"use client";

import { useState, useEffect, useRef } from "react";

// ── Feature registry ──────────────────────────────────────────────────────────

interface FeatureDef {
  id: string;
  label: string;
  desc: string;
}

const FEATURE_GROUPS: { title: string; features: FeatureDef[] }[] = [
  {
    title: "UNDERSTAND",
    features: [
      { id: "insight", label: "1% Insight", desc: "The one aha-moment that makes it all click" },
      { id: "mentalmodels", label: "Mental Models", desc: "How experts actually think about this" },
      { id: "conceptdna", label: "Concept DNA", desc: "The irreducible atomic building blocks" },
      { id: "depmap", label: "Dependency Map", desc: "What to learn in what order" },
      { id: "originstory", label: "Origin Story", desc: "Who invented it and why" },
      { id: "misconceptions", label: "Misconceptions", desc: "What most learners get wrong" },
      { id: "schools", label: "Schools of Thought", desc: "Intellectual camps and debates" },
      { id: "elevator", label: "Elevator Pitch", desc: "How to explain it to anyone" },
      { id: "longread", label: "The Long Read", desc: "1500-word essay on the key idea" },
    ],
  },
  {
    title: "WORKS",
    features: [
      { id: "canon", label: "The Canon", desc: "5 essential books" },
      { id: "rabbithole", label: "Reading Chain", desc: "7-book rabbit hole" },
      { id: "papers", label: "Paper Trail", desc: "Foundational academic papers" },
      { id: "semsimaltimeline", label: "Seminal Timeline", desc: "Landmark works by year" },
      { id: "hiddengems", label: "Hidden Gems", desc: "Obscure but brilliant resources" },
      { id: "annotatedbib", label: "Annotated Bibliography", desc: "15+ works with full scholarly annotations" },
      { id: "flashcards", label: "Flashcards", desc: "10 Anki-style Q&A cards" },
    ],
  },
  {
    title: "EXPLORE",
    features: [
      { id: "careers", label: "Career Paths", desc: "Jobs that use this knowledge" },
      { id: "frontiers", label: "Research Frontiers", desc: "What's being worked on now" },
      { id: "history", label: "Field History", desc: "How the field evolved" },
      { id: "genealogy", label: "Intellectual Genealogy", desc: "Family tree of ideas" },
      { id: "resources", label: "Resource Finder", desc: "Best course, book, community" },
    ],
  },
  {
    title: "CONNECT",
    features: [
      { id: "analogies", label: "Domain Analogies", desc: "Explain using another field" },
      { id: "collision", label: "Topic Collision", desc: "Hidden connections to another topic" },
      { id: "compare", label: "Compare Topics", desc: "Side-by-side comparison" },
    ],
  },
  {
    title: "TEST YOURSELF",
    features: [
      { id: "phdexam", label: "PhD Qualifying Exam", desc: "Reading list, essay Qs, and problem sets" },
      { id: "quiz", label: "Quiz Me", desc: "5 questions to test your knowledge" },
      { id: "feynman", label: "Feynman Test", desc: "Write it, Claude grades it" },
      { id: "socratic", label: "Socratic Dialogue", desc: "Claude asks, you answer" },
    ],
  },
];

const ALL_FEATURES: FeatureDef[] = FEATURE_GROUPS.flatMap((g) => g.features);

// Features requiring a parameter input before generating
const PARAM_FEATURES: Record<string, { label: string; placeholder: string }> = {
  analogies: { label: "Explain using concepts from:", placeholder: "e.g. cooking, music, architecture…" },
  collision: { label: "Find hidden connections with:", placeholder: "e.g. Quantum Mechanics, Jazz Theory…" },
  compare: { label: "Compare with:", placeholder: "e.g. Differential Equations, Graph Theory…" },
};

// Features that should not be cached (depend on user input or are interactive sessions)
const NO_CACHE = new Set(["feynman", "socratic"]);

interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

interface SocraticMessage {
  role: "user" | "assistant";
  content: string;
}

interface DiscoverModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
}

// ── Inline markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const inline = (s: string) =>
      s.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={j} className="text-gray-200 font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        )
      );

    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-sm font-bold text-white mt-5 mb-1.5">
          {line.slice(3)}
        </h2>
      );
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="text-sm font-semibold text-blue-300 mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">
          {inline(line.slice(2))}
        </li>
      );
    if (line.match(/^\d+\. /))
      return (
        <li key={i} className="text-gray-400 ml-4 text-xs list-decimal leading-relaxed">
          {inline(line.replace(/^\d+\. /, ""))}
        </li>
      );
    if (line.startsWith("---"))
      return <hr key={i} className="border-gray-700 my-3" />;
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-gray-400 text-xs leading-relaxed">
        {inline(line)}
      </p>
    );
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DiscoverModal({
  term,
  domain,
  l1,
  l2,
  apiKey,
  onClose,
}: DiscoverModalProps) {
  const [selectedFeature, setSelectedFeature] = useState<string>("insight");

  // Shared result state: featureId → streamed text
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Param inputs (for analogies, collision, compare)
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Feynman state
  const [feynmanText, setFeynmanText] = useState("");
  const [feynmanFeedback, setFeynmanFeedback] = useState("");
  const [feynmanLoading, setFeynmanLoading] = useState(false);

  // Socratic state
  const [socraticHistory, setSocraticHistory] = useState<SocraticMessage[]>([]);
  const [socraticInput, setSocraticInput] = useState("");
  const [socraticLoading, setSocraticLoading] = useState(false);
  const socraticBottomRef = useRef<HTMLDivElement>(null);

  const cacheBase = `omni_discover::${domain}::${l1}::${l2 ?? ""}::${term}`;

  function cacheKey(feature: string, param?: string) {
    return param
      ? `${cacheBase}::${feature}::${param}`
      : `${cacheBase}::${feature}`;
  }

  // Load all simple cached results on mount
  useEffect(() => {
    const loaded: Record<string, string> = {};
    ALL_FEATURES.forEach(({ id }) => {
      if (NO_CACHE.has(id) || id in PARAM_FEATURES) return;
      const cached = localStorage.getItem(cacheKey(id));
      if (cached) loaded[id] = cached;
    });
    if (Object.keys(loaded).length > 0) setResults(loaded);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start socratic dialogue when selected
  useEffect(() => {
    if (selectedFeature === "socratic" && socraticHistory.length === 0 && !socraticLoading) {
      startSocratic();
    }
  }, [selectedFeature]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll socratic to bottom
  useEffect(() => {
    socraticBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socraticHistory]);

  // ── Generate helpers ────────────────────────────────────────────────────────

  async function generate(feature: string, params?: Record<string, string>) {
    if (!apiKey) return;
    setLoading(feature);

    try {
      let res: Response;
      try {
        res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, feature, term, domain, l1, l2, params }),
        });
      } catch {
        throw new Error("Cannot reach the server. Check your connection or try again in a moment.");
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}${errText ? `: ${errText}` : ""}`);
      }

      if (!res.body) throw new Error("Empty response from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setResults((prev) => ({ ...prev, [feature]: text }));
      }

      if (!text.includes("__ERROR__:") && !NO_CACHE.has(feature)) {
        const paramKey = params ? Object.values(params)[0] : undefined;
        localStorage.setItem(cacheKey(feature, paramKey), text);
      }

      // Parse quiz JSON after full stream
      if (feature === "quiz") {
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
          try {
            const questions = JSON.parse(text.slice(start, end + 1)) as QuizQuestion[];
            setQuizQuestions(questions);
            setQuizAnswers({});
            setQuizSubmitted(false);
            localStorage.setItem(cacheKey("quiz"), text.slice(start, end + 1));
          } catch {}
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setResults((prev) => ({ ...prev, [feature]: `Error: ${msg}` }));
    } finally {
      setLoading(null);
    }
  }

  async function generateFeynman() {
    if (!apiKey || !feynmanText.trim()) return;
    setFeynmanLoading(true);
    setFeynmanFeedback("");

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey, feature: "feynman", term, domain, l1, l2,
          params: { userText: feynmanText },
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setFeynmanFeedback(text);
      }
    } catch (err) {
      setFeynmanFeedback(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setFeynmanLoading(false);
    }
  }

  async function startSocratic() {
    if (!apiKey) return;
    setSocraticLoading(true);
    setSocraticHistory([]);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey, feature: "socratic", term, domain, l1, l2,
          params: { history: "[]" },
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSocraticHistory([{ role: "assistant", content: text }]);
      }
    } catch (err) {
      setSocraticHistory([{ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed"}` }]);
    } finally {
      setSocraticLoading(false);
    }
  }

  async function sendSocraticReply() {
    if (!apiKey || !socraticInput.trim() || socraticLoading) return;
    const userMsg = socraticInput.trim();
    setSocraticInput("");

    const updatedHistory: SocraticMessage[] = [
      ...socraticHistory,
      { role: "user", content: userMsg },
    ];
    setSocraticHistory(updatedHistory);
    setSocraticLoading(true);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey, feature: "socratic", term, domain, l1, l2,
          params: { history: JSON.stringify(updatedHistory) },
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      const withPlaceholder: SocraticMessage[] = [...updatedHistory, { role: "assistant", content: "" }];
      setSocraticHistory(withPlaceholder);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSocraticHistory([
          ...updatedHistory,
          { role: "assistant", content: text },
        ]);
      }
    } catch (err) {
      setSocraticHistory([
        ...updatedHistory,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed"}` },
      ]);
    } finally {
      setSocraticLoading(false);
    }
  }

  // ── Load param-feature cached result when input changes ────────────────────

  function loadParamCached(feature: string, param: string) {
    const cached = localStorage.getItem(cacheKey(feature, param));
    if (cached) setResults((prev) => ({ ...prev, [feature]: cached }));
    else setResults((prev) => { const next = { ...prev }; delete next[feature]; return next; });
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderTextFeature(feature: string) {
    const def = ALL_FEATURES.find((f) => f.id === feature)!;
    const result = results[feature];
    const isLoading = loading === feature;
    const isFlashcards = feature === "flashcards";

    return (
      <div className="space-y-3">
        <div>
          <p className="text-white font-semibold text-sm">{def.label}</p>
          <p className="text-gray-500 text-xs mt-0.5">{def.desc}</p>
        </div>

        {!result && !isLoading && (
          <button
            onClick={() => generate(feature)}
            disabled={!apiKey}
            className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            {apiKey ? "Generate" : "Enter API key first"}
          </button>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Generating with Claude…
          </div>
        )}

        {result && (
          <>
            {result.includes("__ERROR__:") ? (
              <p className="text-red-400 text-xs">{result.split("__ERROR__:")[1]?.trim()}</p>
            ) : (
              <div className="space-y-0.5">{renderMarkdown(result)}</div>
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => generate(feature)}
                disabled={isLoading || !apiKey}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Regenerate
              </button>
              {isFlashcards && (
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-gray-500 hover:text-blue-300 transition-colors"
                >
                  Copy All
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderParamFeature(feature: string) {
    const def = ALL_FEATURES.find((f) => f.id === feature)!;
    const paramDef = PARAM_FEATURES[feature];
    const param = paramInputs[feature] ?? "";
    const result = results[feature];
    const isLoading = loading === feature;

    return (
      <div className="space-y-3">
        <div>
          <p className="text-white font-semibold text-sm">{def.label}</p>
          <p className="text-gray-500 text-xs mt-0.5">{def.desc}</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">{paramDef.label}</label>
            <input
              type="text"
              value={param}
              onChange={(e) => {
                setParamInputs((prev) => ({ ...prev, [feature]: e.target.value }));
                if (e.target.value.trim()) loadParamCached(feature, e.target.value.trim());
              }}
              placeholder={paramDef.placeholder}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => {
              if (param.trim()) {
                generate(feature, { [feature === "analogies" ? "domain" : "topic2"]: param.trim() });
              }
            }}
            disabled={!param.trim() || isLoading || !apiKey}
            className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors self-end"
          >
            {isLoading ? "…" : result ? "Re-run" : "Generate"}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Generating with Claude…
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-0.5">
            {result.includes("__ERROR__:")
              ? <p className="text-red-400 text-xs">{result.split("__ERROR__:")[1]?.trim()}</p>
              : renderMarkdown(result)
            }
          </div>
        )}
      </div>
    );
  }

  function renderQuiz() {
    const isLoading = loading === "quiz";

    // Load cached quiz on first render
    if (!quizQuestions && !isLoading && !results["quiz"]) {
      const cached = localStorage.getItem(cacheKey("quiz"));
      if (cached) {
        try {
          const q = JSON.parse(cached) as QuizQuestion[];
          if (quizQuestions === null) setQuizQuestions(q);
        } catch {}
      }
    }

    return (
      <div className="space-y-4">
        <div>
          <p className="text-white font-semibold text-sm">Quiz Me</p>
          <p className="text-gray-500 text-xs mt-0.5">5 questions to test your understanding</p>
        </div>

        {!quizQuestions && !isLoading && (
          <button
            onClick={() => generate("quiz")}
            disabled={!apiKey}
            className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            {apiKey ? "Generate Quiz" : "Enter API key first"}
          </button>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Generating questions…
          </div>
        )}

        {quizQuestions && (
          <div className="space-y-5">
            {quizQuestions.map((q, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-white text-xs font-medium mb-2">
                  <span className="text-gray-500 mr-1">Q{i + 1}.</span> {q.question}
                </p>
                <div className="space-y-1">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const selected = quizAnswers[i] === opt;
                    const isCorrect = opt === q.correct;
                    let cls = "text-gray-400 border-gray-700 bg-transparent";
                    if (quizSubmitted) {
                      if (isCorrect) cls = "text-green-300 border-green-700 bg-green-950/50";
                      else if (selected) cls = "text-red-400 border-red-800 bg-red-950/50";
                    } else if (selected) {
                      cls = "text-violet-300 border-violet-600 bg-violet-950/40";
                    }
                    return (
                      <button
                        key={opt}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [i]: opt }))}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors ${cls}`}
                      >
                        <span className="font-mono mr-2">{opt}.</span> {q.options[opt]}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{q.explanation}</p>
                )}
              </div>
            ))}

            {!quizSubmitted ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Check Answers ({Object.keys(quizAnswers).length}/{quizQuestions.length})
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  Score:{" "}
                  <span className={
                    Object.values(quizAnswers).filter((a, i) => a === quizQuestions[i].correct).length >= 4
                      ? "text-green-400" : "text-yellow-400"
                  }>
                    {Object.values(quizAnswers).filter((a, i) => a === quizQuestions[i].correct).length}/
                    {quizQuestions.length}
                  </span>
                </span>
                <button
                  onClick={() => { generate("quiz"); setQuizSubmitted(false); setQuizAnswers({}); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  New Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderFeynman() {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-white font-semibold text-sm">Feynman Test</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Explain {term} in your own words, as if teaching a beginner. Claude will identify exactly what you understand and what you don&apos;t.
          </p>
        </div>

        <textarea
          value={feynmanText}
          onChange={(e) => setFeynmanText(e.target.value)}
          placeholder={`Explain ${term} in your own words…`}
          rows={5}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        />

        <button
          onClick={generateFeynman}
          disabled={!feynmanText.trim() || feynmanLoading || !apiKey}
          className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          {feynmanLoading ? "Evaluating…" : feynmanFeedback ? "Re-evaluate" : "Get Feedback"}
        </button>

        {feynmanLoading && !feynmanFeedback && (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Claude is reading your explanation…
          </div>
        )}

        {feynmanFeedback && (
          <div className="space-y-0.5 border-t border-gray-800 pt-3">
            {renderMarkdown(feynmanFeedback)}
          </div>
        )}
      </div>
    );
  }

  function renderSocratic() {
    return (
      <div className="flex flex-col h-full space-y-3" style={{ minHeight: 320 }}>
        <div>
          <p className="text-white font-semibold text-sm">Socratic Dialogue</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Claude asks questions. You answer. The goal is to discover the edges of your understanding.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[300px]">
          {socraticLoading && socraticHistory.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Socrates is thinking of a question…
            </div>
          )}
          {socraticHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-900/60 text-violet-100 border border-violet-800"
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="text-gray-500 text-[10px] block mb-0.5">Socrates</span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {socraticLoading && socraticHistory.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            </div>
          )}
          <div ref={socraticBottomRef} />
        </div>

        <div className="flex gap-2 border-t border-gray-800 pt-3">
          <input
            type="text"
            value={socraticInput}
            onChange={(e) => setSocraticInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSocraticReply(); } }}
            placeholder="Your answer…"
            disabled={socraticLoading}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
          />
          <button
            onClick={sendSocraticReply}
            disabled={!socraticInput.trim() || socraticLoading}
            className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Send
          </button>
          <button
            onClick={startSocratic}
            disabled={socraticLoading}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            title="Restart dialogue"
          >
            ↺
          </button>
        </div>
      </div>
    );
  }

  function renderContent() {
    if (selectedFeature === "quiz") return renderQuiz();
    if (selectedFeature === "feynman") return renderFeynman();
    if (selectedFeature === "socratic") return renderSocratic();
    if (selectedFeature in PARAM_FEATURES) return renderParamFeature(selectedFeature);
    return renderTextFeature(selectedFeature);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Discover</p>
            <h2 className="text-white font-semibold text-base">{term}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0 overflow-y-auto border-r border-gray-700 py-2">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title} className="mb-1">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-3 py-1.5">
                  {group.title}
                </p>
                {group.features.map((f) => {
                  const hasResult =
                    f.id === "quiz" ? !!quizQuestions :
                    f.id === "feynman" ? !!feynmanFeedback :
                    f.id === "socratic" ? socraticHistory.length > 0 :
                    !!results[f.id];
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFeature(f.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                        selectedFeature === f.id
                          ? "bg-violet-900/40 text-violet-300"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      }`}
                    >
                      {hasResult && (
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0" />
                      )}
                      {!hasResult && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Content pane */}
          <div className="flex-1 overflow-y-auto p-5">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
