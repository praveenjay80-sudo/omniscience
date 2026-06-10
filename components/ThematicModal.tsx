"use client";

import React, { useState } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
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

export default function ThematicModal({ apiKey, onClose }: ThematicModalProps) {
  // Picker state
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Curriculum state
  const [activeTheme, setActiveTheme] = useState<ThemeItem | null>(null);
  const [curriculum, setCurriculum] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  const domainEntry = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);
  const l1List = domainEntry?.l1 ?? [];
  const listCacheKey = selectedDomain && selectedL1 ? `omni_thematic_list::${selectedDomain}::${selectedL1}` : null;

  async function generateList() {
    if (!selectedL1 || !selectedDomain || !apiKey) return;
    if (listCacheKey) {
      const cached = localStorage.getItem(listCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as ThemeItem[];
          if (parsed.length > 0) { setThemes(parsed); return; }
        } catch {}
      }
    }
    setListLoading(true);
    setThemes([]);
    setListError(null);
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
        setThemes(parseNDJSON(raw));
      }
      const final = parseNDJSON(raw);
      setThemes(final);
      if (listCacheKey && final.length > 0) localStorage.setItem(listCacheKey, JSON.stringify(final));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setListLoading(false);
    }
  }

  async function openCurriculum(theme: ThemeItem) {
    setActiveTheme(theme);
    const cacheKey = `omni_curriculum::${theme.name.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setCurriculum(cached); return; }
    setCurriculumLoading(true);
    setCurriculum("");
    setCurriculumError(null);
    try {
      const res = await fetch("/api/thematiccurriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme: theme.name }),
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
        setCurriculum(text);
      }
      localStorage.setItem(cacheKey, text);
    } catch (err) {
      setCurriculumError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setCurriculumLoading(false);
    }
  }

  function renderCurriculum(text: string) {
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

  const selectClass =
    "w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer";

  // ── Curriculum view ──────────────────────────────────────────────────────────
  if (activeTheme) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => { setActiveTheme(null); setCurriculum(""); setCurriculumError(null); }}
                className="text-gray-500 hover:text-white text-sm flex-shrink-0"
              >
                ← Themes
              </button>
              <span className="text-gray-700">|</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Cross-Field Curriculum</p>
                <h2 className="text-white font-semibold text-base truncate">{activeTheme.name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1 flex-shrink-0 ml-3">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {curriculumLoading && !curriculum && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Tracing "{activeTheme.name}" across all fields…
              </div>
            )}
            {curriculumError && <p className="text-red-400 text-xs">{curriculumError}</p>}
            {curriculum && (
              <div>
                <div className="space-y-0.5">{renderCurriculum(curriculum)}</div>
                {curriculumLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                    <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    Generating…
                  </div>
                )}
                {!curriculumLoading && (
                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                    <button
                      onClick={() => {
                        localStorage.removeItem(`omni_curriculum::${activeTheme.name.toLowerCase()}`);
                        setCurriculum("");
                        openCurriculum(activeTheme);
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

  // ── Theme picker view ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Thematic Curricula</p>
            <h2 className="text-white font-semibold text-base">
              {themes.length > 0
                ? `${themes.length} themes in ${selectedL1}`
                : listLoading
                ? `Finding themes in ${selectedL1}…`
                : "Discover the deep themes of any field"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {themes.length === 0 && !listLoading && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a domain and field — Claude surfaces its deep intellectual themes. Click any theme to trace it across all of human knowledge.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => { setSelectedDomain(e.target.value); setSelectedL1(""); setThemes([]); }}
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

              {listError && <p className="text-red-400 text-xs">{listError}</p>}

              <button
                onClick={generateList}
                disabled={!selectedL1 || !apiKey}
                className="w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                {!apiKey ? "Enter API key first" : selectedL1 ? `Find themes in ${selectedL1} →` : "Pick a domain and field above"}
              </button>
            </div>
          )}

          {listLoading && themes.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Surfacing themes in {selectedL1}…
            </div>
          )}

          {themes.length > 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => openCurriculum(t)}
                    className="text-left bg-gray-800/60 hover:bg-violet-950/60 border border-gray-700/60 hover:border-violet-700/60 rounded-lg px-3 py-2.5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-100 text-xs font-semibold group-hover:text-violet-200 transition-colors leading-snug">
                        {t.name}
                      </p>
                      <span className="text-[10px] text-gray-600 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-0.5 whitespace-nowrap">
                        Cross-field →
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5 group-hover:text-gray-400 transition-colors">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>

              {listLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Loading more…
                </div>
              )}

              {!listLoading && (
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => { setThemes([]); setListError(null); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    ← Choose a different field
                  </button>
                  <button
                    onClick={() => {
                      if (listCacheKey) localStorage.removeItem(listCacheKey);
                      setThemes([]);
                      generateList();
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
