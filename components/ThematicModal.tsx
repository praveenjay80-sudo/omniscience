"use client";

import React, { useState } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
  onStudyPlan: (term: string, domain: string, l1: string) => void;
}

interface ThemeItem {
  name: string;
  description: string;
}

function parseNDJSON(raw: string): ThemeItem[] {
  const results: ThemeItem[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    try {
      const obj = JSON.parse(trimmed);
      const name: string = obj.n ?? obj.name ?? "";
      const description: string = obj.d ?? obj.description ?? "";
      if (name && description && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        results.push({ name, description });
      }
    } catch { /* skip malformed lines */ }
  }
  return results;
}

export default function ThematicModal({ apiKey, onClose, onStudyPlan }: ThematicModalProps) {
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");

  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainEntry = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);
  const l1List = domainEntry?.l1 ?? [];

  const cacheKey = selectedDomain && selectedL1
    ? `omni_thematic::${selectedDomain}::${selectedL1}`
    : null;

  async function generate() {
    if (!selectedL1 || !selectedDomain || !apiKey) return;
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as ThemeItem[];
          if (parsed.length > 0) { setThemes(parsed); return; }
        } catch {}
      }
    }
    setLoading(true);
    setThemes([]);
    setError(null);
    try {
      const res = await fetch("/api/thematic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, domain: selectedDomain, l1: selectedL1 }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      if (!res.body) throw new Error("Empty response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1]?.trim());
        // Parse progressively so themes appear as they stream
        setThemes(parseNDJSON(raw));
      }
      const final = parseNDJSON(raw);
      setThemes(final);
      if (cacheKey && final.length > 0) localStorage.setItem(cacheKey, JSON.stringify(final));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleThemeClick(theme: ThemeItem) {
    onStudyPlan(theme.name, selectedDomain, selectedL1);
    onClose();
  }

  const selectClass =
    "w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer";

  const showPicker = themes.length === 0 && !loading;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Themes</p>
            <h2 className="text-white font-semibold text-base">
              {themes.length > 0
                ? `${themes.length} themes in ${selectedL1}`
                : loading
                ? `Finding themes in ${selectedL1}…`
                : "Discover the deep themes of any field"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {showPicker && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a domain and field — Claude will surface every significant intellectual theme within it. Click any theme to generate its full study plan.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      setSelectedDomain(e.target.value);
                      setSelectedL1("");
                      setThemes([]);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select domain…</option>
                    {TAXONOMY_SEED.map((s) => (
                      <option key={s.domain} value={s.domain}>{s.domain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Field</label>
                  <select
                    value={selectedL1}
                    onChange={(e) => { setSelectedL1(e.target.value); setThemes([]); }}
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
                  ? `Find themes in ${selectedL1} →`
                  : "Pick a domain and field above"}
              </button>
            </div>
          )}

          {/* Streaming skeleton while loading */}
          {loading && themes.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Surfacing themes in {selectedL1}…
            </div>
          )}

          {/* Theme grid */}
          {themes.length > 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleThemeClick(t)}
                    className="text-left bg-gray-800/60 hover:bg-violet-950/60 border border-gray-700/60 hover:border-violet-700/60 rounded-lg px-3 py-2.5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-100 text-xs font-semibold group-hover:text-violet-200 transition-colors leading-snug">
                        {t.name}
                      </p>
                      <span className="text-[10px] text-gray-600 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-0.5">
                        Study Plan →
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5 group-hover:text-gray-400 transition-colors">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Loading more…
                </div>
              )}

              {!loading && (
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => { setThemes([]); setError(null); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    ← Choose a different field
                  </button>
                  <button
                    onClick={() => {
                      if (cacheKey) localStorage.removeItem(cacheKey);
                      setThemes([]);
                      generate();
                    }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
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
