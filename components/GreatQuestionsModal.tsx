"use client";

import React, { useState } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";

interface GreatQuestionsModalProps {
  apiKey: string;
  onClose: () => void;
}

type View = "picker" | "questions" | "treatment";
interface QuestionItem { name: string; description: string; }

function parseNDJSON(raw: string): QuestionItem[] {
  const results: QuestionItem[] = [];
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
      return <h4 key={i} className="text-xs font-bold text-emerald-400 mt-5 mb-2 uppercase tracking-widest">{line.slice(5)}</h4>;
    if (line.startsWith("- "))
      return <li key={i} className="text-gray-400 ml-4 text-xs list-disc leading-relaxed">{inline(line.slice(2))}</li>;
    if (line.startsWith("---")) return <hr key={i} className="border-gray-800 my-5" />;
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
  });
}

export default function GreatQuestionsModal({ apiKey, onClose }: GreatQuestionsModalProps) {
  const [view, setView] = useState<View>("picker");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [treatment, setTreatment] = useState("");
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState<string | null>(null);

  const domainEntry = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);
  const l1List = domainEntry?.l1 ?? [];
  const listCacheKey = selectedDomain && selectedL1 ? `omni_gq_list::${selectedDomain}::${selectedL1}` : null;

  async function generateList() {
    if (!selectedL1 || !apiKey) return;
    if (listCacheKey) {
      const cached = localStorage.getItem(listCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as QuestionItem[];
          if (parsed.length > 0) { setQuestions(parsed); setView("questions"); return; }
        } catch {}
      }
    }
    setListLoading(true);
    setQuestions([]);
    setListError(null);
    setView("questions");
    try {
      const res = await fetch("/api/greatquestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, domain: selectedDomain, l1: selectedL1 }),
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
        setQuestions(parseNDJSON(raw));
      }
      const final = parseNDJSON(raw);
      setQuestions(final);
      if (listCacheKey && final.length > 0) localStorage.setItem(listCacheKey, JSON.stringify(final));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed");
    } finally {
      setListLoading(false);
    }
  }

  async function openTreatment(q: QuestionItem) {
    setActiveQuestion(q);
    setView("treatment");
    const cacheKey = `omni_gq::${q.name.toLowerCase().slice(0, 80)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setTreatment(cached); return; }
    setTreatmentLoading(true);
    setTreatment("");
    setTreatmentError(null);
    try {
      const res = await fetch("/api/greatquestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, question: q.name, domain: selectedDomain, l1: selectedL1 }),
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
        setTreatment(text);
      }
      localStorage.setItem(cacheKey, text);
    } catch (err) {
      setTreatmentError(err instanceof Error ? err.message : "Failed");
    } finally {
      setTreatmentLoading(false);
    }
  }

  const selectClass = "w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer";

  const headerSub = view === "picker" ? "The Great Questions"
    : view === "questions" ? `Questions in ${selectedL1}`
    : "Deep Dive";
  const headerTitle = view === "picker" ? "The questions a field can't stop asking"
    : view === "questions"
    ? (questions.length > 0 ? `${questions.length} deep questions` : `Finding questions in ${selectedL1}…`)
    : activeQuestion?.name ?? "";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {view !== "picker" && (
              <>
                <button
                  onClick={() => {
                    if (view === "treatment") { setView("questions"); setActiveQuestion(null); setTreatment(""); }
                    else { setView("picker"); setQuestions([]); }
                  }}
                  className="text-gray-500 hover:text-white text-sm flex-shrink-0"
                >
                  ← {view === "treatment" ? "Questions" : "Back"}
                </button>
                <span className="text-gray-700">|</span>
              </>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{headerSub}</p>
              <h2 className="text-white font-semibold text-base truncate">{headerTitle}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1 flex-shrink-0 ml-3">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {view === "picker" && (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick a field — Claude surfaces the fundamental questions that resist easy answers, that the best minds carry for their entire careers. Click any question to see every angle explored.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Domain</label>
                  <select value={selectedDomain}
                    onChange={(e) => { setSelectedDomain(e.target.value); setSelectedL1(""); }}
                    className={selectClass}>
                    <option value="">Select domain…</option>
                    {TAXONOMY_SEED.map((s) => <option key={s.domain} value={s.domain}>{s.domain}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide">Field</label>
                  <select value={selectedL1}
                    onChange={(e) => setSelectedL1(e.target.value)}
                    disabled={!selectedDomain}
                    className={`${selectClass} disabled:opacity-40`}>
                    <option value="">Select field…</option>
                    {l1List.map((l1) => <option key={l1} value={l1}>{l1}</option>)}
                  </select>
                </div>
              </div>
              {listError && <p className="text-red-400 text-xs">{listError}</p>}
              <button onClick={generateList} disabled={!selectedL1 || !apiKey}
                className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium">
                {!apiKey ? "Enter API key first" : selectedL1 ? `Find deep questions in ${selectedL1} →` : "Pick a domain and field above"}
              </button>
            </div>
          )}

          {view === "questions" && (
            <div>
              {listLoading && questions.length === 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Surfacing the fundamental questions of {selectedL1}…
                </div>
              )}
              {questions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {questions.map((q) => (
                    <button key={q.name} onClick={() => openTreatment(q)}
                      className="text-left bg-gray-800/60 hover:bg-emerald-950/60 border border-gray-700/60 hover:border-emerald-700/60 rounded-lg px-3 py-2.5 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-100 text-xs font-semibold group-hover:text-emerald-200 transition-colors leading-snug">{q.name}</p>
                        <span className="text-[10px] text-gray-600 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-0.5 whitespace-nowrap">Explore →</span>
                      </div>
                      <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5 group-hover:text-gray-400 transition-colors">{q.description}</p>
                    </button>
                  ))}
                </div>
              )}
              {listLoading && questions.length > 0 && (
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Loading more…
                </div>
              )}
              {!listLoading && (
                <button onClick={() => { if (listCacheKey) localStorage.removeItem(listCacheKey); setQuestions([]); generateList(); }}
                  className="text-xs text-gray-700 hover:text-gray-500 mt-4 transition-colors">Regenerate</button>
              )}
            </div>
          )}

          {view === "treatment" && (
            <div>
              {treatmentLoading && !treatment && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Exploring every angle of this question…
                </div>
              )}
              {treatmentError && <p className="text-red-400 text-xs">{treatmentError}</p>}
              {treatment && (
                <div>
                  <div className="space-y-0.5">{renderMarkdown(treatment)}</div>
                  {treatmentLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      Generating…
                    </div>
                  )}
                  {!treatmentLoading && (
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      <button onClick={() => {
                        if (!activeQuestion) return;
                        localStorage.removeItem(`omni_gq::${activeQuestion.name.toLowerCase().slice(0, 80)}`);
                        setTreatment("");
                        openTreatment(activeQuestion);
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
