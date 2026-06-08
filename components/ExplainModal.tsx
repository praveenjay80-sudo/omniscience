"use client";

import { useEffect, useState } from "react";

interface ExplainModalProps {
  term: string;
  domain: string;
  l1: string;
  l2?: string;
  apiKey: string;
  onClose: () => void;
}

function renderMarkdown(text: string) {
  // Convert **bold** headers and basic formatting
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="text-blue-300 font-bold text-base mt-4 mb-1">
          {line.slice(2, -2)}
        </h3>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    // Inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-gray-200 text-sm leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        )}
      </p>
    );
  });
}

export default function ExplainModal({
  term,
  domain,
  l1,
  l2,
  apiKey,
  onClose,
}: ExplainModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, term, domain, l1, l2 }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          raw += chunk;
          if (!cancelled) {
            if (raw.includes("__ERROR__:")) {
              throw new Error(raw.split("__ERROR__:")[1].trim());
            }
            setText(raw);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [apiKey, term, domain, l1, l2]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">{term}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {[domain, l1, l2].filter(Boolean).join(" › ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-4 mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <>
              {renderMarkdown(text)}
              {loading && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5 rounded-sm" />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
