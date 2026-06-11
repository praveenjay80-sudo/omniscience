"use client";

import React, { useState, useMemo, useRef } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";
import { getL2Options } from "@/lib/taxonomy-l2";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
}

type Mode = "themes" | "genealogy";
type View = "picker" | "themes" | "curriculum" | "genealogy";
type ModelId = "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";

interface ThemeItem { name: string; description: string; }

function parseNDJSON(raw: string): ThemeItem[] {
  const results: ThemeItem[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const obj = JSON.parse(t);
      const name: string = obj.n ?? obj.name ?? "";
      const description: string = obj.d ?? obj.description ?? "";
      if (name && description && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        results.push({ name, description });
      }
    } catch { /* skip */ }
  }
  return results;
}

function renderMarkdown(text: string, accentClass = "text-violet-400") {
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
      const dotMatch = raw.match(/^(.+)\s·\s(.+)$/);
      const tagMatch = raw.match(/\s·\s(CORE|ESSENTIAL|OPTIONAL)$/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const title = raw.slice(0, -tagMatch[0].length);
        const tagColors: Record<string, string> = {
          CORE: "bg-red-900/60 text-red-300 border-red-700/50",
          ESSENTIAL: "bg-blue-900/60 text-blue-300 border-blue-700/50",
          OPTIONAL: "bg-gray-800 text-gray-400 border-gray-700",
        };
        return (
          <div key={i} className="flex items-baseline gap-2 mt-4 mb-0.5">
            <h3 className="text-sm font-semibold text-blue-300 flex-1">{inline(title)}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>{tag}</span>
          </div>
        );
      }
      if (dotMatch) {
        return (
          <div key={i} className="mt-5 mb-1 flex items-baseline gap-2">
            <span className="text-amber-300 text-sm font-semibold">{dotMatch[1]}</span>
            <span className="text-gray-600 text-xs">· {dotMatch[2]}</span>
          </div>
        );
      }
      return <h3 key={i} className={`text-sm font-semibold mt-5 mb-1 ${accentClass}`}>{inline(raw)}</h3>;
    }
    if (line.startsWith("#### "))
      return <h4 key={i} className={`text-xs font-bold mt-5 mb-2 uppercase tracking-widest ${accentClass} opacity-70`}>{line.slice(5)}</h4>;
    if (line.startsWith("- "))
      return <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">{inline(line.slice(2))}</li>;
    if (line.startsWith("---")) return <hr key={i} className="border-gray-800 my-5" />;
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
  });
}

function ModelToggle({ model, setModel }: { model: ModelId; setModel: (m: ModelId) => void }) {
  return (
    <div className="flex rounded overflow-hidden border border-gray-700 text-[10px]">
      <button
        onClick={() => setModel("claude-sonnet-4-6")}
        className={`px-2 py-1 transition-colors ${model === "claude-sonnet-4-6" ? "bg-gray-600 text-gray-100" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
      >Sonnet</button>
      <button
        onClick={() => setModel("claude-haiku-4-5-20251001")}
        className={`px-2 py-1 transition-colors ${model === "claude-haiku-4-5-20251001" ? "bg-gray-600 text-gray-100" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
      >Haiku</button>
    </div>
  );
}

export default function ThematicModal({ apiKey, onClose }: ThematicModalProps) {
  const [view, setView] = useState<View>("picker");
  const [mode, setMode] = useState<Mode>("themes");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const abortRef = useRef<AbortController | null>(null);

  // Field selection
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");

  // Themes state
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [themesError, setThemesError] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeItem | null>(null);
  const [curriculum, setCurriculum] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  // Genealogy state
  const [genealogy, setGenealogy] = useState("");
  const [genealogyLoading, setGenealogyLoading] = useState(false);
  const [genealogyError, setGenealogyError] = useState<string | null>(null);

  const domainEntry = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);
  const l1List = domainEntry?.l1 ?? [];
  const fieldLabel = selectedL2 || selectedL1;

  const l2Options = useMemo(() => getL2Options(selectedDomain, selectedL1), [selectedDomain, selectedL1]);

  const listCacheKey = selectedDomain && selectedL1
    ? `omni_thematic_list::${selectedDomain}::${selectedL2 || selectedL1}`
    : null;
  const genealogyCacheKey = selectedDomain && selectedL1
    ? `omni_genealogy::${selectedL2 || selectedL1}`
    : null;

  const isAnyLoading = themesLoading || curriculumLoading || genealogyLoading;

  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  // ── Themes ────────────────────────────────────────────────────────────────────
  async function generateThemes() {
    if (!fieldLabel || !apiKey) return;
    if (listCacheKey) {
      const cached = localStorage.getItem(listCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as ThemeItem[];
          if (parsed.length > 0) { setThemes(parsed); setView("themes"); return; }
        } catch {}
      }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setThemesLoading(true);
    setThemes([]);
    setThemesError(null);
    setView("themes");
    try {
      const res = await fetch("/api/thematic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, domain: selectedDomain, l1: selectedL2 || selectedL1, model }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);
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
      if (err instanceof Error && err.name === "AbortError") return;
      setThemesError(err instanceof Error ? err.message : "Failed");
    } finally {
      setThemesLoading(false);
    }
  }

  async function openCurriculum(theme: ThemeItem) {
    setActiveTheme(theme);
    setView("curriculum");
    const cacheKey = `omni_curriculum::${theme.name.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setCurriculum(cached); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    setCurriculumLoading(true);
    setCurriculum("");
    setCurriculumError(null);
    try {
      const res = await fetch("/api/thematiccurriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme: theme.name, model }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);
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
      if (err instanceof Error && err.name === "AbortError") return;
      setCurriculumError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCurriculumLoading(false);
    }
  }

  // ── Genealogy ─────────────────────────────────────────────────────────────────
  async function generateGenealogy() {
    if (!fieldLabel || !apiKey) return;
    if (genealogyCacheKey) {
      const cached = localStorage.getItem(genealogyCacheKey);
      if (cached) { setGenealogy(cached); setView("genealogy"); return; }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setGenealogyLoading(true);
    setGenealogy("");
    setGenealogyError(null);
    setView("genealogy");
    try {
      const res = await fetch("/api/genealogy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          term: selectedL2 || selectedL1,
          domain: selectedDomain,
          l1: selectedL1,
          l2: selectedL2 || undefined,
          model,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        if (text.includes("__ERROR__:")) throw new Error(text.split("__ERROR__:")[1]?.trim());
        setGenealogy(text);
      }
      if (genealogyCacheKey) localStorage.setItem(genealogyCacheKey, text);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setGenealogyError(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenealogyLoading(false);
    }
  }

  function handleGenerate() {
    if (mode === "themes") generateThemes();
    else generateGenealogy();
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────────
  const selectClass = "w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer";

  function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button onClick={onClick} className="text-gray-500 hover:text-white text-sm flex-shrink-0">
        ← {label}
      </button>
    );
  }

  function StreamingSpinner({ text }: { text: string }) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
        <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        {text}
      </div>
    );
  }

  // ── Header title ──────────────────────────────────────────────────────────────
  const headerTitle = view === "picker"
    ? "Explore a field"
    : view === "themes"
    ? (themes.length > 0 ? `${themes.length} themes in ${fieldLabel}` : `Finding themes in ${fieldLabel}…`)
    : view === "curriculum"
    ? activeTheme?.name ?? ""
    : (genealogy || genealogyLoading) ? `Intellectual Genealogy of ${fieldLabel}` : `Tracing ${fieldLabel}…`;

  const headerSub = view === "picker" ? "Themes or Genealogy"
    : view === "themes" ? "Thematic Curricula"
    : view === "curriculum" ? "Cross-Field Curriculum"
    : "Intellectual Genealogy";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {view !== "picker" && (
              <>
                <BackButton
                  label={view === "curriculum" ? "Themes" : view === "genealogy" ? "Picker" : "Picker"}
                  onClick={() => {
                    stopGeneration();
                    if (view === "curriculum") { setView("themes"); setActiveTheme(null); setCurriculum(""); }
                    else { setView("picker"); setGenealogy(""); setThemes([]); setGenealogyError(null); setThemesError(null); }
                  }}
                />
                <span className="text-gray-700">|</span>
              </>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{headerSub}</p>
              <h2 className="text-white font-semibold text-base truncate">{headerTitle}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {isAnyLoading && (
              <button onClick={stopGeneration}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                <span className="text-[9px]">■</span> Stop
              </button>
            )}
            <ModelToggle model={model} setModel={setModel} />
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── PICKER VIEW ── */}
          {view === "picker" && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a domain, field, and optionally a subfield — then choose what to generate.
              </p>

              {/* Dropdowns */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Domain</label>
                  <select value={selectedDomain}
                    onChange={(e) => { setSelectedDomain(e.target.value); setSelectedL1(""); setSelectedL2(""); }}
                    className={selectClass}>
                    <option value="">Select…</option>
                    {TAXONOMY_SEED.map((s) => <option key={s.domain} value={s.domain}>{s.domain}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Field</label>
                  <select value={selectedL1}
                    onChange={(e) => { setSelectedL1(e.target.value); setSelectedL2(""); }}
                    disabled={!selectedDomain}
                    className={`${selectClass} disabled:opacity-40`}>
                    <option value="">Select…</option>
                    {l1List.map((l1) => <option key={l1} value={l1}>{l1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Subfield</label>
                  <select value={selectedL2}
                    onChange={(e) => setSelectedL2(e.target.value)}
                    disabled={!selectedL1 || l2Options.length === 0}
                    className={`${selectClass} disabled:opacity-40`}>
                    <option value="">All of {selectedL1 || "field"}</option>
                    {l2Options.map((l2) => <option key={l2} value={l2}>{l2}</option>)}
                  </select>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("themes")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    mode === "themes"
                      ? "bg-violet-900/60 border-violet-600 text-violet-200"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ◈ Themes
                </button>
                <button
                  onClick={() => setMode("genealogy")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    mode === "genealogy"
                      ? "bg-amber-900/40 border-amber-700 text-amber-200"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ⟳ Genealogy
                </button>
              </div>

              <p className="text-gray-600 text-xs -mt-1">
                {mode === "themes"
                  ? "Surfaces 40+ deep intellectual themes in the selected field. Click any theme to trace it across all of human knowledge."
                  : "Traces the unbroken chain of thinkers and ideas that built the field, generation by generation — from founders to the living practitioners."}
              </p>

              <button
                onClick={handleGenerate}
                disabled={!selectedL1 || !apiKey}
                className={`w-full disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium ${
                  mode === "themes"
                    ? "bg-violet-700 hover:bg-violet-600"
                    : "bg-amber-800 hover:bg-amber-700"
                }`}
              >
                {!apiKey ? "Enter API key first"
                  : !selectedL1 ? "Pick a domain and field above"
                  : mode === "themes"
                  ? `Find themes in ${fieldLabel} →`
                  : `Trace genealogy of ${fieldLabel} →`}
              </button>
            </div>
          )}

          {/* ── THEMES LIST VIEW ── */}
          {view === "themes" && (
            <div>
              {themesLoading && themes.length === 0 && <StreamingSpinner text={`Surfacing themes in ${fieldLabel}…`} />}
              {themesError && <p className="text-red-400 text-xs">{themesError}</p>}
              {themes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <button key={t.name} onClick={() => openCurriculum(t)}
                      className="text-left bg-gray-800/60 hover:bg-violet-950/60 border border-gray-700/60 hover:border-violet-700/60 rounded-lg px-3 py-2.5 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-100 text-xs font-semibold group-hover:text-violet-200 transition-colors leading-snug">{t.name}</p>
                        <span className="text-[10px] text-gray-600 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-0.5 whitespace-nowrap">Cross-field →</span>
                      </div>
                      <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5 group-hover:text-gray-400 transition-colors">{t.description}</p>
                    </button>
                  ))}
                </div>
              )}
              {themesLoading && themes.length > 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Loading more…
                </div>
              )}
              {!themesLoading && !themesError && (
                <button onClick={() => { if (listCacheKey) localStorage.removeItem(listCacheKey); setThemes([]); generateThemes(); }}
                  className="text-xs text-gray-700 hover:text-gray-500 mt-4 transition-colors">
                  Regenerate
                </button>
              )}
            </div>
          )}

          {/* ── CURRICULUM VIEW ── */}
          {view === "curriculum" && (
            <div>
              {curriculumLoading && !curriculum && <StreamingSpinner text={`Tracing "${activeTheme?.name}" across all fields…`} />}
              {curriculumError && <p className="text-red-400 text-xs">{curriculumError}</p>}
              {curriculum && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(curriculum, "text-violet-400")}</div>
                  {curriculumLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      Generating…
                    </div>
                  )}
                  {!curriculumLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => {
                        if (!activeTheme) return;
                        localStorage.removeItem(`omni_curriculum::${activeTheme.name.toLowerCase()}`);
                        setCurriculum("");
                        openCurriculum(activeTheme);
                      }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── GENEALOGY VIEW ── */}
          {view === "genealogy" && (
            <div>
              {genealogyLoading && !genealogy && <StreamingSpinner text={`Tracing the intellectual lineage of ${fieldLabel}…`} />}
              {genealogyError && <p className="text-red-400 text-xs">{genealogyError}</p>}
              {genealogy && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(genealogy, "text-amber-400")}</div>
                  {genealogyLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      Generating…
                    </div>
                  )}
                  {!genealogyLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => {
                        if (genealogyCacheKey) localStorage.removeItem(genealogyCacheKey);
                        setGenealogy("");
                        generateGenealogy();
                      }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
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
