"use client";

import React, { useState, useRef, useEffect } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";
import { L2_SEED } from "@/lib/taxonomy-l2";

interface UniversalMapModalProps {
  apiKey: string;
  onClose: () => void;
}

type Tab = "ideas" | "questions" | "canon" | "minimum" | "wound";
type View = "main" | "curriculum";
type ModelId = "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";

interface IdeaItem { name: string; description: string; thinker: string; fields: string[]; }

interface CanonWork {
  title: string;
  author: string;
  year: number;
  description: string;
  level: "Introductory" | "Undergraduate" | "Graduate" | "Research";
  type: "Textbook" | "Monograph" | "Paper" | "Classic";
  amazon: string | null;
  scholar: string | null;
}

const LEVEL_ORDER = ["Introductory", "Undergraduate", "Graduate", "Research"] as const;
const LEVEL_COLORS: Record<CanonWork["level"], string> = {
  Introductory: "bg-green-900/40 text-green-300 border-green-700/40",
  Undergraduate: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  Graduate:      "bg-purple-900/40 text-purple-300 border-purple-700/40",
  Research:      "bg-red-900/40 text-red-300 border-red-700/40",
};
const TYPE_LABEL: Record<CanonWork["type"], string> = {
  Textbook:  "📖",
  Monograph: "◆",
  Paper:     "◎",
  Classic:   "★",
};

function parseNDJSON(raw: string): IdeaItem[] {
  const results: IdeaItem[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const obj = JSON.parse(t);
      const name: string = obj.n ?? obj.name ?? "";
      const description: string = obj.d ?? obj.description ?? "";
      const thinker: string = obj.w ?? obj.thinker ?? "";
      const fields: string[] = Array.isArray(obj.f) ? obj.f : Array.isArray(obj.fields) ? obj.fields : [];
      if (name && description && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        results.push({ name, description, thinker, fields });
      }
    } catch { /* skip */ }
  }
  return results;
}

function parseCanonNDJSON(raw: string): CanonWork[] {
  const results: CanonWork[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const obj = JSON.parse(t);
      const title: string = obj.t ?? obj.title ?? "";
      const author: string = obj.a ?? obj.author ?? "";
      if (!title || seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      const rawLevel = obj.lvl ?? obj.level ?? "Undergraduate";
      const rawType  = obj.tp  ?? obj.type  ?? "Textbook";
      const level = (["Introductory","Undergraduate","Graduate","Research"] as const).includes(rawLevel) ? rawLevel as CanonWork["level"] : "Undergraduate";
      const type  = (["Textbook","Monograph","Paper","Classic"] as const).includes(rawType)  ? rawType  as CanonWork["type"]  : "Textbook";
      results.push({
        title, author,
        year: typeof obj.y === "number" ? obj.y : parseInt(String(obj.y)) || 0,
        description: obj.d ?? obj.description ?? "",
        level, type,
        amazon: obj.amazon || null,
        scholar: obj.scholar || null,
      });
    } catch { /* skip */ }
  }
  return results;
}

function renderUniversalWound(text: string, loading: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCommon = false;
  let woundCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      const header = line.slice(3).trim();
      inCommon = header.toUpperCase().includes("COMMON") || header.toUpperCase().includes("STRUCTURE");
      woundCount = 0;
      elements.push(
        <div key={`h${i}`} className="flex items-center gap-3 mt-8 mb-5">
          <div className="h-px flex-1 border-t border-rose-900/30" />
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-rose-700/50">{header}</span>
          <div className="h-px flex-1 border-t border-rose-900/30" />
        </div>
      );
    } else if (line.startsWith("### ")) {
      const title = line.slice(4).trim();
      woundCount++;
      elements.push(
        <div key={`wh${i}`} className="flex items-center gap-2.5 mt-6 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-800/60 flex-shrink-0" />
          <h3 className="text-rose-100/70 font-semibold text-xs tracking-wide flex-1">{title}</h3>
          <span className="text-[10px] text-rose-900/60 font-mono">{woundCount}/7</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={`sp${i}`} className="h-1.5" />);
    } else {
      const cls = inCommon
        ? "text-gray-300 text-xs leading-relaxed italic"
        : "text-gray-400 text-xs leading-relaxed";
      elements.push(<p key={`p${i}`} className={cls}>{line}</p>);
    }
  }

  if (loading) {
    elements.push(<span key="cur" className="inline-block w-[6px] h-3 bg-rose-700/60 animate-pulse rounded-sm ml-0.5" />);
  }
  return elements;
}

function renderMarkdown(text: string) {
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

    if (line.startsWith("## ")) {
      const content = line.slice(3).trim();
      const numMatch = content.match(/^(\d+)\.\s+(.+)$/);
      if (numMatch) {
        return (
          <div key={i} className="flex items-baseline gap-3 mt-8 mb-2 pb-1 border-b border-rose-900/40">
            <span className="text-rose-500 font-mono text-xs font-bold flex-shrink-0 w-6 text-right">{numMatch[1]}</span>
            <h2 className="text-sm font-bold text-rose-100">{inline(numMatch[2])}</h2>
          </div>
        );
      }
      return <h2 key={i} className="text-sm font-bold text-white mt-8 mb-2 pb-1 border-b border-gray-800">{inline(content)}</h2>;
    }
    if (line.startsWith("### ")) {
      const raw = line.slice(4).trim();
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
            <h3 className="text-sm font-semibold text-indigo-300 flex-1">{inline(title)}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${tagColors[tag]}`}>{tag}</span>
          </div>
        );
      }
      return <h3 key={i} className="text-sm font-semibold text-indigo-300 mt-5 mb-1">{inline(raw)}</h3>;
    }
    if (line.startsWith("#### "))
      return <h4 key={i} className="text-xs font-bold text-indigo-400/70 mt-5 mb-2 uppercase tracking-widest">{line.slice(5)}</h4>;
    if (line.startsWith("- "))
      return <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">{inline(line.slice(2))}</li>;
    if (line.startsWith("---")) return <hr key={i} className="border-gray-800 my-4" />;
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
  });
}

function ModelToggle({ model, setModel }: { model: ModelId; setModel: (m: ModelId) => void }) {
  return (
    <div className="flex rounded overflow-hidden border border-gray-700 text-[10px]">
      <button onClick={() => setModel("claude-sonnet-4-6")}
        className={`px-2 py-1 transition-colors ${model === "claude-sonnet-4-6" ? "bg-gray-600 text-gray-100" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
        Sonnet
      </button>
      <button onClick={() => setModel("claude-haiku-4-5-20251001")}
        className={`px-2 py-1 transition-colors ${model === "claude-haiku-4-5-20251001" ? "bg-gray-600 text-gray-100" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
        Haiku
      </button>
    </div>
  );
}

export default function UniversalMapModal({ apiKey, onClose }: UniversalMapModalProps) {
  const [view, setView] = useState<View>("main");
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const abortRef = useRef<AbortController | null>(null);

  type Resolution = "questions" | "concepts" | "methods" | "findings";
  const RESOLUTIONS: { id: Resolution; label: string; description: string }[] = [
    { id: "questions", label: "Root Questions", description: "The founding interrogatives that organized entire fields — questions precise enough that careers and institutions were built around attacking them" },
    { id: "concepts",  label: "Root Concepts",  description: "Conceptual inventions that gave thinkers new handles on reality — remove any one and an entire way of thinking becomes impossible" },
    { id: "methods",   label: "Root Methods",   description: "Ways of knowing that turned speculation into rigorous disciplines — the epistemic machinery of discovery itself" },
    { id: "findings",  label: "Root Findings",  description: "Specific named discoveries and theorems that permanently changed what was thinkable — concrete results, not frameworks" },
  ];

  // Core Ideas
  const [resolution, setResolution] = useState<Resolution>("concepts");
  const [ideasByResolution, setIdeasByResolution] = useState<Partial<Record<Resolution, IdeaItem[]>>>({});
  const ideas = ideasByResolution[resolution] ?? [];
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState("");
  const [sortMode, setSortMode] = useState<"universal" | "alpha">("universal");

  // Curriculum
  const [activeIdea, setActiveIdea] = useState<IdeaItem | null>(null);
  const [curriculum, setCurriculum] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  // Grand Questions
  const [questions, setQuestions] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Canon — field-targeted
  const [canonDomain, setCanonDomain] = useState("");
  const [canonL1, setCanonL1] = useState("");
  const [canonL2, setCanonL2] = useState("");
  const [canonWorks, setCanonWorks] = useState<CanonWork[]>([]);
  const [canonLoading, setCanonLoading] = useState(false);
  const [canonError, setCanonError] = useState<string | null>(null);
  const [readWorks, setReadWorks] = useState<Set<string>>(new Set());
  const [canonLevelFilter, setCanonLevelFilter] = useState<"all" | CanonWork["level"]>("all");
  const [canonTypeFilter, setCanonTypeFilter] = useState<"all" | CanonWork["type"]>("all");
  const [canonSearch, setCanonSearch] = useState("");

  // Theoretical Minimum
  const [minimum, setMinimum] = useState("");
  const [minimumLoading, setMinimumLoading] = useState(false);
  const [minimumError, setMinimumError] = useState<string | null>(null);

  // The Wound (universal)
  const [universalWound, setUniversalWound] = useState("");
  const [woundLoading, setWoundLoading] = useState(false);
  const [woundError, setWoundError] = useState<string | null>(null);

  const isAnyLoading = ideasLoading || curriculumLoading || questionsLoading || canonLoading || minimumLoading || woundLoading;

  // Load persisted read state
  useEffect(() => {
    const saved = localStorage.getItem("omni_canon_read");
    if (saved) { try { setReadWorks(new Set(JSON.parse(saved))); } catch {} }
  }, []);

  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function toggleRead(title: string) {
    setReadWorks(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      localStorage.setItem("omni_canon_read", JSON.stringify([...next]));
      return next;
    });
  }

  async function generateIdeas(res: Resolution = resolution, force = false) {
    const cacheKey = `omni_coreideas::${res}`;
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as IdeaItem[];
          if (parsed.length > 0) { setIdeasByResolution(prev => ({ ...prev, [res]: parsed })); return; }
        } catch {}
      }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setIdeasLoading(true);
    setIdeasByResolution(prev => ({ ...prev, [res]: [] }));
    setIdeasError(null);
    try {
      const response = await fetch("/api/coreideas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, resolution: res, model }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Server error ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1]?.trim());
        setIdeasByResolution(prev => ({ ...prev, [res]: parseNDJSON(raw) }));
      }
      const final = parseNDJSON(raw);
      setIdeasByResolution(prev => ({ ...prev, [res]: final }));
      if (final.length > 0) localStorage.setItem(cacheKey, JSON.stringify(final));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setIdeasError(err instanceof Error ? err.message : "Failed");
    } finally { setIdeasLoading(false); }
  }

  async function openCurriculum(idea: IdeaItem) {
    setActiveIdea(idea);
    setView("curriculum");
    const cacheKey = `omni_curriculum::${idea.name.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setCurriculum(cached); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    setCurriculumLoading(true);
    setCurriculum("");
    setCurriculumError(null);
    try {
      const res = await fetch("/api/thematiccurriculum", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme: idea.name, model }),
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
    } finally { setCurriculumLoading(false); }
  }

  async function generateQuestions(force = false) {
    const cacheKey = "omni_universalquestions";
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setQuestions(cached); return; }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setQuestionsLoading(true);
    setQuestions("");
    setQuestionsError(null);
    try {
      const res = await fetch("/api/universalquestions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model }),
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
        setQuestions(text);
      }
      localStorage.setItem(cacheKey, text);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setQuestionsError(err instanceof Error ? err.message : "Failed");
    } finally { setQuestionsLoading(false); }
  }

  async function generateMinimum(force = false) {
    const cacheKey = "omni_theoreticalminimum";
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setMinimum(cached); return; }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setMinimumLoading(true);
    setMinimum("");
    setMinimumError(null);
    try {
      const res = await fetch("/api/theoreticalminimum", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model }),
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
        setMinimum(text);
      }
      localStorage.setItem(cacheKey, text);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMinimumError(err instanceof Error ? err.message : "Failed");
    } finally { setMinimumLoading(false); }
  }

  async function generateUniversalWound(force = false) {
    const cacheKey = "omni_wound::universal";
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setUniversalWound(cached); return; }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setWoundLoading(true);
    setUniversalWound("");
    setWoundError(null);
    try {
      const res = await fetch("/api/wound", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, mode: "universal", model }),
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
        setUniversalWound(text);
      }
      localStorage.setItem(cacheKey, text);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setWoundError(err instanceof Error ? err.message : "Failed");
    } finally { setWoundLoading(false); }
  }

  async function generateCanon(force = false) {
    if (!canonL1) return;
    const cacheKey = `omni_canon::${canonDomain}::${canonL1}::${canonL2}`;
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const works = JSON.parse(cached) as CanonWork[];
          if (works.length > 0) { setCanonWorks(works); return; }
        } catch {}
      }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setCanonLoading(true);
    setCanonWorks([]);
    setCanonError(null);
    try {
      const res = await fetch("/api/canon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, domain: canonDomain, l1: canonL1, l2: canonL2, model }),
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
        setCanonWorks(parseCanonNDJSON(raw));
      }
      const final = parseCanonNDJSON(raw);
      setCanonWorks(final);
      if (final.length > 0) localStorage.setItem(cacheKey, JSON.stringify(final));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setCanonError(err instanceof Error ? err.message : "Failed");
    } finally { setCanonLoading(false); }
  }

  function handleTabClick(tab: Tab) {
    setActiveTab(tab);
    if (tab === "ideas" && (ideasByResolution[resolution] ?? []).length === 0 && !ideasLoading) generateIdeas(resolution);
    if (tab === "questions" && !questions && !questionsLoading) generateQuestions();
    if (tab === "minimum" && !minimum && !minimumLoading) generateMinimum();
    if (tab === "wound" && !universalWound && !woundLoading) generateUniversalWound();
  }

  React.useEffect(() => {
    if ((ideasByResolution[resolution] ?? []).length === 0 && !ideasLoading) generateIdeas(resolution);
  }, [resolution]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: Tab; label: string; icon: string; badge?: string }[] = [
    { id: "ideas",    label: "Core Ideas",          icon: "◆", badge: "4 lenses" },
    { id: "canon",    label: "The Canon",            icon: "≡", badge: "all of knowledge" },
    { id: "minimum",  label: "Theoretical Minimum",  icon: "∴" },
    { id: "questions",label: "Grand Questions",      icon: "?" },
    { id: "wound",    label: "The Horizon",           icon: "⊙" },
  ];

  const tabAccent: Record<Tab, string> = {
    ideas:     "border-indigo-500 text-indigo-200 bg-indigo-900/40",
    canon:     "border-amber-500 text-amber-200 bg-amber-900/40",
    minimum:   "border-rose-500 text-rose-200 bg-rose-900/40",
    questions: "border-sky-500 text-sky-200 bg-sky-900/40",
    wound:     "border-red-800 text-red-200 bg-red-950/40",
  };

  // Derived canon data
  const filteredCanon = canonWorks
    .filter(w => canonLevelFilter === "all" || w.level === canonLevelFilter)
    .filter(w => canonTypeFilter === "all" || w.type === canonTypeFilter)
    .filter(w => !canonSearch || w.title.toLowerCase().includes(canonSearch.toLowerCase()) || w.author.toLowerCase().includes(canonSearch.toLowerCase()))
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const readCount = filteredCanon.filter(w => readWorks.has(w.title)).length;

  // ── Curriculum view ──────────────────────────────────────────────────────────
  if (view === "curriculum") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => { setView("main"); setActiveIdea(null); setCurriculum(""); }}
                className="text-gray-500 hover:text-white text-sm flex-shrink-0">← Core Ideas</button>
              <span className="text-gray-700">|</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Cross-Field Curriculum</p>
                <h2 className="text-white font-semibold text-base truncate">{activeIdea?.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {curriculumLoading && (
                <button onClick={stopGeneration} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                  <span className="text-[9px]">■</span> Stop
                </button>
              )}
              <ModelToggle model={model} setModel={setModel} />
              <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {curriculumLoading && !curriculum && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Tracing "{activeIdea?.name}" across all of human knowledge…
              </div>
            )}
            {curriculumError && <p className="text-red-400 text-xs">{curriculumError}</p>}
            {curriculum && (
              <div>
                <div className="space-y-0.5">{renderMarkdown(curriculum)}</div>
                {curriculumLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                    <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    Generating…
                  </div>
                )}
                {!curriculumLoading && (
                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                    <button onClick={() => {
                      if (!activeIdea) return;
                      localStorage.removeItem(`omni_curriculum::${activeIdea.name.toLowerCase()}`);
                      setCurriculum(""); openCurriculum(activeIdea);
                    }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">The Architecture of Human Knowledge</p>
            <h2 className="text-white font-semibold text-base">The Map</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {isAnyLoading && (
              <button onClick={stopGeneration} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                <span className="text-[9px]">■</span> Stop
              </button>
            )}
            <ModelToggle model={model} setModel={setModel} />
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-5 pt-3 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeTab === tab.id ? tabAccent[tab.id] : "border-gray-700/60 text-gray-500 hover:text-gray-300 hover:border-gray-600 bg-transparent"}`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && activeTab !== tab.id && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-600 font-normal">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab descriptions */}
        <div className="px-5 pt-2 pb-3 flex-shrink-0">
          {activeTab === "ideas" && <p className="text-gray-600 text-xs">Four categorically distinct lenses — questions, concepts, methods, and findings each produce a genuinely different map of what built human knowledge. Click any root to trace its full curriculum.</p>}
          {activeTab === "canon" && <p className="text-gray-600 text-xs">The most influential works for any sub-field — pick a domain, field, and sub-field, then get the definitive reading list from introductory to research level. Track what you've read.</p>}
          {activeTab === "minimum" && <p className="text-gray-600 text-xs">Inspired by Landau's legendary exam — the irreducible sequence of concepts, in strict dependency order, that builds the mental infrastructure to understand anything.</p>}
          {activeTab === "questions" && <p className="text-gray-600 text-xs">The deepest questions that span all of human inquiry — that no single discipline can answer, that humanity has been asking for centuries and still cannot resolve.</p>}
          {activeTab === "wound" && <p className="text-gray-600 text-xs">Seven irreducible paradoxes where every field reaches the edge of its own methods — always visible, never crossable. The limits that cannot be dissolved by more research, only acknowledged. The meta-pattern that gives all human understanding its shape.</p>}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">

          {/* ── CORE IDEAS ── */}
          {activeTab === "ideas" && (
            <div>
              {/* Resolution picker — 4 distinct kinds */}
              {(() => {
                type RStyles = Record<Resolution, { on: string; tag: string; icon: string }>;
                const RS: RStyles = {
                  questions: { on: "bg-sky-900/50 border-sky-600/50 text-sky-200",     tag: "bg-sky-900/40 text-sky-400 border-sky-700/40",     icon: "?" },
                  concepts:  { on: "bg-indigo-900/50 border-indigo-600/50 text-indigo-200", tag: "bg-indigo-900/40 text-indigo-400 border-indigo-700/40", icon: "◆" },
                  methods:   { on: "bg-emerald-900/50 border-emerald-600/50 text-emerald-200", tag: "bg-emerald-900/40 text-emerald-400 border-emerald-700/40", icon: "⊕" },
                  findings:  { on: "bg-amber-900/50 border-amber-600/50 text-amber-200",  tag: "bg-amber-900/40 text-amber-400 border-amber-700/40",  icon: "◎" },
                };
                const active = RESOLUTIONS.find(r => r.id === resolution)!;
                return (
                  <div className="mb-4">
                    <div className="flex gap-1.5 mb-2">
                      {RESOLUTIONS.map(r => {
                        const isOn = resolution === r.id;
                        const count = (ideasByResolution[r.id] ?? []).length;
                        return (
                          <button key={r.id} onClick={() => setResolution(r.id)}
                            className={`flex-1 flex flex-col items-center px-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${isOn ? RS[r.id].on : "bg-gray-800/40 border-gray-700/40 text-gray-500 hover:text-gray-300 hover:border-gray-600"}`}>
                            <span className="text-lg leading-none mb-1">{RS[r.id].icon}</span>
                            <span className="font-semibold text-[11px] leading-snug text-center">{r.label.replace("Root ", "")}</span>
                            {count > 0 && <span className={`text-[10px] mt-0.5 tabular-nums ${isOn ? "opacity-60" : "text-gray-600"}`}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] leading-relaxed ${RS[resolution].tag}`}>
                      <span className="opacity-70 mt-px">{RS[resolution].icon}</span>
                      <span className="text-gray-400">{active.description}</span>
                    </div>
                  </div>
                );
              })()}
              {ideasLoading && ideas.length === 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Tracing the intellectual roots that permanently changed what humanity could think…
                </div>
              )}
              {ideasError && <p className="text-red-400 text-xs">{ideasError}</p>}
              {ideas.length > 0 && (() => {
                const allFields = Array.from(new Set(ideas.flatMap(i => i.fields))).sort();
                const filtered = ideas
                  .filter(i => !fieldFilter || i.fields.some(f => f.toLowerCase().includes(fieldFilter.toLowerCase())))
                  .sort((a, b) => sortMode === "universal" ? b.fields.length - a.fields.length : a.name.localeCompare(b.name));
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-gray-500 text-xs">{filtered.length} of <span className="text-indigo-400/80">{ideas.length}</span> roots</span>
                      <div className="flex-1" />
                      <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 outline-none cursor-pointer">
                        <option value="">All fields</option>
                        {allFields.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="flex rounded overflow-hidden border border-gray-700 text-xs">
                        <button onClick={() => setSortMode("universal")} className={`px-2.5 py-1 transition-colors ${sortMode === "universal" ? "bg-indigo-800 text-indigo-200" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>Most seeded</button>
                        <button onClick={() => setSortMode("alpha")} className={`px-2.5 py-1 transition-colors ${sortMode === "alpha" ? "bg-indigo-800 text-indigo-200" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>A–Z</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filtered.map(idea => (
                        <button key={idea.name} onClick={() => openCurriculum(idea)}
                          className="text-left bg-gray-800/50 hover:bg-indigo-950/40 border border-gray-700/40 hover:border-indigo-700/50 rounded-xl px-4 py-3 transition-all group">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-gray-100 text-sm font-semibold group-hover:text-indigo-200 transition-colors leading-snug">{idea.name}</p>
                            <span className="text-gray-700 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-0.5 text-xs">→</span>
                          </div>
                          {idea.thinker && <p className="text-indigo-400/50 text-[11px] mb-1.5 group-hover:text-indigo-400/70 transition-colors">{idea.thinker}</p>}
                          <p className="text-gray-500 text-[11px] leading-relaxed group-hover:text-gray-400 transition-colors mb-2">{idea.description}</p>
                          {idea.fields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {idea.fields.slice(0, 5).map(f => <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-900/30 border border-indigo-800/20 text-indigo-500/60 group-hover:text-indigo-400/70 transition-colors">{f}</span>)}
                              {idea.fields.length > 5 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800/50 text-gray-600">+{idea.fields.length - 5}</span>}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
              {ideasLoading && ideas.length > 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />Finding more…
                </div>
              )}
              {!ideasLoading && ideas.length > 0 && (
                <button onClick={() => { localStorage.removeItem(`omni_coreideas::${resolution}`); generateIdeas(resolution, true); }}
                  className="text-xs text-gray-700 hover:text-gray-500 mt-4 transition-colors">Regenerate</button>
              )}
            </div>
          )}

          {/* ── THEORETICAL MINIMUM ── */}
          {activeTab === "minimum" && (
            <div>
              {minimumLoading && !minimum && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Building the gatekeeper sequence for all of human knowledge…
                </div>
              )}
              {minimumError && <p className="text-red-400 text-xs">{minimumError}</p>}
              {minimum && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(minimum)}</div>
                  {minimumLoading && <div className="flex items-center gap-2 text-gray-400 text-xs mt-4"><span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />Generating…</div>}
                  {!minimumLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => { localStorage.removeItem("omni_theoreticalminimum"); generateMinimum(true); }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── GRAND QUESTIONS ── */}
          {activeTab === "questions" && (
            <div>
              {questionsLoading && !questions && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Surfacing the questions all of human inquiry keeps running into…
                </div>
              )}
              {questionsError && <p className="text-red-400 text-xs">{questionsError}</p>}
              {questions && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(questions)}</div>
                  {questionsLoading && <div className="flex items-center gap-2 text-gray-400 text-xs mt-4"><span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />Generating…</div>}
                  {!questionsLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => { localStorage.removeItem("omni_universalquestions"); generateQuestions(true); }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── THE WOUND (universal) ── */}
          {activeTab === "wound" && (
            <div>
              {woundLoading && !universalWound && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-rose-900/60 border-t-rose-600/60 rounded-full animate-spin flex-shrink-0" />
                  Tracing the irreducible limits of all human understanding…
                </div>
              )}
              {woundError && <p className="text-red-400 text-xs">{woundError}</p>}
              {universalWound && (
                <div>
                  <div>{renderUniversalWound(universalWound, woundLoading)}</div>
                  {!woundLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => { localStorage.removeItem("omni_wound::universal"); setUniversalWound(""); generateUniversalWound(true); }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── THE CANON ── */}
          {activeTab === "canon" && (
            <div>
              {/* 3-level field selector */}
              <div className="mb-5 bg-gray-800/30 border border-gray-700/40 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Choose a sub-field</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Domain */}
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Domain</p>
                    <select value={canonDomain}
                      onChange={e => { setCanonDomain(e.target.value); setCanonL1(""); setCanonL2(""); setCanonWorks([]); }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none cursor-pointer focus:border-amber-600 transition-colors">
                      <option value="">Select…</option>
                      {TAXONOMY_SEED.map(s => <option key={s.domain} value={s.domain}>{s.domain}</option>)}
                    </select>
                  </div>
                  {/* L1 — Field */}
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Field</p>
                    <select value={canonL1}
                      onChange={e => { setCanonL1(e.target.value); setCanonL2(""); setCanonWorks([]); }}
                      disabled={!canonDomain}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none cursor-pointer focus:border-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <option value="">Select…</option>
                      {(TAXONOMY_SEED.find(s => s.domain === canonDomain)?.l1 ?? []).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  {/* L2 — Sub-field */}
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Sub-field</p>
                    <select value={canonL2}
                      onChange={e => { setCanonL2(e.target.value); setCanonWorks([]); }}
                      disabled={!canonL1}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none cursor-pointer focus:border-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <option value="">All of {canonL1 || "field"}</option>
                      {(canonDomain && canonL1 ? (L2_SEED[canonDomain]?.[canonL1] ?? []) : []).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-[11px]">
                    {canonL2 ? `Canon for ${canonL1} → ${canonL2}` : canonL1 ? `Canon for all of ${canonL1}` : "Select a field to generate its canon"}
                  </p>
                  <button
                    onClick={() => generateCanon()}
                    disabled={!canonL1 || canonLoading}
                    className="px-4 py-1.5 rounded-lg bg-amber-900/50 border border-amber-700/50 text-amber-200 text-xs font-semibold hover:bg-amber-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                    {canonLoading
                      ? <><span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />Generating…</>
                      : "Generate Canon →"}
                  </button>
                </div>
              </div>

              {/* Loading */}
              {canonLoading && canonWorks.length === 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Assembling the canon for {canonL2 || canonL1}…
                </div>
              )}
              {canonError && <p className="text-red-400 text-xs mb-3">{canonError}</p>}

              {/* Stats banner */}
              {canonWorks.length > 0 && (
                <div className="flex items-center gap-0 mb-4 rounded-xl overflow-hidden border border-amber-900/20 bg-amber-950/10 divide-x divide-amber-900/20">
                  {[
                    { val: canonWorks.length, label: "Works" },
                    { val: canonWorks.filter(w => w.level === "Graduate" || w.level === "Research").length, label: "Grad+" },
                    { val: canonWorks.filter(w => w.type === "Classic" || w.type === "Monograph").length, label: "Classics" },
                    { val: readCount, label: "Read" },
                  ].map(s => (
                    <div key={s.label} className="flex-1 flex flex-col items-center py-2.5">
                      <span className="text-amber-300 font-bold text-lg leading-none">{s.val}</span>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              {canonWorks.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <input value={canonSearch} onChange={e => setCanonSearch(e.target.value)}
                      placeholder="Search title or author…"
                      className="bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-amber-600 w-44" />
                    {/* Level filter */}
                    <div className="flex rounded overflow-hidden border border-gray-700 text-[10px]">
                      {(["all", ...LEVEL_ORDER] as const).map(lv => (
                        <button key={lv} onClick={() => setCanonLevelFilter(lv as typeof canonLevelFilter)}
                          className={`px-2 py-1 transition-colors ${canonLevelFilter === lv
                            ? lv === "all" ? "bg-gray-600 text-gray-100" : lv === "Introductory" ? "bg-green-900/60 text-green-300" : lv === "Undergraduate" ? "bg-blue-900/60 text-blue-300" : lv === "Graduate" ? "bg-purple-900/60 text-purple-300" : "bg-red-900/60 text-red-300"
                            : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
                          {lv === "all" ? "All" : lv === "Introductory" ? "Intro" : lv === "Undergraduate" ? "UG" : lv === "Graduate" ? "Grad" : "Res"}
                        </button>
                      ))}
                    </div>
                    {/* Type filter */}
                    <div className="flex rounded overflow-hidden border border-gray-700 text-[10px]">
                      {(["all", "Textbook", "Monograph", "Paper", "Classic"] as const).map(tp => (
                        <button key={tp} onClick={() => setCanonTypeFilter(tp as typeof canonTypeFilter)}
                          className={`px-2 py-1 transition-colors ${canonTypeFilter === tp ? "bg-amber-900/60 text-amber-300" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
                          {tp === "all" ? "All" : tp}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: filteredCanon.length > 0 ? `${(readCount / filteredCanon.length) * 100}%` : "0%" }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{readCount}/{filteredCanon.length} read</span>
                    </div>
                  </div>

                  {/* Work cards — sorted by level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCanon.map(work => {
                      const isRead = readWorks.has(work.title);
                      return (
                        <div key={work.title}
                          className={`relative border rounded-xl px-3.5 py-3 transition-all ${
                            isRead ? "bg-gray-800/15 border-gray-700/20 opacity-55" : "bg-gray-800/50 border-gray-700/40 hover:border-gray-600/50"
                          }`}>
                          {/* Level left-edge accent */}
                          {!isRead && (
                            <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${
                              work.level === "Introductory" ? "bg-green-600/50" :
                              work.level === "Undergraduate" ? "bg-blue-600/50" :
                              work.level === "Graduate" ? "bg-purple-600/50" : "bg-red-600/50"
                            }`} />
                          )}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold leading-snug ${isRead ? "text-gray-500 line-through decoration-gray-600/50" : "text-gray-100"}`}>{work.title}</p>
                              <p className="text-gray-600 text-[10px] mt-0.5">
                                {work.author} · <span className="tabular-nums">{work.year < 0 ? `${Math.abs(work.year)} BCE` : work.year}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${LEVEL_COLORS[work.level]}`}>{work.level === "Undergraduate" ? "UG" : work.level === "Introductory" ? "Intro" : work.level === "Graduate" ? "Grad" : "Res"}</span>
                              <span className="text-[11px]" title={work.type}>{TYPE_LABEL[work.type]}</span>
                              <button onClick={() => toggleRead(work.title)}
                                className={`w-5 h-5 rounded border text-[10px] flex items-center justify-center transition-all flex-shrink-0 ${isRead ? "bg-green-900/60 border-green-700/50 text-green-400" : "bg-gray-700/50 border-gray-600/50 text-gray-600 hover:text-green-500 hover:border-green-700/40"}`}>
                                {isRead ? "✓" : "○"}
                              </button>
                            </div>
                          </div>
                          <p className={`text-[11px] leading-relaxed mb-2 ${isRead ? "text-gray-600" : "text-gray-500"}`}>{work.description}</p>
                          {(work.amazon || work.scholar) && (
                            <div className="flex items-center gap-2">
                              {work.amazon && (
                                <a href={work.amazon} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700/50 text-gray-600 hover:text-gray-300 hover:border-gray-600 transition-colors">
                                  Amazon →
                                </a>
                              )}
                              {work.scholar && (
                                <a href={work.scholar} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700/50 text-gray-600 hover:text-gray-300 hover:border-gray-600 transition-colors">
                                  Scholar →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {canonLoading && canonWorks.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-4">
                      <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      Loading more…
                    </div>
                  )}

                  {!canonLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <p className="text-gray-700 text-[11px]">{canonL2 || canonL1}</p>
                      <button onClick={() => generateCanon(true)} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Regenerate</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
