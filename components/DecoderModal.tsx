"use client";

import React, { useRef, useState } from "react";

interface DecoderModalProps {
  apiKey: string;
  onClose: () => void;
  onViewChain: (target: { term: string; domain: string; l1: string; l2?: string; insertTitle: string }) => void;
}

type Section =
  | "none"
  | "summary"
  | "placement"
  | "prereqs"
  | "context"
  | "opens"
  | "readiness";

const SECTION_STYLES: Record<Section, { divider: string; label: string }> = {
  none:      { divider: "border-gray-800/50",     label: "text-gray-600/60" },
  summary:   { divider: "border-cyan-900/40",     label: "text-cyan-700/60" },
  placement: { divider: "border-blue-900/40",     label: "text-blue-700/60" },
  prereqs:   { divider: "border-amber-900/40",    label: "text-amber-700/60" },
  context:   { divider: "border-violet-900/40",   label: "text-violet-700/60" },
  opens:     { divider: "border-emerald-900/40",  label: "text-emerald-700/60" },
  readiness: { divider: "border-rose-900/40",     label: "text-rose-700/60" },
};

function renderDecoder(text: string, loading: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let section: Section = "none";
  let itemCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      const header = line.slice(3).trim();
      const upper = header.toUpperCase();
      itemCount = 0;
      if (upper.includes("PLAIN") || upper.includes("SUMMARY")) section = "summary";
      else if (upper.includes("CURRICULUM") || upper.includes("PLACEMENT")) section = "placement";
      else if (upper.includes("WHAT YOU NEED") || upper.includes("PREREQ")) section = "prereqs";
      else if (upper.includes("RESPONDED") || upper.includes("CONTEXT")) section = "context";
      else if (upper.includes("OPENED") || upper.includes("OPENS")) section = "opens";
      else if (upper.includes("READINESS")) section = "readiness";
      else section = "none";

      const c = SECTION_STYLES[section];
      elements.push(
        <div key={`h${i}`} className="flex items-center gap-3 mt-10 mb-5">
          <div className={`h-px flex-1 border-t ${c.divider}`} />
          <span className={`text-[9px] font-bold tracking-[0.25em] uppercase ${c.label}`}>{header}</span>
          <div className={`h-px flex-1 border-t ${c.divider}`} />
        </div>
      );
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={`sp${i}`} className="h-2" />);
      continue;
    }

    // Numbered prereq items
    if (section === "prereqs" && /^\d+\.\s/.test(line)) {
      itemCount++;
      const content = line.replace(/^\d+\.\s/, "");
      const boldMatch = content.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.*)/);
      if (boldMatch) {
        elements.push(
          <div key={`pi${i}`} className="flex items-start gap-3 mb-3">
            <span className="text-amber-700/50 font-mono text-xs leading-5 flex-shrink-0 w-5 text-right">{itemCount}.</span>
            <p className="text-sm leading-relaxed text-gray-300">
              <span className="text-amber-200/80 font-medium">{boldMatch[1]}</span>
              <span className="text-gray-500"> — </span>
              <span className="text-gray-400">{boldMatch[2]}</span>
            </p>
          </div>
        );
      } else {
        elements.push(
          <div key={`pi${i}`} className="flex items-start gap-3 mb-3">
            <span className="text-amber-700/50 font-mono text-xs leading-5 flex-shrink-0 w-5 text-right">{itemCount}.</span>
            <p className="text-sm leading-relaxed text-gray-400">{content}</p>
          </div>
        );
      }
      continue;
    }

    // Placement bold fields
    if (section === "placement") {
      const boldMatch = line.match(/^\*\*(.+?)\*\*[:\s]+(.+)/);
      if (boldMatch) {
        const isField = boldMatch[1] === "Field";
        const isPriority = boldMatch[1] === "Priority";
        const priorityColors: Record<string, string> = {
          CORE: "text-green-400 bg-green-950/40 border-green-800/50",
          ESSENTIAL: "text-blue-400 bg-blue-950/40 border-blue-800/50",
          OPTIONAL: "text-gray-400 bg-gray-800/40 border-gray-700/50",
        };
        const priorityVal = boldMatch[2].trim();
        elements.push(
          <div key={`pf${i}`} className="flex items-baseline gap-3 mb-2">
            <span className="text-blue-500/60 text-[10px] font-semibold uppercase tracking-widest w-20 flex-shrink-0">{boldMatch[1]}</span>
            {isPriority ? (
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${priorityColors[priorityVal] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
                {priorityVal}
              </span>
            ) : (
              <span className={`text-sm ${isField ? "text-white font-medium" : "text-gray-300"}`}>{boldMatch[2]}</span>
            )}
          </div>
        );
        continue;
      }
    }

    // Readiness check lines
    if (section === "readiness") {
      const match = line.match(/^\*\*(.+?)\*\*[:\s]+(.+)/);
      if (match) {
        const levelColors: Record<string, string> = {
          "Level 1–2 reader": "text-green-400/80",
          "Level 3–4 reader": "text-blue-400/80",
          "Level 5–6 reader": "text-violet-400/80",
        };
        elements.push(
          <div key={`rc${i}`} className="flex items-start gap-3 mb-3 py-2 border-l-2 border-rose-900/30 pl-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 w-28 pt-0.5 ${levelColors[match[1]] ?? "text-gray-500"}`}>
              {match[1]}
            </span>
            <p className="text-sm text-gray-400 leading-relaxed">{match[2]}</p>
          </div>
        );
        continue;
      }
    }

    // Default paragraph rendering
    const cls =
      section === "summary"
        ? "text-gray-100 text-[15px] leading-[1.85]"
        : section === "placement"
          ? "text-gray-400 text-xs leading-relaxed italic mt-2"
          : section === "context" || section === "opens"
            ? "text-gray-300 text-sm leading-relaxed"
            : "text-gray-400 text-sm leading-relaxed";

    // Inline bold rendering for other sections
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      elements.push(
        <p key={`p${i}`} className={cls}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="text-gray-200 font-semibold">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    } else {
      elements.push(<p key={`p${i}`} className={cls}>{line}</p>);
    }
  }

  if (loading) {
    elements.push(
      <span key="cur" className="inline-block w-[7px] h-4 bg-cyan-600/70 animate-pulse rounded-sm ml-0.5" />
    );
  }

  return elements;
}

function extractPlacement(text: string): { term: string; domain: string; l1: string; l2?: string } | null {
  const fieldMatch = text.match(/\*\*Field:\*\*\s*([^\n]+)/);
  if (!fieldMatch) return null;
  const parts = fieldMatch[1].split(/\s*[→›>\/]\s*/);
  if (parts.length < 2) return null;
  return {
    term: parts[parts.length - 1]?.trim() ?? "",
    domain: parts[0]?.trim() ?? "",
    l1: parts[1]?.trim() ?? "",
    l2: parts.length >= 3 ? parts[2]?.trim() : undefined,
  };
}

export default function DecoderModal({ apiKey, onClose, onViewChain }: DecoderModalProps) {
  const [titleInput, setTitleInput] = useState("");
  const [abstractInput, setAbstractInput] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decoded, setDecoded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const normalizedTitle = titleInput.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 80);
  const cacheKey = `omni_decoder::${normalizedTitle}`;

  async function decode() {
    const t = titleInput.trim();
    if (!t) return;

    abortRef.current?.abort();

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setText(cached);
      setDecoded(true);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setText("");
    setError("");
    setDecoded(false);

    try {
      const res = await fetch("/api/decoder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, title: t, abstract: abstractInput.trim() }),
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
        setText(raw);
      }
      localStorage.setItem(cacheKey, raw);
      setDecoded(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleViewChain() {
    const placement = extractPlacement(text);
    if (!placement) return;
    onViewChain({
      term: placement.term || titleInput.trim(),
      domain: placement.domain,
      l1: placement.l1,
      l2: placement.l2,
      insertTitle: titleInput.trim(),
    });
    onClose();
  }

  function regenerate() {
    localStorage.removeItem(cacheKey);
    setDecoded(false);
    decode();
  }

  const placement = decoded ? extractPlacement(text) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 border border-cyan-900/30 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl shadow-cyan-950/20">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-cyan-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-cyan-500/80 text-sm">⬡</span>
              <span className="text-[10px] text-cyan-500/70 uppercase tracking-[0.2em] font-semibold">The Decoder</span>
              <span className="text-[9px] text-cyan-900/60 border border-cyan-900/40 rounded px-1.5 py-0.5">paper · book · essay</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Decode a Work</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Paste any title — get curriculum placement, prerequisites, context, and where it fits.</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none ml-4 mt-0.5 transition-colors">✕</button>
        </div>

        {/* Input form */}
        {!decoded && !loading && (
          <div className="px-6 py-5 border-b border-cyan-900/15">
            <div className="mb-3">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
                Title
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); decode(); } }}
                placeholder="e.g. Gödel, Escher, Bach — or any paper title"
                className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1.5 block">
                Abstract / Description <span className="text-gray-700 font-normal normal-case">(optional — improves accuracy)</span>
              </label>
              <textarea
                value={abstractInput}
                onChange={(e) => setAbstractInput(e.target.value)}
                placeholder="Paste the abstract or a short description if available…"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors resize-none"
              />
            </div>
            <button
              onClick={decode}
              disabled={!titleInput.trim() || !apiKey}
              className="bg-cyan-900/60 hover:bg-cyan-800/80 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-200 hover:text-cyan-100 border border-cyan-700/50 hover:border-cyan-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Decode →
            </button>
            {!apiKey && <p className="text-xs text-red-400/70 mt-2">Enter your API key in the top bar first.</p>}
          </div>
        )}

        {/* Result header when decoded */}
        {(decoded || loading) && (
          <div className="px-6 py-3 border-b border-cyan-900/15 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">Decoding: <span className="text-cyan-300/80">{titleInput}</span></p>
            </div>
            {decoded && placement && (
              <button
                onClick={handleViewChain}
                className="text-xs bg-indigo-900/50 hover:bg-indigo-800/70 text-indigo-300 hover:text-indigo-200 border border-indigo-700/50 hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-colors font-medium flex-shrink-0"
              >
                View Reading Chain →
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : loading && !text ? (
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-cyan-700 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Decoding…
            </div>
          ) : text ? (
            <div>{renderDecoder(text, loading)}</div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-900/20 flex items-center">
          {decoded && !error && (
            <button onClick={regenerate} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
              Regenerate
            </button>
          )}
          {decoded && (
            <button
              onClick={() => { setDecoded(false); setText(""); setError(""); }}
              className="text-xs text-gray-700 hover:text-gray-500 transition-colors ml-4"
            >
              Decode another
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
