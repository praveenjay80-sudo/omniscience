"use client";

import React, { useState } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
}

export default function ThematicModal({ apiKey, onClose }: ThematicModalProps) {
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainEntry = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);
  const l1List = domainEntry?.l1 ?? [];

  async function generate() {
    if (!selectedL1 || !apiKey) return;
    const key = `omni_thematic::${selectedL1.toLowerCase()}`;
    const cached = localStorage.getItem(key);
    if (cached) { setContent(cached); return; }
    setLoading(true);
    setContent("");
    setError(null);
    try {
      const res = await fetch("/api/thematic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme: selectedL1 }),
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
        if (text.includes("__ERROR__:")) throw new Error(text.split("__ERROR__:")[1]?.trim());
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
          if (lm) return <a key={j} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{lm[1]}</a>;
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
        const title = tag ? raw.slice(0, -tagMatch![0].length) : raw;
        const tagColors: Record<string, string> = {
          CORE: "bg-red-900/60 text-red-300 border-red-700/50",
          ESSENTIAL: "bg-blue-900/60 text-blue-300 border-blue-700/50",
          OPTIONAL: "bg-gray-800 text-gray-400 border-gray-700",
        };
        return (
          <div key={i} className="flex items-baseline gap-2 mt-4 mb-0.5">
            <h3 className="text-sm font-semibold text-blue-300 flex-1">{inline(title)}</h3>
            {tag && <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>{tag}</span>}
          </div>
        );
      }
      if (line.startsWith("#### "))
        return <h4 key={i} className="text-xs font-bold text-violet-400 mt-5 mb-2 uppercase tracking-widest">{line.slice(5)}</h4>;
      if (line.startsWith("- "))
        return <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">{inline(line.slice(2))}</li>;
      if (line.startsWith("---")) return <hr key={i} className="border-gray-800 my-5" />;
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
    });
  }

  const selectClass = "w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Thematic Curriculum</p>
            <h2 className="text-white font-semibold text-base">
              {content || loading ? selectedL1 : "Trace a field across all of human knowledge"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!content && !loading && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a domain and field — see how it manifests across mathematics, physics, biology, economics, philosophy, and wherever else it lives.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Domain */}
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => { setSelectedDomain(e.target.value); setSelectedL1(""); }}
                    className={selectClass}
                  >
                    <option value="">Select domain…</option>
                    {TAXONOMY_SEED.map((s) => (
                      <option key={s.domain} value={s.domain}>{s.domain}</option>
                    ))}
                  </select>
                </div>

                {/* L1 */}
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Field</label>
                  <select
                    value={selectedL1}
                    onChange={(e) => setSelectedL1(e.target.value)}
                    disabled={!selectedDomain}
                    className={`${selectClass} disabled:opacity-40`}
                  >
                    <option value="">Select field…</option>
                    {l1List.map((l1) => (
                      <option key={l1} value={l1}>{l1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={generate}
                disabled={!selectedL1 || !apiKey}
                className="w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                {!apiKey
                  ? "Enter API key first"
                  : selectedL1
                  ? `Trace "${selectedL1}" across all knowledge →`
                  : "Pick a domain and field above"}
              </button>
            </div>
          )}

          {loading && !content && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Tracing "{selectedL1}" across all of human knowledge…
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
                  <button onClick={() => { setContent(""); setError(null); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    ← Choose a different field
                  </button>
                  <button onClick={() => {
                    localStorage.removeItem(`omni_thematic::${selectedL1.toLowerCase()}`);
                    setContent("");
                    generate();
                  }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
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
