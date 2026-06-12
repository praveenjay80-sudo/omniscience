"use client";

import React, { useEffect, useRef, useState } from "react";

interface ChainEntry {
  title: string;
  author: string;
  year: string;
  language?: string;
  tags?: string[];
  requires: string;
  contributes: string;
  enables: string;
}

const TAG_STYLES: Record<string, string> = {
  // Priority
  CORE:         "bg-red-900/50 text-red-300 border-red-800/50",
  ESSENTIAL:    "bg-blue-900/50 text-blue-300 border-blue-800/50",
  OPTIONAL:     "bg-gray-800/80 text-gray-500 border-gray-700/60",
  // Scope
  SHARED:       "bg-amber-900/50 text-amber-300 border-amber-700/50",
  // Level
  Introductory: "bg-green-900/40 text-green-400 border-green-800/40",
  Undergraduate:"bg-sky-900/40 text-sky-400 border-sky-800/40",
  Graduate:     "bg-yellow-900/40 text-yellow-400 border-yellow-800/40",
  Research:     "bg-rose-900/40 text-rose-400 border-rose-800/40",
  // Type
  Classic:      "bg-violet-900/40 text-violet-400 border-violet-800/40",
  Paper:        "bg-teal-900/30 text-teal-500 border-teal-800/30",
  Problems:     "bg-orange-900/30 text-orange-400 border-orange-800/30",
  Textbook:     "bg-gray-800/50 text-gray-600 border-gray-700/40",
  Monograph:    "bg-gray-800/50 text-gray-600 border-gray-700/40",
};

function parseChain(text: string): ChainEntry[] {
  const blocks = text.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
  const entries: ChainEntry[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    let headerLine = "";
    let language: string | undefined;
    let tags: string[] | undefined;
    let requires = "", contributes = "", enables = "";
    for (const line of lines) {
      if (line.startsWith("### ")) {
        headerLine = line.slice(4).trim();
      } else if (/^·\s*\w/.test(line.trim())) {
        language = line.trim().replace(/^·\s*/, "");
      } else if (/^\*\*Tags:\*\*/.test(line)) {
        const raw = line.replace(/^\*\*Tags:\*\*\s*/, "");
        tags = raw.split(/\s*·\s*/).map(t => t.trim()).filter(Boolean);
      } else if (/^\*\*Requires:\*\*/.test(line)) {
        requires = line.replace(/^\*\*Requires:\*\*\s*/, "");
      } else if (/^\*\*Contributes:\*\*/.test(line)) {
        contributes = line.replace(/^\*\*Contributes:\*\*\s*/, "");
      } else if (/^\*\*Enables:\*\*/.test(line)) {
        enables = line.replace(/^\*\*Enables:\*\*\s*/, "");
      }
      if (headerLine && headerLine.includes(" · ")) {
        const langMatch = headerLine.match(/\s·\s([A-Za-zÀ-ÿ]+)$/);
        if (langMatch) {
          language = langMatch[1];
          headerLine = headerLine.slice(0, -langMatch[0].length).trim();
        }
      }
    }
    if (!headerLine) continue;
    const dashMatch = headerLine.match(/^(.+?)\s[—–-]+\s(.+?)\s*\((\d{3,4}[^)]*)\)\s*$/);
    let title = headerLine, author = "", year = "";
    if (dashMatch) { title = dashMatch[1].trim(); author = dashMatch[2].trim(); year = dashMatch[3].trim(); }
    entries.push({ title, author, year, language, tags, requires, contributes, enables });
  }
  return entries;
}

interface SubtopicState {
  name: string;
  status: "pending" | "streaming" | "done" | "error";
  raw: string;
  entries: ChainEntry[];
  expanded: boolean;
  errorMsg?: string;
}

interface FieldMapModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
}

function ChainRow({ entry, index, isLast }: { entry: ChainEntry; index: number; isLast: boolean }) {
  const visibleTags = entry.tags?.filter(t => t !== "SPECIFIC") ?? [];
  const isShared = visibleTags.includes("SHARED");
  const isChainEnd = entry.enables?.toLowerCase().startsWith("chain complete");

  return (
    <div className={`relative ${isShared ? "bg-amber-950/10 -mx-4 px-4 rounded" : ""}`}>
      <div className="flex items-start gap-3 py-3">
        <div className="flex flex-col items-center flex-shrink-0 w-5">
          <span className="text-[10px] text-gray-700 font-mono">{index + 1}</span>
          {!isLast && <div className="w-px flex-1 bg-gray-800/60 mt-1 min-h-[1.5rem]" />}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          {/* Title + meta */}
          <p className="text-xs text-gray-200 font-medium leading-snug">{entry.title}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {entry.author}{entry.author && entry.year ? " · " : ""}{entry.year}
            {entry.language ? ` · ${entry.language}` : ""}
          </p>

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {visibleTags.map(tag => (
                <span
                  key={tag}
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${TAG_STYLES[tag] ?? "bg-gray-800 text-gray-600 border-gray-700"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Chain fields */}
          <div className="mt-2 space-y-1.5">
            {entry.requires && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-gray-700 uppercase tracking-widest font-semibold flex-shrink-0 w-14 pt-0.5">Needs</span>
                <p className="text-[10px] text-gray-600 leading-relaxed">{entry.requires}</p>
              </div>
            )}
            {entry.contributes && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-teal-700/80 uppercase tracking-widest font-semibold flex-shrink-0 w-14 pt-0.5">Gives</span>
                <p className="text-[10px] text-teal-400/60 leading-relaxed">{entry.contributes}</p>
              </div>
            )}
            {entry.enables && (
              <div className="flex items-start gap-2">
                <span className={`text-[9px] uppercase tracking-widest font-semibold flex-shrink-0 w-14 pt-0.5 ${isChainEnd ? "text-emerald-700/80" : "text-gray-700/60"}`}>
                  {isChainEnd ? "Mastery" : "Opens"}
                </span>
                <p className={`text-[10px] leading-relaxed ${isChainEnd ? "text-emerald-400/60" : "text-gray-700"}`}>{entry.enables}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldMapModal({ term, domain, l1, l2, apiKey, onClose }: FieldMapModalProps) {
  const [subtopicsLoading, setSubtopicsLoading] = useState(true);
  const [subtopicsError, setSubtopicsError] = useState("");
  const [states, setStates] = useState<SubtopicState[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const breadcrumb = [domain, l1, l2].filter(Boolean).join(" › ");
  const subCacheKey = `omni_fieldmap_sub::${domain}::${l1}::${l2 ?? ""}::${term}`;

  function chainCacheKey(subtopic: string) {
    return `omni_fieldmap_chain::${domain}::${l1}::${l2 ?? ""}::${term}::${subtopic.toLowerCase().replace(/\s+/g, "_").slice(0, 80)}`;
  }

  function buildInitialStates(subtopics: string[]): SubtopicState[] {
    return subtopics.map((name) => {
      const cached = localStorage.getItem(chainCacheKey(name));
      return {
        name,
        status: cached ? "done" : "pending",
        raw: cached ?? "",
        entries: cached ? parseChain(cached) : [],
        expanded: false,
      };
    });
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Fetch subtopics
  useEffect(() => {
    setSubtopicsLoading(true);
    setSubtopicsError("");

    const cached = localStorage.getItem(subCacheKey);
    if (cached) {
      try {
        const subtopics = JSON.parse(cached) as string[];
        setStates(buildInitialStates(subtopics));
        setSubtopicsLoading(false);
        return;
      } catch {}
    }

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch("/api/fieldmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, term, domain, l1, l2 }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let raw = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += dec.decode(value, { stream: true });
          if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1].trim());
        }
        const s = raw.indexOf("["), e = raw.lastIndexOf("]");
        if (s === -1 || e === -1) throw new Error("No sub-topics returned");
        const subtopics = JSON.parse(raw.slice(s, e + 1)) as string[];
        localStorage.setItem(subCacheKey, JSON.stringify(subtopics));
        setStates(buildInitialStates(subtopics));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setSubtopicsError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setSubtopicsLoading(false);
      }
    })();

    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCacheKey, refreshKey]);

  // Stream chains sequentially once states are initialized
  useEffect(() => {
    if (states.length === 0 || streamingRef.current) return;
    const firstPending = states.findIndex((s) => s.status === "pending");
    if (firstPending === -1) return;
    streamingRef.current = true;
    const names = states.map((s) => s.name);
    streamChains(names, firstPending);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states.length]);

  async function streamChains(names: string[], startIdx: number) {
    const controller = new AbortController();
    abortRef.current = controller;

    for (let i = startIdx; i < names.length; i++) {
      const name = names[i];
      const cKey = chainCacheKey(name);

      // Check cache (may have been populated since buildInitialStates)
      const cached = localStorage.getItem(cKey);
      if (cached) {
        setStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "done", raw: cached, entries: parseChain(cached) } : s
          )
        );
        continue;
      }

      // Auto-expand current, collapse previous completed sections
      setStates((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === i ? "streaming" : s.status,
          expanded: idx === i,
        }))
      );

      try {
        const res = await fetch("/api/readingchain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            mode: "generate",
            term: name,
            domain,
            l1,
            l2: term,
            fieldMap: true,
            subtopicOf: term,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let raw = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += dec.decode(value, { stream: true });
          if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1].trim());
          const entries = parseChain(raw);
          setStates((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, raw, entries } : s))
          );
        }
        localStorage.setItem(cKey, raw);
        setStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "done", expanded: false } : s
          )
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "error", errorMsg: msg, expanded: true } : s
          )
        );
      }
    }
    streamingRef.current = false;
  }

  function toggleExpanded(idx: number) {
    setStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, expanded: !s.expanded } : s))
    );
  }

  function regenerate() {
    abortRef.current?.abort();
    streamingRef.current = false;
    localStorage.removeItem(subCacheKey);
    states.forEach((s) => localStorage.removeItem(chainCacheKey(s.name)));
    setStates([]);
    setRefreshKey((k) => k + 1);
  }

  const totalWorks = states.reduce((acc, s) => acc + s.entries.length, 0);
  const doneCount = states.filter((s) => s.status === "done").length;
  const isAllDone = states.length > 0 && doneCount === states.length;
  const currentStreaming = states.find((s) => s.status === "streaming");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-teal-900/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-teal-950/20">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-teal-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-teal-400/80 text-sm">⊞</span>
              <span className="text-[10px] text-teal-400/70 uppercase tracking-[0.2em] font-semibold">Field Map</span>
            </div>
            <h2 className="text-white font-semibold text-lg">{term}</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{breadcrumb}</p>
          </div>
          <div className="flex items-center gap-3 ml-4 mt-1">
            {isAllDone && (
              <span className="text-[10px] text-teal-500/60">
                {states.length} sub-topics · {totalWorks} works
              </span>
            )}
            {!subtopicsLoading && states.length > 0 && !isAllDone && currentStreaming && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-[10px] text-gray-600">{doneCount}/{states.length}</span>
              </div>
            )}
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none transition-colors">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {subtopicsLoading ? (
            <div className="flex items-center gap-3 py-10 justify-center">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-gray-500 text-sm">Mapping sub-concepts of {term}…</p>
            </div>
          ) : subtopicsError ? (
            <p className="text-red-400 text-sm py-6">{subtopicsError}</p>
          ) : (
            states.map((s, idx) => (
              <div
                key={s.name}
                className={`rounded-xl border transition-colors ${
                  s.status === "streaming"
                    ? "border-teal-800/50 bg-teal-950/10"
                    : s.status === "done"
                      ? "border-gray-800/70 bg-gray-900/30"
                      : "border-gray-800/30 bg-gray-900/10"
                }`}
              >
                {/* Section header */}
                <button
                  onClick={() => toggleExpanded(idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] rounded-xl transition-colors"
                >
                  <span className="text-gray-700 text-[10px] w-3 flex-shrink-0">
                    {s.expanded ? "▾" : "▸"}
                  </span>

                  <span className={`font-medium text-sm flex-1 ${
                    s.status === "streaming" ? "text-teal-200" :
                    s.status === "done" ? "text-gray-200" :
                    "text-gray-600"
                  }`}>
                    {s.name}
                  </span>

                  {s.status === "streaming" && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-3 h-3 border border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-teal-500/60">
                        {s.entries.length > 0 ? `${s.entries.length} works…` : "generating…"}
                      </span>
                    </div>
                  )}
                  {s.status === "done" && (
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{s.entries.length} works</span>
                  )}
                  {s.status === "pending" && (
                    <span className="text-[10px] text-gray-800 flex-shrink-0">—</span>
                  )}
                  {s.status === "error" && (
                    <span className="text-[10px] text-red-500/70 flex-shrink-0">error</span>
                  )}
                </button>

                {/* Section content */}
                {s.expanded && (
                  <div className="px-4 pb-4">
                    {s.status === "error" ? (
                      <p className="text-red-400/70 text-xs px-2">{s.errorMsg}</p>
                    ) : s.entries.length > 0 ? (
                      <div>
                        {s.entries.map((entry, i) => (
                          <ChainRow key={`${entry.title}-${i}`} entry={entry} index={i} isLast={i === s.entries.length - 1} />
                        ))}
                        {s.status === "streaming" && (
                          <div className="flex items-center gap-2 pt-2">
                            <div className="w-2.5 h-2.5 border border-teal-700 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            <p className="text-[10px] text-gray-700">Building chain…</p>
                          </div>
                        )}
                      </div>
                    ) : s.status === "streaming" ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-3 h-3 border border-teal-700 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <p className="text-gray-700 text-xs">Building chain…</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-teal-900/20 flex items-center">
          {isAllDone && (
            <button
              onClick={regenerate}
              className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
            >
              Regenerate
            </button>
          )}
          <div className="flex-1" />
          {isAllDone && (
            <span className="text-xs text-gray-700 mr-4">
              {totalWorks} total works
            </span>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-gray-300 px-4 py-1.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
