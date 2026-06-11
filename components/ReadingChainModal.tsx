"use client";

import React, { useEffect, useRef, useState } from "react";

interface ReadingChainModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
  insertTitle?: string;
}

interface ChainEntry {
  title: string;
  author: string;
  year: string;
  language?: string;
  requires: string;
  contributes: string;
  enables: string;
  isInserted?: boolean;
  insertionContext?: string;
}

function parseChain(text: string): ChainEntry[] {
  const blocks = text.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
  const entries: ChainEntry[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    let headerLine = "";
    let language: string | undefined;
    let requires = "";
    let contributes = "";
    let enables = "";

    for (const line of lines) {
      if (line.startsWith("### ")) {
        headerLine = line.slice(4).trim();
      } else if (/^·\s*\w/.test(line.trim())) {
        language = line.trim().replace(/^·\s*/, "");
      } else if (/^\*\*Requires:\*\*/.test(line)) {
        requires = line.replace(/^\*\*Requires:\*\*\s*/, "");
      } else if (/^\*\*Contributes:\*\*/.test(line)) {
        contributes = line.replace(/^\*\*Contributes:\*\*\s*/, "");
      } else if (/^\*\*Enables:\*\*/.test(line)) {
        enables = line.replace(/^\*\*Enables:\*\*\s*/, "");
      }
      // Extract language from header line itself if it contains " · "
      if (headerLine && headerLine.includes(" · ")) {
        const langMatch = headerLine.match(/\s·\s([A-Za-zÀ-ÿ]+)$/);
        if (langMatch) {
          language = langMatch[1];
          headerLine = headerLine.slice(0, -langMatch[0].length).trim();
        }
      }
    }

    if (!headerLine) continue;

    // Parse "Title — Author (Year)" or "Title — Author, Author (Year)"
    const dashMatch = headerLine.match(/^(.+?)\s[—–-]+\s(.+?)\s*\((\d{3,4}[^)]*)\)\s*$/);
    let title = headerLine;
    let author = "";
    let year = "";

    if (dashMatch) {
      title = dashMatch[1].trim();
      author = dashMatch[2].trim();
      year = dashMatch[3].trim();
    }

    entries.push({ title, author, year, language, requires, contributes, enables });
  }

  return entries;
}

function parseInsertResult(text: string): { fitsBetween: string; whyHere: string; entry: ChainEntry } | null {
  const fitsBetweenMatch = text.match(/\*\*Fits between:\*\*\s*(.+)/);
  const whyHereMatch = text.match(/\*\*Why here:\*\*\s*([\s\S]+?)(?=\n---|\n###|$)/);

  if (!fitsBetweenMatch) return null;

  const afterDashes = text.split(/\n---\n/).slice(1).join("\n---\n");
  const entries = parseChain(afterDashes.trim() ? afterDashes : text.split(/\n---\n/).slice(-1)[0]);
  const entry = entries[0];
  if (!entry) return null;

  return {
    fitsBetween: fitsBetweenMatch[1].trim(),
    whyHere: whyHereMatch ? whyHereMatch[1].trim() : "",
    entry: { ...entry, isInserted: true },
  };
}

function ChainCard({ entry, index, total }: { entry: ChainEntry; index: number; total: number }) {
  const isLast = index === total - 1;
  const isChainEnd = entry.enables?.toLowerCase().startsWith("chain complete");

  return (
    <div className="relative">
      <div className={`rounded-xl border p-4 transition-colors ${
        entry.isInserted
          ? "border-amber-700/60 bg-amber-950/20"
          : "border-gray-800 bg-gray-900/80"
      }`}>
        {/* Title row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
            entry.isInserted
              ? "bg-amber-700/40 text-amber-300 border border-amber-600/50"
              : "bg-gray-800 text-gray-500 border border-gray-700"
          }`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm leading-snug ${entry.isInserted ? "text-amber-100" : "text-white"}`}>
              {entry.title}
            </p>
            {(entry.author || entry.year) && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {entry.author}{entry.author && entry.year && " · "}{entry.year}
              </p>
            )}
            {entry.language && (
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/25 border border-amber-800/25 text-amber-400/60">
                {entry.language}
              </span>
            )}
            {entry.isInserted && (
              <span className="inline-block mt-1 ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-700/20 border border-amber-600/30 text-amber-300/70 font-medium">
                ← placed here
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="ml-9 space-y-1.5">
          {entry.requires && (
            <div className="flex items-start gap-2">
              <span className="text-[9px] text-gray-600 uppercase tracking-widest font-semibold flex-shrink-0 w-20 pt-0.5">Requires</span>
              <p className="text-[11px] text-gray-500 leading-relaxed">{entry.requires}</p>
            </div>
          )}
          {entry.contributes && (
            <div className="flex items-start gap-2">
              <span className="text-[9px] text-indigo-600/80 uppercase tracking-widest font-semibold flex-shrink-0 w-20 pt-0.5">Gives you</span>
              <p className="text-[11px] text-indigo-300/70 leading-relaxed">{entry.contributes}</p>
            </div>
          )}
          {entry.enables && (
            <div className="flex items-start gap-2">
              <span className={`text-[9px] uppercase tracking-widest font-semibold flex-shrink-0 w-20 pt-0.5 ${isChainEnd ? "text-emerald-600/80" : "text-gray-700"}`}>
                {isChainEnd ? "Mastery" : "Enables"}
              </span>
              <p className={`text-[11px] leading-relaxed ${isChainEnd ? "text-emerald-400/70" : "text-gray-600"}`}>{entry.enables}</p>
            </div>
          )}
        </div>
      </div>

      {/* Connector */}
      {!isLast && (
        <div className="flex justify-center py-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-px h-3 bg-gray-800" />
            <div className="text-gray-700 text-xs leading-none">↓</div>
            <div className="w-px h-3 bg-gray-800" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReadingChainModal({
  term,
  domain,
  l1,
  l2,
  apiKey,
  onClose,
  insertTitle,
}: ReadingChainModalProps) {
  const [chainText, setChainText] = useState("");
  const [insertText, setInsertText] = useState("");
  const [loading, setLoading] = useState(true);
  const [insertLoading, setInsertLoading] = useState(false);
  const [error, setError] = useState("");
  const [insertError, setInsertError] = useState("");
  const [paperInput, setPaperInput] = useState(insertTitle ?? "");
  const [refreshKey, setRefreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const breadcrumb = [domain, l1, l2].filter(Boolean).join(" › ");
  const cacheKey = `omni_chain::${domain}::${l1}::${l2 ?? ""}::${term}`;

  // Generate chain
  useEffect(() => {
    abortRef.current?.abort();

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setChainText(cached);
      setLoading(false);
      if (insertTitle) runInsert(insertTitle, cached);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setChainText("");
    setError("");

    (async () => {
      try {
        const res = await fetch("/api/readingchain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, mode: "generate", term, domain, l1, l2 }),
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
          setChainText(raw);
        }
        localStorage.setItem(cacheKey, raw);
        if (insertTitle) runInsert(insertTitle, raw);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, refreshKey]);

  async function runInsert(title: string, chain: string) {
    setInsertLoading(true);
    setInsertText("");
    setInsertError("");
    try {
      const res = await fetch("/api/readingchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          mode: "insert",
          term,
          domain,
          l1,
          l2,
          insertTitle: title,
          existingChain: chain,
        }),
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
        setInsertText(raw);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setInsertError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setInsertLoading(false);
    }
  }

  function handlePlace() {
    const t = paperInput.trim();
    if (!t || !chainText || insertLoading) return;
    runInsert(t, chainText);
  }

  function regenerate() {
    localStorage.removeItem(cacheKey);
    setInsertText("");
    setInsertError("");
    setRefreshKey((k) => k + 1);
  }

  // Build display chain: base chain + insertion if available
  const baseEntries = chainText ? parseChain(chainText) : [];
  const insertResult = insertText && !insertLoading ? parseInsertResult(insertText) : null;

  let displayEntries: ChainEntry[] = baseEntries;
  if (insertResult) {
    const between = insertResult.fitsBetween;
    const arrowIdx = between.indexOf("→");
    const beforeTitle = arrowIdx >= 0 ? between.slice(0, arrowIdx).trim() : "";
    const afterTitle = arrowIdx >= 0 ? between.slice(arrowIdx + 1).trim() : "";

    // Find insertion index
    const afterIdx = baseEntries.findIndex(
      (e) => afterTitle && e.title.toLowerCase().includes(afterTitle.toLowerCase().slice(0, 20))
    );
    const beforeIdx = baseEntries.findIndex(
      (e) => beforeTitle && e.title.toLowerCase().includes(beforeTitle.toLowerCase().slice(0, 20))
    );

    const insertIdx = afterTitle.toLowerCase() === "chain end"
      ? baseEntries.length
      : afterIdx >= 0
        ? afterIdx
        : beforeIdx >= 0
          ? beforeIdx + 1
          : -1;

    if (insertIdx >= 0) {
      displayEntries = [
        ...baseEntries.slice(0, insertIdx),
        { ...insertResult.entry, isInserted: true },
        ...baseEntries.slice(insertIdx),
      ];
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-indigo-900/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/20">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-indigo-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-400/80 text-sm">⬦</span>
              <span className="text-[10px] text-indigo-400/70 uppercase tracking-[0.2em] font-semibold">Reading Chain</span>
            </div>
            <h2 className="text-white font-semibold text-lg">{term}</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{breadcrumb}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none ml-4 mt-0.5 transition-colors">✕</button>
        </div>

        {/* Place a paper input */}
        {!loading && chainText && (
          <div className="px-5 py-3 border-b border-indigo-900/15 bg-indigo-950/10">
            <p className="text-[10px] text-indigo-400/60 uppercase tracking-widest font-semibold mb-2">Place a paper in this chain</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={paperInput}
                onChange={(e) => setPaperInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePlace(); }}
                placeholder="Paste any paper or book title…"
                className="flex-1 bg-gray-900 border border-gray-700 focus:border-indigo-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors"
              />
              <button
                onClick={handlePlace}
                disabled={!paperInput.trim() || insertLoading}
                className="bg-indigo-900/50 hover:bg-indigo-800/70 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 border border-indigo-700/50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                {insertLoading ? "Placing…" : "Place →"}
              </button>
            </div>
            {insertError && <p className="text-red-400/70 text-xs mt-1.5">{insertError}</p>}
            {insertResult && !insertLoading && (
              <div className="mt-2 text-xs text-indigo-300/60 leading-relaxed">
                <span className="text-indigo-400/80 font-medium">Fits between:</span> {insertResult.fitsBetween}
                {insertResult.whyHere && <p className="text-gray-500 mt-1">{insertResult.whyHere}</p>}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-800 rounded w-3/4 mb-1.5" />
                      <div className="h-2 bg-gray-800/60 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="ml-9 space-y-1.5">
                    <div className="h-2 bg-gray-800/60 rounded w-full" />
                    <div className="h-2 bg-gray-800/60 rounded w-5/6" />
                  </div>
                </div>
              ))}
              <p className="text-center text-gray-600 text-xs mt-2">Building reading chain…</p>
            </div>
          ) : displayEntries.length > 0 ? (
            <div>
              {displayEntries.map((entry, i) => (
                <ChainCard key={`${entry.title}-${i}`} entry={entry} index={i} total={displayEntries.length} />
              ))}
              {insertLoading && (
                <div className="mt-4 flex items-center gap-2 text-indigo-400/60 text-sm">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Placing paper in chain…
                </div>
              )}
            </div>
          ) : chainText ? (
            <p className="text-gray-500 text-sm">Parsing chain…</p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-indigo-900/20 flex items-center">
          {!loading && !error && chainText && (
            <button onClick={regenerate} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
              Regenerate
            </button>
          )}
          <div className="flex-1" />
          <span className="text-xs text-gray-700 mr-4">{baseEntries.length > 0 ? `${baseEntries.length} works` : ""}</span>
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
