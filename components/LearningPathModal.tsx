"use client";

import React, { useState, useEffect } from "react";

interface Prerequisite {
  name: string;
  why: string;
  months: number;
}

interface Difficulty {
  depth: number;
  estimatedMonths: number;
  level: string;
  hoursTotal: number;
}

interface PrereqData {
  difficulty: Difficulty;
  chain: Prerequisite[];
}

interface LearningPathModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  Introductory: "text-green-400",
  Undergraduate: "text-blue-400",
  Graduate: "text-yellow-400",
  Research: "text-red-400",
};

export default function LearningPathModal({
  term,
  domain,
  l1,
  l2,
  apiKey,
  onClose,
}: LearningPathModalProps) {
  const [tab, setTab] = useState<"prereq" | "plan">("prereq");

  const [prereqData, setPrereqData] = useState<PrereqData | null>(null);
  const [prereqLoading, setPrereqLoading] = useState(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [background, setBackground] = useState("");
  const [goal, setGoal] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [planText, setPlanText] = useState("");
  const [planLoading, setPlanLoading] = useState(false);

  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [bookPrereqs, setBookPrereqs] = useState<Record<string, string>>({});
  const [bookPrereqLoading, setBookPrereqLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPrerequisites();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPrerequisites() {
    const key = `omni_prereq::${domain}::${l1}::${l2 ?? ""}::${term}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        setPrereqData(JSON.parse(cached));
        return;
      } catch {}
    }

    if (!apiKey) {
      setPrereqError("Enter your API key first.");
      return;
    }

    setPrereqLoading(true);
    setPrereqError(null);

    try {
      const res = await fetch("/api/prerequisites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, term, domain, l1, l2 }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }

      if (text.includes("__ERROR__:")) {
        setPrereqError(text.split("__ERROR__:")[1].trim());
        return;
      }

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("Unexpected response format");

      const data = JSON.parse(text.slice(start, end + 1)) as PrereqData;
      localStorage.setItem(key, JSON.stringify(data));
      setPrereqData(data);
    } catch (err) {
      setPrereqError(
        err instanceof Error ? err.message : "Failed to load prerequisites"
      );
    } finally {
      setPrereqLoading(false);
    }
  }

  function extractTitles(text: string): string[] {
    return (text.match(/^### .+$/gm) ?? []).map((l) => l.replace(/^### /, "").trim());
  }

  async function streamPart(part: number, coveredTitles: string[], onChunk: (t: string) => void): Promise<string> {
    const res = await fetch("/api/studyplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey, term, domain, l1, l2,
        hoursPerWeek, background, goal, learningStyle, part, coveredTitles,
      }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    if (!res.body) throw new Error("Empty response");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      onChunk(text);
    }
    return text;
  }

  async function fetchStudyPlan() {
    const profileKey = `${hoursPerWeek}::${background}::${goal}::${learningStyle}`;
    const key = `omni_plan::${domain}::${l1}::${l2 ?? ""}::${term}::${profileKey}`;
    const cached = localStorage.getItem(key);
    if (cached) { setPlanText(cached); return; }

    if (!apiKey) { setPlanText("Enter your API key first."); return; }

    setPlanLoading(true);
    setPlanText("");

    const sep = "\n\n---\n\n";
    try {
      const part1 = await streamPart(1, [], (t) => setPlanText(t));
      if (part1.includes("__ERROR__:")) { setPlanText(part1); return; }

      const titles1 = extractTitles(part1);
      setPlanText(part1 + sep);
      const part2 = await streamPart(2, titles1, (t) => setPlanText(part1 + sep + t));
      if (part2.includes("__ERROR__:")) { setPlanText(part1 + sep + part2); return; }

      const titles2 = [...titles1, ...extractTitles(part2)];
      setPlanText(part1 + sep + part2 + sep);
      const part3 = await streamPart(3, titles2, (t) => setPlanText(part1 + sep + part2 + sep + t));
      if (part3.includes("__ERROR__:")) { setPlanText(part1 + sep + part2 + sep + part3); return; }

      const titles3 = [...titles2, ...extractTitles(part3)];
      setPlanText(part1 + sep + part2 + sep + part3 + sep);
      const part4 = await streamPart(4, titles3, (t) => setPlanText(part1 + sep + part2 + sep + part3 + sep + t));
      if (part4.includes("__ERROR__:")) { setPlanText(part1 + sep + part2 + sep + part3 + sep + part4); return; }

      const full = part1 + sep + part2 + sep + part3 + sep + part4;
      localStorage.setItem(key, full);
    } catch (err) {
      setPlanText((prev) => prev + `\n\nError: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setPlanLoading(false);
    }
  }

  async function fetchBookPrereqs(title: string) {
    if (expandedBooks.has(title)) {
      setExpandedBooks((prev) => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
      return;
    }
    setExpandedBooks((prev) => new Set([...prev, title]));
    if (bookPrereqs[title]) return;
    setBookPrereqLoading(title);
    try {
      const res = await fetch("/api/bookprereqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, title, term, domain, l1 }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      if (!res.body) throw new Error("Empty response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setBookPrereqs((prev) => ({ ...prev, [title]: text }));
      }
    } catch (err) {
      setBookPrereqs((prev) => ({
        ...prev,
        [title]: `Error: ${err instanceof Error ? err.message : "Failed"}`,
      }));
    } finally {
      setBookPrereqLoading(null);
    }
  }

  function renderPrereqMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.trim() === "") return <div key={i} className="h-0.5" />;
      const tagMatch = line.match(/\[(CORE|ESSENTIAL|OPTIONAL)\]/);
      const tag = tagMatch ? tagMatch[1] : null;
      const tagColors: Record<string, string> = {
        CORE: "bg-red-900/60 text-red-300 border-red-700/50",
        ESSENTIAL: "bg-blue-900/60 text-blue-300 border-blue-700/50",
        OPTIONAL: "bg-gray-800 text-gray-400 border-gray-700",
      };
      const cleanLine = tag ? line.replace(` [${tag}]`, "") : line;
      const parts = cleanLine.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((p, j) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={j} className="text-gray-300 font-medium">
              {p.slice(2, -2)}
            </strong>
          );
        const lm = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (lm)
          return (
            <a key={j} href={lm[2]} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline underline-offset-2">
              {lm[1]}
            </a>
          );
        return p;
      });
      return (
        <p key={i} className="text-gray-500 text-xs leading-relaxed flex items-start gap-1.5 flex-wrap">
          {tag && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>
              {tag}
            </span>
          )}
          {parts}
        </p>
      );
    });
  }

  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      const inline = (s: string): React.ReactNode[] =>
        s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)/g).map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**"))
            return <strong key={j} className="text-gray-200 font-semibold">{p.slice(2, -2)}</strong>;
          const lm = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (lm)
            return (
              <a key={j} href={lm[2]} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                {lm[1]}
              </a>
            );
          if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
            return <em key={j} className="text-gray-500 not-italic">{p.slice(1, -1)}</em>;
          return p;
        });

      if (line.startsWith("## "))
        return (
          <h2 key={i} className="text-sm font-bold text-white mt-6 mb-2 pb-1 border-b border-gray-800">
            {inline(line.slice(3))}
          </h2>
        );
      if (line.startsWith("### ")) {
        const raw = line.slice(4).trim();
        const tagMatch = raw.match(/\s·\s(CORE|ESSENTIAL|OPTIONAL)$/);
        const tag = tagMatch ? tagMatch[1] : null;
        const displayTitle = tag ? raw.slice(0, -tagMatch![0].length) : raw;
        const tagColors: Record<string, string> = {
          CORE: "bg-red-900/60 text-red-300 border-red-700/50",
          ESSENTIAL: "bg-blue-900/60 text-blue-300 border-blue-700/50",
          OPTIONAL: "bg-gray-800 text-gray-400 border-gray-700",
        };
        const isExpanded = expandedBooks.has(raw);
        const isLoading = bookPrereqLoading === raw;
        const prereqContent = bookPrereqs[raw];
        return (
          <React.Fragment key={i}>
            <div className="flex items-baseline gap-2 mt-4 mb-0.5">
              <h3 className="text-sm font-semibold text-blue-300 flex-1">
                {inline(displayTitle)}
              </h3>
              {tag && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>
                  {tag}
                </span>
              )}
              <button
                onClick={() => fetchBookPrereqs(raw)}
                className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {isLoading ? "…" : isExpanded ? "▲ prereqs" : "↳ prereqs"}
              </button>
            </div>
            {isExpanded && (
              <div className="ml-3 mt-1 mb-3 pl-3 border-l-2 border-gray-800 py-1.5 space-y-1">
                {isLoading ? (
                  <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                    <span className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                    Loading prerequisites…
                  </div>
                ) : prereqContent ? (
                  renderPrereqMarkdown(prereqContent)
                ) : null}
              </div>
            )}
          </React.Fragment>
        );
      }
      if (line.startsWith("#### "))
        return (
          <h4 key={i} className="text-xs font-semibold text-violet-400 mt-3 mb-0.5 uppercase tracking-wide">
            {line.slice(5)}
          </h4>
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
        return <hr key={i} className="border-gray-800 my-4" />;
      if (line.trim() === "") return <div key={i} className="h-1" />;
      // Specialization line: **Name** — description
      const specMatch = line.match(/^\*\*([^*]+)\*\*\s*—\s*(.+)$/);
      if (specMatch)
        return (
          <div key={i} className="flex gap-2 mt-1.5 items-start">
            <span className="text-[10px] bg-violet-900/50 text-violet-300 border border-violet-700/50 px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
              {specMatch[1]}
            </span>
            <p className="text-gray-400 text-xs leading-relaxed">{inline(specMatch[2])}</p>
          </div>
        );
      return (
        <p key={i} className="text-gray-400 text-xs leading-relaxed">
          {inline(line)}
        </p>
      );
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
              Learning Path
            </p>
            <h2 className="text-white font-semibold text-base">{term}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-lg leading-none mt-1"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {(["prereq", "plan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "text-white border-blue-500"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {t === "prereq" ? "Prerequisites" : "Study Plan"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* PREREQUISITES */}
          {tab === "prereq" && (
            <div>
              {prereqLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Analyzing prerequisites with Claude…
                </div>
              )}
              {prereqError && (
                <p className="text-red-400 text-sm">{prereqError}</p>
              )}
              {prereqData && (
                <div className="space-y-4">
                  {/* Difficulty summary */}
                  <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      {
                        label: "Level",
                        value: prereqData.difficulty.level,
                        cls:
                          LEVEL_COLORS[prereqData.difficulty.level] ??
                          "text-white",
                      },
                      {
                        label: "Depth",
                        value: `${prereqData.difficulty.depth} steps`,
                        cls: "text-white",
                      },
                      {
                        label: "Est. Time",
                        value:
                          prereqData.difficulty.estimatedMonths >= 12
                            ? `${(prereqData.difficulty.estimatedMonths / 12).toFixed(1)}y`
                            : `${prereqData.difficulty.estimatedMonths}mo`,
                        cls: "text-white",
                      },
                      {
                        label: "Total Hrs",
                        value: prereqData.difficulty.hoursTotal.toLocaleString() + "h",
                        cls: "text-white",
                      },
                    ].map(({ label, value, cls }) => (
                      <div key={label}>
                        <div className="text-xs text-gray-500 mb-0.5">
                          {label}
                        </div>
                        <div className={`text-sm font-semibold ${cls}`}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chain */}
                  <div>
                    {prereqData.chain.map((item, i) => {
                      const isLast = i === prereqData.chain.length - 1;
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                isLast
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {isLast ? "★" : i + 1}
                            </div>
                            {!isLast && (
                              <div className="w-px bg-gray-700 flex-1 min-h-[12px] my-1" />
                            )}
                          </div>
                          <div className="pb-3 min-w-0">
                            <div
                              className={`text-sm font-medium ${isLast ? "text-blue-300" : "text-white"}`}
                            >
                              {item.name}
                              {item.months > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ~{item.months}mo
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {item.why}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STUDY PLAN */}
          {tab === "plan" && (
            <div className="space-y-5">
              {/* Intake form — always visible so they can change answers */}
              {!planText && !planLoading && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Your Learning Profile</p>

                  {/* Background */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">Your background with {term}</p>
                    <div className="flex flex-wrap gap-2">
                      {["Complete beginner", "Know the basics", "Have some experience"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setBackground(opt)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            background === opt
                              ? "bg-blue-700 border-blue-600 text-white"
                              : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">My goal</p>
                    <div className="flex flex-wrap gap-2">
                      {["Understand it conceptually", "Build job skills", "Academic mastery", "Satisfy curiosity"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setGoal(opt)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            goal === opt
                              ? "bg-blue-700 border-blue-600 text-white"
                              : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">Hours per week</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[5, 10, 20, 40].map((h) => (
                        <button
                          key={h}
                          onClick={() => setHoursPerWeek(h)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            hoursPerWeek === h
                              ? "bg-blue-700 border-blue-600 text-white"
                              : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                      <input
                        type="number"
                        value={hoursPerWeek}
                        onChange={(e) => setHoursPerWeek(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
                        className="w-14 bg-gray-800 border border-gray-600 rounded-full px-2 py-1 text-white text-xs text-center"
                        min={1}
                        max={80}
                        placeholder="custom"
                      />
                    </div>
                  </div>

                  {/* Learning style */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2">I learn best by</p>
                    <div className="flex flex-wrap gap-2">
                      {["Reading books", "Watching videos", "Building things", "Mix of everything"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setLearningStyle(opt)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            learningStyle === opt
                              ? "bg-blue-700 border-blue-600 text-white"
                              : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={fetchStudyPlan}
                    disabled={!background || !goal || !learningStyle || !apiKey}
                    className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
                  >
                    {apiKey ? "Build My Mastermind Plan →" : "Enter API key first"}
                  </button>
                </div>
              )}

              {planLoading && !planText && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Building Levels 0–2…
                </div>
              )}

              {planText && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(planText)}</div>
                  {planLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      {planText.includes("Level 6") || planText.includes("The Three That Define")
                        ? "Loading research frontier and canon…"
                        : planText.includes("Level 5") || planText.includes("Papers Everyone Cites")
                        ? "Loading research frontier and canon…"
                        : planText.includes("Level 3") || planText.includes("Level 4")
                        ? "Loading seminal papers…"
                        : "Loading working knowledge and advanced depth…"}
                    </div>
                  )}
                  {!planLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <button
                        onClick={() => { setPlanText(""); }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        ← Change my profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
