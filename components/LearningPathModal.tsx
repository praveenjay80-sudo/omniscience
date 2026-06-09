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

  async function fetchStudyPlan() {
    const profileKey = `${hoursPerWeek}::${background}::${goal}::${learningStyle}`;
    const key = `omni_plan::${domain}::${l1}::${l2 ?? ""}::${term}::${profileKey}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setPlanText(cached);
      return;
    }

    if (!apiKey) {
      setPlanText("Enter your API key first.");
      return;
    }

    setPlanLoading(true);
    setPlanText("");

    try {
      const res = await fetch("/api/studyplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey, term, domain, l1, l2,
          hoursPerWeek, background, goal, learningStyle,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setPlanText(text);
      }

      if (!text.includes("__ERROR__:")) {
        localStorage.setItem(key, text);
      }
    } catch (err) {
      setPlanText(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setPlanLoading(false);
    }
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
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-sm font-semibold text-blue-300 mt-4 mb-0.5">
            {inline(line.slice(4))}
          </h3>
        );
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
                  Building your personal roadmap…
                </div>
              )}

              {planText && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(planText)}</div>
                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => { setPlanText(""); }}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      ← Change my profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
