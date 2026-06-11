"use client";

import React, { useEffect, useRef, useState } from "react";

interface WoundModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
}

type Section = "none" | "aporia" | "metaphor" | "works";
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

function renderWound(text: string, loading: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let section: Section = "none";
  let workCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      const header = line.slice(3).trim();
      const upper = header.toUpperCase();
      workCount = 0;
      if (upper.includes("APORIA")) section = "aporia";
      else if (upper.includes("METAPHOR")) section = "metaphor";
      else if (upper.includes("WORKS")) section = "works";
      else section = "none";

      const colors: Record<Section, { divider: string; label: string }> = {
        aporia:   { divider: "border-rose-900/40",   label: "text-rose-700/60" },
        metaphor: { divider: "border-amber-900/40",  label: "text-amber-700/60" },
        works:    { divider: "border-violet-900/40", label: "text-violet-700/60" },
        none:     { divider: "border-gray-800/50",   label: "text-gray-600/60" },
      };
      const c = colors[section];
      elements.push(
        <div key={`h${i}`} className="flex items-center gap-3 mt-10 mb-6">
          <div className={`h-px flex-1 border-t ${c.divider}`} />
          <span className={`text-[9px] font-bold tracking-[0.25em] uppercase ${c.label}`}>{header}</span>
          <div className={`h-px flex-1 border-t ${c.divider}`} />
        </div>
      );
    } else if (line.startsWith("### ") && section === "works") {
      const title = line.slice(4).trim();
      const roman = ROMAN[workCount] ?? String(workCount + 1);
      workCount++;
      elements.push(
        <div key={`wh${i}`} className="flex items-start gap-4 mt-8 mb-2">
          <span className="text-rose-800/50 font-serif text-2xl leading-none flex-shrink-0 w-6 text-right mt-0.5 italic select-none">{roman}</span>
          <h3 className="text-white font-semibold text-sm leading-snug pt-0.5">{title}</h3>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={`sp${i}`} className="h-2" />);
    } else {
      const cls =
        section === "aporia"
          ? "text-gray-100 text-[15px] leading-[1.85] italic"
          : section === "metaphor"
            ? "text-amber-100/55 text-sm leading-relaxed"
            : "text-gray-400 text-xs leading-relaxed";
      elements.push(<p key={`p${i}`} className={cls}>{line}</p>);
    }
  }

  if (loading) {
    elements.push(
      <span key="cur" className="inline-block w-[7px] h-4 bg-rose-700/70 animate-pulse rounded-sm ml-0.5" />
    );
  }

  return elements;
}

export default function WoundModal({ term, domain, l1, l2, apiKey, onClose }: WoundModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cacheKey = `omni_wound::${domain}::${l1}::${term}`;
  const breadcrumb = [domain, l1, l2].filter(Boolean).join(" › ");

  useEffect(() => {
    abortRef.current?.abort();

    const cached = localStorage.getItem(cacheKey);
    if (cached) { setText(cached); setLoading(false); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setText("");
    setError("");

    (async () => {
      try {
        const res = await fetch("/api/wound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, term, domain, l1, l2, mode: "field" }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1].trim());
          setText(raw);
        }
        localStorage.setItem(cacheKey, raw);
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

  function regenerate() {
    localStorage.removeItem(cacheKey);
    setRefreshKey(k => k + 1);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-rose-900/25 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl shadow-rose-950/20">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-rose-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-rose-500/80 text-sm">⊙</span>
              <span className="text-[10px] text-rose-500/70 uppercase tracking-[0.2em] font-semibold">The Horizon</span>
              <span className="text-[9px] text-rose-900/60 border border-rose-900/40 rounded px-1.5 py-0.5">structural limit</span>
            </div>
            <h2 className="text-white font-semibold text-lg">{term}</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{breadcrumb}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none ml-4 mt-0.5 transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <div>{renderWound(text, loading)}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-900/20 flex items-center">
          {!loading && !error && text && (
            <button onClick={regenerate} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
              Regenerate
            </button>
          )}
          <div className="flex-1" />
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
