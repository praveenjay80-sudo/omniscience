"use client";

import React, { useState } from "react";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
}

const SUGGESTED_THEMES = [
  "Symmetry",
  "Information and Entropy",
  "Optimization",
  "Randomness and Uncertainty",
  "Infinity and Limits",
  "Duality",
  "Fixed Points and Equilibrium",
  "Emergence and Complexity",
  "Continuity and Change",
  "Structure and Classification",
  "Proof and Computation",
  "Space and Geometry",
  "Self-Reference and Paradox",
  "Waves and Oscillation",
  "Networks and Graphs",
  "Dimension",
];

export default function ThematicModal({ apiKey, onClose }: ThematicModalProps) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = custom.trim() || selected;

  async function generate() {
    if (!theme) return;
    const key = `omni_thematic::${theme.toLowerCase()}`;
    const cached = localStorage.getItem(key);
    if (cached) { setContent(cached); return; }
    if (!apiKey) { setError("Enter your API key first."); return; }

    setLoading(true);
    setContent("");
    setError(null);

    try {
      const res = await fetch("/api/thematic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme }),
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
        if (text.includes("__ERROR__:")) {
          throw new Error(text.split("__ERROR__:")[1]?.trim() ?? "Unknown error");
        }
        setContent(text);
      }
      localStorage.setItem(key, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      const inline = (s: string): React.ReactNode[] =>
        s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)/g).map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**"))
            return <strong key={j} className="text-gray-200 font-semibold">{p.slice(2, -2)}</strong>;
          const lm = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (lm)
            return <a key={j} href={lm[2]} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{lm[1]}</a>;
          if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
            return <em key={j} className="text-gray-400 not-italic">{p.slice(1, -1)}</em>;
          return p;
        });

      if (line.startsWith("## "))
        return <h2 key={i} className="text-sm font-bold text-white mt-7 mb-2 pb-1 border-b border-gray-800">{inline(line.slice(3))}</h2>;

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
        return (
          <div key={i} className="flex items-baseline gap-2 mt-4 mb-0.5">
            <h3 className="text-sm font-semibold text-blue-300 flex-1">{inline(displayTitle)}</h3>
            {tag && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>
                {tag}
              </span>
            )}
          </div>
        );
      }

      if (line.startsWith("#### "))
        return <h4 key={i} className="text-xs font-bold text-violet-400 mt-5 mb-2 uppercase tracking-widest">{line.slice(5)}</h4>;

      if (line.startsWith("- "))
        return <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">{inline(line.slice(2))}</li>;

      if (line.startsWith("---"))
        return <hr key={i} className="border-gray-800 my-5" />;

      if (line.trim() === "") return <div key={i} className="h-1" />;

      // Rosetta Stone / connection lines that start with bold
      const specMatch = line.match(/^\*\*([^*]+)\*\*\s*—\s*(.+)$/);
      if (specMatch)
        return (
          <div key={i} className="flex gap-2 mt-1.5 items-start">
            <span className="text-[10px] bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
              {specMatch[1]}
            </span>
            <p className="text-gray-400 text-xs leading-relaxed">{inline(specMatch[2])}</p>
          </div>
        );

      return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Thematic Curriculum</p>
            <h2 className="text-white font-semibold text-base">
              {content || loading ? theme : "Trace a theme across all of human knowledge"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!content && !loading && (
            <div className="space-y-5">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a theme and discover how it manifests across mathematics, physics, biology, economics, philosophy, computer science — and wherever else it lives. Each curriculum traces one deep idea from its simplest appearance to its most unified form.
              </p>

              {/* Suggested themes */}
              <div>
                <p className="text-gray-500 text-xs mb-2.5 uppercase tracking-widest font-semibold">Suggested themes</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_THEMES.map((t) => (
                    <button key={t} onClick={() => { setSelected(t); setCustom(""); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selected === t && !custom
                          ? "bg-violet-700 border-violet-600 text-white"
                          : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom theme */}
              <div>
                <p className="text-gray-500 text-xs mb-2 uppercase tracking-widest font-semibold">Or enter your own</p>
                <input
                  type="text"
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setSelected(""); }}
                  placeholder="e.g. Feedback loops, Measurement, Conservation laws…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={generate}
                disabled={!theme || !apiKey}
                className="w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                {apiKey ? `Trace "${theme || "…"}" across all knowledge →` : "Enter API key first"}
              </button>
            </div>
          )}

          {loading && !content && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Tracing "{theme}" across all of human knowledge…
            </div>
          )}

          {content && (
            <div>
              <div className="space-y-0.5">{renderContent(content)}</div>
              {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                  <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Generating…
                </div>
              )}
              {!loading && (
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <button onClick={() => { setContent(""); setSelected(""); setCustom(""); setError(null); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    ← Choose a different theme
                  </button>
                  <button
                    onClick={() => {
                      const key = `omni_thematic::${theme.toLowerCase()}`;
                      localStorage.removeItem(key);
                      setContent("");
                      generate();
                    }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
