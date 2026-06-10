"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

interface ThematicModalProps {
  apiKey: string;
  onClose: () => void;
}

interface ThemeEntry {
  category: string;
  name: string;
  description: string;
}

// Fallback shown while the full list loads for the first time
const SEED_THEMES: ThemeEntry[] = [
  { category: "Cross-Domain", name: "Symmetry", description: "When a system looks identical after a transformation — rotation, reflection, or more abstract operations" },
  { category: "Cross-Domain", name: "Duality", description: "When two completely different mathematical or physical worlds have a perfect mirror correspondence" },
  { category: "Cross-Domain", name: "Information and Entropy", description: "How much surprise, disorder, or uncertainty is packed into a system — and why it always tends to increase" },
  { category: "Cross-Domain", name: "Optimization", description: "Finding the best possible solution among all possibilities, from calculus to evolution to neural networks" },
  { category: "Cross-Domain", name: "Emergence", description: "When simple local rules produce complex global behaviour that couldn't be predicted from the parts alone" },
  { category: "Cross-Domain", name: "Fixed Points and Equilibrium", description: "States a system returns to or gets stuck at — the mathematics of stability everywhere from economics to physics" },
  { category: "Cross-Domain", name: "Infinity and Limits", description: "What happens when quantities grow without bound or shrink to nothing — the foundation of calculus and set theory" },
  { category: "Cross-Domain", name: "Self-Reference and Paradox", description: "Systems that refer to themselves, producing paradoxes, incompleteness theorems, and strange loops" },
  { category: "Cross-Domain", name: "Conservation Laws", description: "Quantities that never change no matter what happens — energy, momentum, charge — and why they exist" },
  { category: "Cross-Domain", name: "Recursion", description: "Structures or processes that contain or generate copies of themselves — from fractals to computer programs" },
  { category: "Cross-Domain", name: "Phase Transitions", description: "Sudden qualitative shifts when a quantity changes continuously — water to ice, order to chaos" },
  { category: "Cross-Domain", name: "Networks and Graphs", description: "How connected things are structured, how information flows through them, and why hubs emerge" },
  { category: "Cross-Domain", name: "Randomness and Uncertainty", description: "The irreducible unpredictability in systems — and the surprising order that emerges from it" },
  { category: "Cross-Domain", name: "Feedback Loops", description: "When a system's output feeds back as its own input — the engine of both stability and runaway growth" },
  { category: "Cross-Domain", name: "Dimension", description: "How many independent directions exist in a space — from three physical dimensions to infinite-dimensional function spaces" },
  { category: "Cross-Domain", name: "Waves and Oscillation", description: "Periodic disturbances that carry energy without carrying matter — from sound to quantum probability amplitudes" },
];

const THEME_LIST_KEY = "omni_theme_library";

function parseNDJSON(raw: string): ThemeEntry[] {
  const results: ThemeEntry[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj.c && obj.n && obj.d) {
        results.push({ category: obj.c, name: obj.n, description: obj.d });
      } else if (obj.category && obj.name && obj.description) {
        results.push({ category: obj.category, name: obj.name, description: obj.description });
      }
    } catch { /* skip malformed lines */ }
  }
  return results;
}

export default function ThematicModal({ apiKey, onClose }: ThematicModalProps) {
  const [themes, setThemes] = useState<ThemeEntry[]>(SEED_THEMES);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryProgress, setLibraryProgress] = useState(0); // 0-4 batches done

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ThemeEntry | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cached library or trigger generation
  useEffect(() => {
    const cached = localStorage.getItem(THEME_LIST_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ThemeEntry[];
        if (parsed.length > 20) { setThemes(parsed); return; }
      } catch {}
    }
    if (!apiKey) return;
    generateLibrary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function streamBatch(batch: number): Promise<ThemeEntry[]> {
    const res = await fetch("/api/themelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, batch }),
    });
    if (!res.ok || !res.body) return [];
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
    }
    if (raw.includes("__ERROR__:")) return [];
    return parseNDJSON(raw);
  }

  async function generateLibrary() {
    setLibraryLoading(true);
    setLibraryProgress(0);
    const all: ThemeEntry[] = [];
    for (let batch = 1; batch <= 4; batch++) {
      const entries = await streamBatch(batch);
      all.push(...entries);
      setThemes([...SEED_THEMES, ...all]);
      setLibraryProgress(batch);
    }
    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    const deduped = all.filter((t) => {
      const key = t.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setThemes(deduped);
    localStorage.setItem(THEME_LIST_KEY, JSON.stringify(deduped));
    setLibraryLoading(false);
  }

  // Group filtered themes by category
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return themes;
    return themes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [themes, search]);

  const grouped = useMemo(() => {
    const map: Record<string, ThemeEntry[]> = {};
    for (const t of filtered) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  async function generate(theme: ThemeEntry | null, customTheme?: string) {
    const themeName = theme?.name ?? customTheme ?? "";
    if (!themeName) return;
    const key = `omni_thematic::${themeName.toLowerCase()}`;
    const cached = localStorage.getItem(key);
    if (cached) { setContent(cached); return; }
    if (!apiKey) { setError("Enter your API key first."); return; }
    setLoading(true);
    setContent("");
    setError(null);
    try {
      const res = await fetch("/api/thematic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, theme: themeName }),
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
        setContent(text);
      }
      localStorage.setItem(key, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string) {
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
      const specMatch = line.match(/^\*\*([^*]+)\*\*\s*—\s*(.+)$/);
      if (specMatch)
        return (
          <div key={i} className="flex gap-2 mt-1.5 items-start">
            <span className="text-[10px] bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 mt-0.5">{specMatch[1]}</span>
            <p className="text-gray-400 text-xs leading-relaxed">{inline(specMatch[2])}</p>
          </div>
        );
      return <p key={i} className="text-gray-400 text-xs leading-relaxed">{inline(line)}</p>;
    });
  }

  const currentTheme = selected?.name ?? (search && !showDropdown ? search : "");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Thematic Curriculum</p>
            <h2 className="text-white font-semibold text-base">
              {content || loading ? currentTheme : "Trace a theme across all of human knowledge"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none mt-1">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!content && !loading && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs leading-relaxed">
                Pick any theme and discover how it manifests across mathematics, physics, biology, economics, philosophy — and wherever else it lives. {themes.length > 20 ? <span className="text-violet-400">{themes.length.toLocaleString()} themes available.</span> : null}
              </p>

              {/* Library loading progress */}
              {libraryLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Building theme library… {libraryProgress}/4 domains complete
                </div>
              )}

              {/* Searchable combobox */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={`Search ${themes.length > 20 ? themes.length.toLocaleString() + " " : ""}themes — or type your own…`}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                  />
                  {search && (
                    <button onClick={() => { setSearch(""); setSelected(null); searchRef.current?.focus(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs">✕</button>
                  )}
                </div>

                {/* Selected theme chip */}
                {selected && (
                  <div className="mt-2 flex items-start gap-2 bg-violet-950/50 border border-violet-700/50 rounded-lg px-3 py-2">
                    <span className="text-violet-300 text-xs font-semibold flex-shrink-0">{selected.name}</span>
                    <span className="text-gray-500 text-xs">{selected.description}</span>
                    <button onClick={() => { setSelected(null); setSearch(""); }} className="ml-auto text-gray-600 hover:text-gray-400 flex-shrink-0">✕</button>
                  </div>
                )}

                {/* Dropdown */}
                {showDropdown && filtered.length > 0 && !selected && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                    {grouped.map(([cat, items]) => (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[10px] text-gray-600 uppercase tracking-widest font-semibold bg-gray-900/90 sticky top-0">
                          {cat} <span className="text-gray-700">({items.length})</span>
                        </div>
                        {items.map((t) => (
                          <button key={t.name}
                            onMouseDown={() => { setSelected(t); setSearch(t.name); setShowDropdown(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors">
                            <p className="text-gray-200 text-xs font-medium">{t.name}</p>
                            <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">{t.description}</p>
                          </button>
                        ))}
                      </div>
                    ))}
                    {search && (
                      <button
                        onMouseDown={() => { setSelected(null); setShowDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 border-t border-gray-800 hover:bg-gray-800 transition-colors">
                        <p className="text-gray-400 text-xs">Use <span className="text-white font-medium">"{search}"</span> as a custom theme →</p>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={() => generate(selected, !selected ? search : undefined)}
                disabled={!currentTheme || !apiKey}
                className="w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                {apiKey
                  ? currentTheme ? `Trace "${currentTheme}" across all knowledge →` : "Pick or type a theme above"
                  : "Enter API key first"}
              </button>

              {/* Regenerate library button */}
              {!libraryLoading && themes.length > 20 && (
                <button onClick={() => { localStorage.removeItem(THEME_LIST_KEY); setThemes(SEED_THEMES); generateLibrary(); }}
                  className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
                  Regenerate theme library
                </button>
              )}
            </div>
          )}

          {loading && !content && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Tracing "{currentTheme}" across all of human knowledge…
            </div>
          )}

          {content && (
            <div>
              <div className="space-y-0.5">{renderContent(content)}</div>
              {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
                  <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Generating…
                </div>
              )}
              {!loading && (
                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <button onClick={() => { setContent(""); setSelected(null); setSearch(""); setError(null); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    ← Choose a different theme
                  </button>
                  <button onClick={() => {
                    localStorage.removeItem(`omni_thematic::${currentTheme.toLowerCase()}`);
                    setContent("");
                    generate(selected, !selected ? search : undefined);
                  }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
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
