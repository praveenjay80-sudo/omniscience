"use client";

import { useState, useEffect } from "react";

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
    const key = `omni_plan::${domain}::${l1}::${l2 ?? ""}::${term}::${hoursPerWeek}`;
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
          apiKey,
          term,
          domain,
          l1,
          l2,
          hoursPerWeek,
          prerequisites: prereqData?.chain,
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

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl max-h-[82vh] flex flex-col shadow-2xl"
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-sm whitespace-nowrap">
                  Hours / week:
                </label>
                <input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) =>
                    setHoursPerWeek(
                      Math.max(1, Math.min(80, Number(e.target.value) || 1))
                    )
                  }
                  className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm text-center"
                  min={1}
                  max={80}
                />
                <button
                  onClick={fetchStudyPlan}
                  disabled={planLoading}
                  className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  {planLoading
                    ? "Generating…"
                    : planText
                    ? "Regenerate"
                    : "Generate Plan"}
                </button>
              </div>

              {planLoading && !planText && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Crafting your study plan…
                </div>
              )}

              {planText && (
                <div className="space-y-0.5">{renderMarkdown(planText)}</div>
              )}

              {!planText && !planLoading && (
                <p className="text-gray-500 text-sm">
                  Set your hours/week and generate a personalized plan.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
