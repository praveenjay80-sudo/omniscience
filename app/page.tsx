"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OPENALEX_TAXONOMY, getSubfields, getTopics } from "@/lib/taxonomy-openalex";
import { VerifyStatus, verifyAll } from "@/lib/wikipedia";
import SearchLinks from "@/components/SearchLinks";
import ExplainModal from "@/components/ExplainModal";
import VerifyBadge from "@/components/VerifyBadge";
import LearningPathModal from "@/components/LearningPathModal";
import DiscoverModal from "@/components/DiscoverModal";
import ThematicModal from "@/components/ThematicModal";
import GreatQuestionsModal from "@/components/GreatQuestionsModal";
import UniversalMapModal from "@/components/UniversalMapModal";
import WoundModal from "@/components/WoundModal";
import DecoderModal from "@/components/DecoderModal";
import ReadingChainModal from "@/components/ReadingChainModal";
import FieldMapModal from "@/components/FieldMapModal";

type Phase = "pick-domain" | "pick-l1" | "pick-l2" | "view-l3";

interface ExplainTarget { term: string; l2?: string; }
interface LearningPathTarget { term: string; l2?: string; }
interface DiscoverTarget { term: string; l2?: string; }
interface WoundTarget { term: string; l2?: string; }
interface ChainTarget { term: string; domain: string; l1: string; l2?: string; insertTitle?: string; }
interface FieldMapTarget { term: string; domain: string; l1: string; l2?: string; }

function cacheKey(domain: string, l1: string, l2?: string) {
  return l2 ? `omni_l3::${domain}::${l1}::${l2}` : `omni_l2::${domain}::${l1}`;
}

async function streamExpand(
  apiKey: string,
  domain: string,
  l1: string,
  l2: string | undefined,
  onChunk: (t: string) => void
): Promise<string[]> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, domain, l1, l2 }),
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
    onChunk(raw);
    if (raw.includes("__ERROR__:")) throw new Error(raw.split("__ERROR__:")[1].trim());
  }

  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in response");
  return JSON.parse(raw.slice(start, end + 1)) as string[];
}

const LEVEL_BADGE: Record<string, string> = {
  Introductory: "text-green-400 bg-green-950/60 border-green-900",
  Undergraduate: "text-blue-400 bg-blue-950/60 border-blue-900",
  Graduate: "text-yellow-400 bg-yellow-950/60 border-yellow-900",
  Research: "text-red-400 bg-red-950/60 border-red-900",
};

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [phase, setPhase] = useState<Phase>("pick-domain");

  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");

  const [l2List, setL2List] = useState<string[]>([]);
  const [l3List, setL3List] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");

  const [explainTarget, setExplainTarget] = useState<ExplainTarget | null>(null);
  const [learningPathTarget, setLearningPathTarget] = useState<LearningPathTarget | null>(null);
  const [discoverTarget, setDiscoverTarget] = useState<DiscoverTarget | null>(null);
  const [woundTarget, setWoundTarget] = useState<WoundTarget | null>(null);
  const [showDecoder, setShowDecoder] = useState(false);
  const [chainTarget, setChainTarget] = useState<ChainTarget | null>(null);
  const [fieldMapTarget, setFieldMapTarget] = useState<FieldMapTarget | null>(null);
  const [showThematic, setShowThematic] = useState(false);
  const [showGreatQuestions, setShowGreatQuestions] = useState(false);
  const [showUniversalMap, setShowUniversalMap] = useState(false);

  // Wikipedia verification
  const [verifyMap, setVerifyMap] = useState<Record<string, VerifyStatus>>({});
  const [verifyUrlMap, setVerifyUrlMap] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);

  // Difficulty badges (populated from cached prereq data)
  const [difficultyMap, setDifficultyMap] = useState<Record<string, string>>({});

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Generation counter — prevents stale async expand callbacks from writing state
  const expandGenRef = useRef(0);

  useEffect(() => {
    const k = localStorage.getItem("omni_apikey");
    if (k) setApiKey(k);
    const bm = localStorage.getItem("omni_bookmarks");
    if (bm) setBookmarks(new Set(JSON.parse(bm)));
  }, []);

  // Close bookmarks dropdown when clicking outside
  useEffect(() => {
    if (!showBookmarks) return;
    const handler = () => setShowBookmarks(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showBookmarks]);

  // Load difficulty levels from cached prereq data whenever list changes
  useEffect(() => {
    const list = phase === "pick-l2" ? l2List : phase === "view-l3" ? l3List : [];
    const l2Scope = phase === "view-l3" ? selectedL2 : "";
    const map: Record<string, string> = {};
    list.forEach((term) => {
      const key = `omni_prereq::${selectedDomain}::${selectedL1}::${l2Scope}::${term}`;
      const cached = localStorage.getItem(key);
      if (!cached) return;
      try {
        const data = JSON.parse(cached) as { difficulty: { level: string } };
        if (data.difficulty?.level) map[term] = data.difficulty.level;
      } catch {}
    });
    if (Object.keys(map).length > 0) setDifficultyMap((prev) => ({ ...prev, ...map }));
  }, [l2List, l3List]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveApiKey = (k: string) => {
    setApiKey(k);
    localStorage.setItem("omni_apikey", k);
  };

  const toggleBookmark = (term: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      localStorage.setItem("omni_bookmarks", JSON.stringify([...next]));
      return next;
    });
  };

  const loadCachedVerify = useCallback((terms: string[]) => {
    const statusMap: Record<string, VerifyStatus> = {};
    const urlMap: Record<string, string> = {};
    terms.forEach((t) => {
      const raw = localStorage.getItem(`omni_wiki::${t}`);
      if (!raw) return;
      try {
        const entry = JSON.parse(raw) as { status: VerifyStatus; url: string | null };
        statusMap[t] = entry.status;
        if (entry.url) urlMap[t] = entry.url;
      } catch {
        statusMap[t] = raw as VerifyStatus;
      }
    });
    setVerifyMap((prev) => ({ ...prev, ...statusMap }));
    setVerifyUrlMap((prev) => ({ ...prev, ...urlMap }));
  }, []);

  const expand = useCallback(
    async (domain: string, l1: string, l2?: string) => {
      const myGen = ++expandGenRef.current;

      const key = cacheKey(domain, l1, l2);
      const cached = localStorage.getItem(key);
      if (cached) {
        if (expandGenRef.current !== myGen) return;
        const items = JSON.parse(cached) as string[];
        if (l2) { setL3List(items); loadCachedVerify(items); }
        else { setL2List(items); loadCachedVerify(items); }
        return;
      }

      if (!apiKey) { setError("Enter your API key first."); return; }

      setLoading(true);
      setError("");
      setLoadingText("");

      try {
        const items = await streamExpand(apiKey, domain, l1, l2, (partial) => {
          if (expandGenRef.current !== myGen) return;
          const match = partial.match(/\[[\s\S]*/);
          if (match) setLoadingText(match[0].slice(0, 120) + "…");
        });
        if (expandGenRef.current !== myGen) return;
        localStorage.setItem(key, JSON.stringify(items));
        if (l2) { setL3List(items); loadCachedVerify(items); }
        else { setL2List(items); loadCachedVerify(items); }
      } catch (err: unknown) {
        if (expandGenRef.current !== myGen) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (expandGenRef.current === myGen) { setLoading(false); setLoadingText(""); }
      }
    },
    [apiKey, loadCachedVerify]
  );

  const runVerify = async (terms: string[]) => {
    setVerifying(true);
    setVerifyMap((prev) => {
      const next = { ...prev };
      terms.forEach((t) => { if (!next[t]) next[t] = "checking"; });
      return next;
    });
    await verifyAll(terms, (index, status, url) => {
      setVerifyMap((prev) => ({ ...prev, [terms[index]]: status }));
      if (url) setVerifyUrlMap((prev) => ({ ...prev, [terms[index]]: url }));
    });
    setVerifying(false);
  };

  const resetVerify = () => { setVerifyMap({}); setVerifyUrlMap({}); };

  const pickDomain = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedL1(""); setSelectedL2("");
    setL2List([]); setL3List([]);
    setError(""); resetVerify();
    setPhase("pick-l1");
  };

  const pickL1 = (l1: string) => {
    expandGenRef.current++;
    setSelectedL1(l1);
    setSelectedL2(""); setL2List([]); setL3List([]);
    setError(""); resetVerify();
    setLoading(false);
    setPhase("pick-l2");
    const subfields = getSubfields(selectedDomain, l1);
    setL2List(subfields);
    loadCachedVerify(subfields);
  };

  const pickL2 = (l2: string) => {
    expandGenRef.current++;
    setSelectedL2(l2);
    setL3List([]);
    setError(""); resetVerify();
    setLoading(false);
    setPhase("view-l3");
    const topics = getTopics(selectedDomain, selectedL1, l2);
    if (topics.length > 0) {
      setL3List(topics);
      loadCachedVerify(topics);
    } else {
      expand(selectedDomain, selectedL1, l2);
    }
  };

  const goTo = (p: Phase) => {
    expandGenRef.current++;
    setError(""); resetVerify();
    setLoading(false);
    setPhase(p);
    if (p === "pick-domain") {
      setSelectedDomain(""); setSelectedL1(""); setSelectedL2("");
      setL2List([]); setL3List([]);
    }
    if (p === "pick-l1") { setSelectedL1(""); setSelectedL2(""); setL2List([]); setL3List([]); }
    if (p === "pick-l2") { setSelectedL2(""); setL3List([]); }
  };

  const domainEntry = OPENALEX_TAXONOMY.find((d) => d.name === selectedDomain);

  const activeList = phase === "pick-l2" ? l2List : l3List;
  const unverifiedCount = activeList.filter((t) => !verifyMap[t]).length;
  const verifiedCount = activeList.filter((t) => verifyMap[t] === "verified").length;
  const uncertainCount = activeList.filter((t) => verifyMap[t] === "uncertain").length;
  const unverifiedFailCount = activeList.filter((t) => verifyMap[t] === "unverified").length;

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button
          onClick={() => goTo("pick-domain")}
          className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
        >
          Omniscience
        </button>

        <nav className="flex items-center gap-1 text-sm text-gray-400 min-w-0 flex-1 mx-6">
          {selectedDomain && (
            <>
              <span className="text-gray-700">/</span>
              <button onClick={() => goTo("pick-l1")} className="hover:text-gray-200 transition-colors truncate max-w-[160px]">
                {selectedDomain}
              </button>
            </>
          )}
          {selectedL1 && (
            <>
              <span className="text-gray-700">/</span>
              <button onClick={() => goTo("pick-l2")} className="hover:text-gray-200 transition-colors truncate max-w-[160px]">
                {selectedL1}
              </button>
            </>
          )}
          {selectedL2 && (
            <>
              <span className="text-gray-700">/</span>
              <span className="text-gray-300 truncate max-w-[160px]">{selectedL2}</span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bookmarks dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowBookmarks((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                bookmarks.size > 0
                  ? "bg-amber-950 hover:bg-amber-900 text-amber-400 border-amber-900"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700"
              }`}
            >
              ★ {bookmarks.size > 0 ? bookmarks.size : "Bookmarks"}
            </button>
            {showBookmarks && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-40 p-2">
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-xs text-gray-400 font-medium">
                    {bookmarks.size > 0 ? `${bookmarks.size} bookmarks` : "No bookmarks yet"}
                  </span>
                  {bookmarks.size > 0 && (
                    <button
                      onClick={() => { setBookmarks(new Set()); localStorage.removeItem("omni_bookmarks"); }}
                      className="text-xs text-red-500 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {bookmarks.size === 0 ? (
                  <p className="text-xs text-gray-600 px-1 py-1">
                    Click ☆ on any topic card to save it here.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto">
                    {[...bookmarks].map((term) => (
                      <div key={term} className="flex items-center justify-between px-2 py-1 hover:bg-gray-800 rounded text-xs">
                        <span className="text-gray-300 truncate">{term}</span>
                        <button
                          onClick={() => toggleBookmark(term)}
                          className="text-gray-600 hover:text-red-400 ml-2 flex-shrink-0 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!confirm("Delete all cached taxonomy, Wikipedia, and Discover results?")) return;
              const keys = Object.keys(localStorage).filter(
                (k) =>
                  k.startsWith("omni_l2::") ||
                  k.startsWith("omni_l3::") ||
                  k.startsWith("omni_wiki::") ||
                  k.startsWith("omni_prereq::") ||
                  k.startsWith("omni_plan::") ||
                  k.startsWith("omni_discover::") ||
                  k.startsWith("omni_wound::") ||
                  k.startsWith("omni_decoder::") ||
                  k.startsWith("omni_chain::") ||
                  k.startsWith("omni_fieldmap_")
              );
              keys.forEach((k) => localStorage.removeItem(k));
              setDifficultyMap({});
              goTo("pick-domain");
            }}
            className="text-xs bg-red-950 hover:bg-red-900 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-900 transition-colors"
            title="Delete all cached taxonomy data"
          >
            Reset Cache
          </button>

          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="sk-ant-… API key"
            className="bg-gray-800 text-xs text-gray-300 placeholder-gray-600 rounded px-3 py-1.5 w-52 outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <button onClick={() => setShowKey((v) => !v)} className="text-xs text-gray-500 hover:text-gray-300">
            {showKey ? "hide" : "show"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 bg-blue-950 border border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-blue-300 text-sm">Generating with Claude Sonnet…</p>
              {loadingText && <p className="text-blue-500 text-xs mt-0.5 font-mono">{loadingText}</p>}
            </div>
          </div>
        )}

        {/* PHASE: pick-domain */}
        {phase === "pick-domain" && (
          <div className="max-w-4xl mx-auto">

            {/* ── Hero: The Map ── */}
            <div
              className="mb-8 rounded-2xl border border-indigo-700/50 bg-gradient-to-br from-indigo-950/80 via-gray-900 to-gray-950 p-7 cursor-pointer hover:border-indigo-600/70 transition-colors group"
              onClick={() => setShowUniversalMap(true)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-indigo-400 text-lg">✦</span>
                <span className="text-[11px] text-indigo-400/70 uppercase tracking-widest font-medium">Prime Feature</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">The Map</h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-2xl">
                The complete architecture of human knowledge — every intellectual root, canonical work, and grand question mapped across all fields and all time.
              </p>

              {/* The Horizon explainer */}
              <div className="mb-5 max-w-2xl rounded-xl border border-rose-900/30 bg-rose-950/10 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-rose-500/70 text-sm">⊙</span>
                  <p className="text-rose-300/80 text-xs font-semibold tracking-wide">New — The Horizon</p>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Every field of knowledge has a question it cannot answer using its own methods — not because we haven't tried hard enough, but because the tools of the field are constitutively unable to reach it. This is its <span className="text-rose-300/60">horizon</span>: always visible, never crossable. On any topic card below, click <span className="text-rose-400/70 font-medium">⊙ The Horizon</span> to see the structural aporia, the hidden metaphor shaping everything the field sees and misses, and every work that honestly confronts the edge.
                </p>
              </div>

              {/* Feature callouts */}
              <div className="grid grid-cols-2 gap-3 mb-5 max-w-2xl">
                <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/30 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-indigo-400 text-sm">◆</span>
                    <p className="text-indigo-200 text-xs font-semibold">Core Ideas</p>
                    <span className="text-[10px] text-indigo-400/40 ml-auto">4 lenses</span>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    <span className="text-indigo-300/70">Root Questions</span>, <span className="text-indigo-300/70">Concepts</span>, <span className="text-indigo-300/70">Methods</span>, and <span className="text-indigo-300/70">Findings</span> — each lens produces a genuinely different map. Click any to trace its full cross-field curriculum.
                  </p>
                </div>
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-amber-400 text-sm">≡</span>
                    <p className="text-amber-200 text-xs font-semibold">The Canon</p>
                    <span className="text-[10px] text-amber-400/40 ml-auto">per sub-field</span>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Pick any sub-field — Abstract Algebra, Quantum Field Theory, Cognitive Science — and get its definitive reading list from introductory to research level. Track what you've read.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-sm text-indigo-300 font-medium group-hover:text-indigo-200 transition-colors">
                Open The Map <span className="text-base">→</span>
              </div>
            </div>

            {/* ── Study Plan Featured Card ── */}
            <div className="mb-5 rounded-2xl border border-blue-700/40 bg-gradient-to-br from-blue-950/50 via-gray-900 to-gray-950 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400 text-lg">↗</span>
                <span className="text-[11px] text-blue-400/70 uppercase tracking-widest font-medium">Study Plan</span>
                <span className="text-[9px] bg-blue-900/50 text-blue-300 border border-blue-700/50 rounded px-1.5 py-0.5 font-semibold ml-1">Rebuilt ✦</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">The Mastery Map</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-2xl">
                A six-part personalised curriculum — from field orientation and prerequisites all the way to the research frontier, deep intellectual themes, and the structural limits of the field. Choose how far you want to go.
              </p>

              {/* Depth options */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { label: "Foundation", sub: "Levels 0–2", highlight: false },
                  { label: "Working Knowledge", sub: "Levels 0–3 · Debates", highlight: false },
                  { label: "Research Depth", sub: "Levels 0–6 · Papers", highlight: false },
                  { label: "Complete Mastery", sub: "All 6 parts", highlight: true },
                ].map((opt) => (
                  <div key={opt.label} className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                    opt.highlight
                      ? "border-blue-600/50 bg-blue-900/20 text-blue-200"
                      : "border-gray-700/50 text-gray-500"
                  }`}>
                    <span className="font-medium">{opt.label}</span>
                    <span className={`text-[10px] ${opt.highlight ? "text-blue-400/60" : "text-gray-700"}`}>{opt.sub}</span>
                  </div>
                ))}
              </div>

              {/* Three new pillars */}
              <div className="grid grid-cols-3 gap-3 mb-4 max-w-2xl">
                <div className="rounded-lg border border-blue-900/30 bg-blue-950/15 px-3 py-2.5">
                  <p className="text-blue-300/70 text-[10px] font-semibold uppercase tracking-wide mb-1">The Great Debates</p>
                  <p className="text-gray-500 text-[11px] leading-relaxed">4–6 live intellectual fault lines where serious practitioners still disagree — with the works representing each camp.</p>
                </div>
                <div className="rounded-lg border border-blue-900/30 bg-blue-950/15 px-3 py-2.5">
                  <p className="text-blue-300/70 text-[10px] font-semibold uppercase tracking-wide mb-1">Capability Milestones</p>
                  <p className="text-gray-500 text-[11px] leading-relaxed">After each level: exactly what you can now do, and a specific diagnostic test before you advance.</p>
                </div>
                <div className="rounded-lg border border-blue-900/30 bg-blue-950/15 px-3 py-2.5">
                  <p className="text-blue-300/70 text-[10px] font-semibold uppercase tracking-wide mb-1">Tacit Knowledge</p>
                  <p className="text-gray-500 text-[11px] leading-relaxed">What every expert in the field knows that no book or paper ever says out loud — the practitioner wisdom no curriculum captures.</p>
                </div>
              </div>

              <p className="text-gray-600 text-xs">Available on every topic card below — click <span className="text-blue-400/60 font-medium">↗ Study Plan</span> on any field or topic to begin.</p>
            </div>

            {/* ── Decoder + Reading Chain Featured Card ── */}
            <div className="mb-5 rounded-2xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/40 via-indigo-950/30 to-gray-950 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cyan-400 text-lg">⬡</span>
                <span className="text-[11px] text-cyan-400/70 uppercase tracking-widest font-medium">Intelligence Tools</span>
                <span className="text-[9px] bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 rounded px-1.5 py-0.5 font-semibold ml-1">New ✦</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">The Decoder + Reading Chain</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-2xl">
                Found an interesting paper? Paste the title — get its exact place in the curriculum, every prerequisite, the intellectual problem it solved, and what it opened up. Then see the full reading spine for that field, with your paper placed at its exact position.
              </p>

              {/* Two-panel workflow */}
              <div className="flex items-stretch gap-0 mb-5 max-w-2xl">
                <div
                  className="flex-1 rounded-l-xl border border-cyan-800/40 bg-cyan-950/20 hover:bg-cyan-950/40 px-4 py-3.5 cursor-pointer transition-colors group"
                  onClick={() => setShowDecoder(true)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-400/80 text-sm">⬡</span>
                    <p className="text-cyan-200 text-xs font-semibold">The Decoder</p>
                  </div>
                  <ul className="space-y-1">
                    {["Curriculum placement (field, level, priority)", "Every prerequisite with one-sentence rationale", "What intellectual gap it filled", "What it made possible after"].map((item) => (
                      <li key={item} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                        <span className="text-cyan-800 mt-0.5 flex-shrink-0">—</span>{item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-cyan-400/50 text-[10px] mt-3 group-hover:text-cyan-400/70 transition-colors font-medium">Decode a Paper →</p>
                </div>

                <div className="flex items-center px-3 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-6 bg-gradient-to-b from-cyan-900/0 via-cyan-700/40 to-indigo-700/40" />
                    <span className="text-gray-700 text-xs">→</span>
                    <div className="w-px h-6 bg-gradient-to-b from-indigo-700/40 via-indigo-700/40 to-indigo-900/0" />
                  </div>
                </div>

                <div className="flex-1 rounded-r-xl border border-indigo-800/40 bg-indigo-950/20 px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-indigo-400/80 text-sm">⬦</span>
                    <p className="text-indigo-200 text-xs font-semibold">Reading Chain</p>
                  </div>
                  <ul className="space-y-1">
                    {["Linear spine from first encounter to mastery", "Each work: what it requires, gives, enables", "Works from any era, language, or field", "Place any paper — see exactly where it fits"].map((item) => (
                      <li key={item} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                        <span className="text-indigo-800 mt-0.5 flex-shrink-0">—</span>{item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-700 text-[10px] mt-3">Available on every topic card → <span className="text-indigo-400/60 font-medium">⬦ Chain</span></p>
                </div>
              </div>

              <p className="text-gray-700 text-xs">Decode a paper to auto-place it in the chain — the two tools connect. <span className="text-gray-600">The Decoder places your paper; the Chain shows the full journey it fits into.</span></p>
            </div>

            {/* ── Field Map Featured Card ── */}
            <div className="mb-5 rounded-2xl border border-teal-800/40 bg-gradient-to-br from-teal-950/40 via-gray-900 to-gray-950 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-teal-400 text-lg">⊞</span>
                <span className="text-[11px] text-teal-400/70 uppercase tracking-widest font-medium">Field Map</span>
                <span className="text-[9px] bg-teal-900/40 text-teal-300 border border-teal-700/40 rounded px-1.5 py-0.5 font-semibold ml-1">New ✦</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">Complete Vertical Decomposition</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-2xl">
                Every subfield has sub-concepts. Field Map generates all of them — then builds a precise reading chain for each one. Not one path through a field: the full map of every path, with every work at every level.
              </p>

              {/* Example decomposition */}
              <div className="mb-5 max-w-2xl">
                <div className="rounded-xl border border-teal-900/30 bg-teal-950/15 px-4 py-3.5">
                  <p className="text-[10px] text-teal-500/60 uppercase tracking-widest font-semibold mb-3">Example — Abstract Algebra</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {[
                      ["Group Theory", "8 works"],
                      ["Ring Theory", "7 works"],
                      ["Field Theory", "6 works"],
                      ["Module Theory", "7 works"],
                      ["Galois Theory", "8 works"],
                      ["Category Theory", "9 works"],
                      ["Homological Algebra", "8 works"],
                      ["Representation Theory", "9 works"],
                    ].map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-teal-700 text-[9px]">▸</span>
                          <span className="text-gray-300 text-[11px]">{name}</span>
                        </div>
                        <span className="text-gray-700 text-[10px] font-mono">{count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-700 text-[10px] mt-3 pt-2 border-t border-teal-900/20">
                    8 reading chains · ~62 works total · streams each chain sequentially
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 max-w-2xl">
                <div className="flex-1 space-y-1.5">
                  {[
                    "Sub-concepts generated in prerequisite order",
                    "Each chain: full Requires → Contributes → Enables per work",
                    "Chains cached — revisit any topic instantly",
                    "Place any paper into any sub-chain via ⬦ Chain",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-teal-700 mt-0.5 flex-shrink-0 text-[10px]">—</span>
                      <p className="text-[11px] text-gray-500">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-gray-700 text-xs mt-4">Available on every topic card below — click <span className="text-teal-500/60 font-medium">⊞ Field Map</span> on any subfield or topic.</p>
            </div>

            {/* ── Secondary features ── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div
                className="rounded-xl border border-violet-800/40 bg-violet-950/30 hover:bg-violet-950/50 p-4 cursor-pointer transition-colors group"
                onClick={() => setShowThematic(true)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-violet-400 text-base">◈</span>
                  <p className="text-violet-200 text-sm font-semibold">Themes &amp; Genealogy</p>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Surface 40+ deep intellectual themes in any field and trace each across all knowledge, or trace the unbroken chain of thinkers that built the field.
                </p>
              </div>

              <div
                className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 hover:bg-emerald-950/50 p-4 cursor-pointer transition-colors group"
                onClick={() => setShowGreatQuestions(true)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-base">?</span>
                  <p className="text-emerald-200 text-sm font-semibold">The Great Questions</p>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  The fundamental questions a field can't stop asking — every angle, every attempt, and why they stay open.
                </p>
              </div>

              <div className="rounded-xl border border-rose-800/40 bg-rose-950/15 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-rose-500/80 text-base">⊙</span>
                  <p className="text-rose-200/80 text-sm font-semibold">The Horizon</p>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Every field has a question it cannot answer using its own methods — always visible, never reachable. The structural limit, the hidden metaphor, every honest confrontation with the edge.
                </p>
              </div>
            </div>

            {/* ── Browse taxonomy ── */}
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Browse the Taxonomy</h3>
                <p className="text-gray-600 text-xs mt-0.5">OpenAlex academic taxonomy — Domain → Field → Subfield → Topic. Topics are static; AI features run on any topic.</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-600">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" /> Explain Me</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" /> Discover</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Wikipedia verify</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OPENALEX_TAXONOMY.map((d) => (
                <button key={d.name} onClick={() => pickDomain(d.name)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl p-4 text-left transition-all group">
                  <p className="font-semibold text-gray-200 group-hover:text-white transition-colors text-sm">{d.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{d.fields.length} fields</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: pick-l1 */}
        {phase === "pick-l1" && domainEntry && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{selectedDomain}</h2>
            <p className="text-gray-500 text-sm mb-6">Pick a field — select a subfield to explore its topics.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {domainEntry.fields.map((f) => (
                <button key={f.name} onClick={() => pickL1(f.name)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-4 text-left transition-all group">
                  <p className="font-semibold text-blue-300 group-hover:text-purple-300 transition-colors">{f.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{f.subfields.length} subfields</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: pick-l2 */}
        {phase === "pick-l2" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold text-white">{selectedL1}</h2>
              {!loading && l2List.length > 0 && (
                <VerifyToolbar
                  total={l2List.length}
                  verifiedCount={verifiedCount}
                  uncertainCount={uncertainCount}
                  unverifiedFailCount={unverifiedFailCount}
                  unverifiedCount={unverifiedCount}
                  verifying={verifying}
                  onVerify={() => runVerify(l2List.filter((t) => !verifyMap[t]))}
                />
              )}
            </div>
            <p className="text-gray-500 text-sm mb-6">Pick a subfield — topics are pre-loaded from the OpenAlex taxonomy.</p>
            {!loading && l2List.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {l2List.map((l2) => (
                  <div key={l2} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <button onClick={() => pickL2(l2)} className="text-left group flex-1 mr-2">
                        <p className="font-semibold text-purple-300 group-hover:text-green-300 transition-colors">
                          {l2} →
                        </p>
                        {difficultyMap[l2] && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border mt-1 inline-block ${LEVEL_BADGE[difficultyMap[l2]] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
                            {difficultyMap[l2]}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleBookmark(l2)}
                          className={`text-base leading-none transition-colors ${bookmarks.has(l2) ? "text-amber-400" : "text-gray-700 hover:text-amber-400"}`}
                          title={bookmarks.has(l2) ? "Remove bookmark" : "Bookmark"}
                        >
                          {bookmarks.has(l2) ? "★" : "☆"}
                        </button>
                        <VerifyBadge status={verifyMap[l2]} url={verifyUrlMap[l2]} />
                      </div>
                    </div>
                    <SearchLinks term={l2} />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => setExplainTarget({ term: l2 })}
                        className="text-xs bg-gray-800 hover:bg-yellow-900 hover:text-yellow-300 text-gray-400 px-2.5 py-1 rounded-lg transition-colors border border-gray-700 hover:border-yellow-700">
                        Explain Me
                      </button>
                      <button onClick={() => setLearningPathTarget({ term: l2 })}
                        className="text-xs bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 hover:text-blue-200 px-3 py-1 rounded-lg transition-colors border border-blue-700/50 hover:border-blue-500 font-medium">
                        ↗ Study Plan
                      </button>
                      <button onClick={() => setDiscoverTarget({ term: l2 })}
                        className="text-xs bg-gray-800 hover:bg-violet-900 hover:text-violet-300 text-gray-400 px-2.5 py-1 rounded-lg transition-colors border border-gray-700 hover:border-violet-700">
                        Discover
                      </button>
                      <button onClick={() => setWoundTarget({ term: l2 })}
                        className="text-xs bg-rose-950/25 hover:bg-rose-950/50 text-rose-400/70 hover:text-rose-300 px-2.5 py-1 rounded-lg transition-colors border border-rose-900/40 hover:border-rose-700/60 font-medium">
                        ⊙ The Horizon
                      </button>
                      <button onClick={() => setChainTarget({ term: l2, domain: selectedDomain, l1: selectedL1 })}
                        className="text-xs bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-400/70 hover:text-indigo-300 px-2.5 py-1 rounded-lg transition-colors border border-indigo-900/40 hover:border-indigo-700/60">
                        ⬦ Chain
                      </button>
                      <button onClick={() => setFieldMapTarget({ term: l2, domain: selectedDomain, l1: selectedL1 })}
                        className="text-xs bg-teal-950/30 hover:bg-teal-900/40 text-teal-500/70 hover:text-teal-300 px-2.5 py-1 rounded-lg transition-colors border border-teal-900/40 hover:border-teal-700/60">
                        ⊞ Field Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && l2List.length === 0 && !error && <p className="text-gray-500">No results yet.</p>}
          </div>
        )}

        {/* PHASE: view-l3 */}
        {phase === "view-l3" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold text-white">{selectedL2}</h2>
              {!loading && l3List.length > 0 && (
                <VerifyToolbar
                  total={l3List.length}
                  verifiedCount={verifiedCount}
                  uncertainCount={uncertainCount}
                  unverifiedFailCount={unverifiedFailCount}
                  unverifiedCount={unverifiedCount}
                  verifying={verifying}
                  onVerify={() => runVerify(l3List.filter((t) => !verifyMap[t]))}
                />
              )}
            </div>
            <p className="text-gray-500 text-sm mb-6">
              <span className="text-purple-400">{selectedL2}</span> · subfield of <span className="text-blue-300">{selectedL1}</span> · <span className="text-gray-600">{selectedDomain}</span>
            </p>
            {!loading && l3List.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {l3List.map((l3) => (
                  <div key={l3} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 mr-2">
                        <p className="font-medium text-gray-100">{l3}</p>
                        {difficultyMap[l3] && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border mt-1 inline-block ${LEVEL_BADGE[difficultyMap[l3]] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
                            {difficultyMap[l3]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleBookmark(l3)}
                          className={`text-base leading-none transition-colors ${bookmarks.has(l3) ? "text-amber-400" : "text-gray-700 hover:text-amber-400"}`}
                          title={bookmarks.has(l3) ? "Remove bookmark" : "Bookmark"}
                        >
                          {bookmarks.has(l3) ? "★" : "☆"}
                        </button>
                        <VerifyBadge status={verifyMap[l3]} url={verifyUrlMap[l3]} />
                      </div>
                    </div>
                    <SearchLinks term={l3} />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => setExplainTarget({ term: l3, l2: selectedL2 })}
                        className="text-xs bg-gray-800 hover:bg-yellow-900 hover:text-yellow-300 text-gray-400 px-2.5 py-1 rounded-lg transition-colors border border-gray-700 hover:border-yellow-700">
                        Explain Me
                      </button>
                      <button onClick={() => setLearningPathTarget({ term: l3, l2: selectedL2 })}
                        className="text-xs bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 hover:text-blue-200 px-3 py-1 rounded-lg transition-colors border border-blue-700/50 hover:border-blue-500 font-medium">
                        ↗ Study Plan
                      </button>
                      <button onClick={() => setDiscoverTarget({ term: l3, l2: selectedL2 })}
                        className="text-xs bg-gray-800 hover:bg-violet-900 hover:text-violet-300 text-gray-400 px-2.5 py-1 rounded-lg transition-colors border border-gray-700 hover:border-violet-700">
                        Discover
                      </button>
                      <button onClick={() => setWoundTarget({ term: l3, l2: selectedL2 })}
                        className="text-xs bg-rose-950/25 hover:bg-rose-950/50 text-rose-400/70 hover:text-rose-300 px-2.5 py-1 rounded-lg transition-colors border border-rose-900/40 hover:border-rose-700/60 font-medium">
                        ⊙ The Horizon
                      </button>
                      <button onClick={() => setChainTarget({ term: l3, domain: selectedDomain, l1: selectedL1, l2: selectedL2 })}
                        className="text-xs bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-400/70 hover:text-indigo-300 px-2.5 py-1 rounded-lg transition-colors border border-indigo-900/40 hover:border-indigo-700/60">
                        ⬦ Chain
                      </button>
                      <button onClick={() => setFieldMapTarget({ term: l3, domain: selectedDomain, l1: selectedL1, l2: selectedL2 })}
                        className="text-xs bg-teal-950/30 hover:bg-teal-900/40 text-teal-500/70 hover:text-teal-300 px-2.5 py-1 rounded-lg transition-colors border border-teal-900/40 hover:border-teal-700/60">
                        ⊞ Field Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && l3List.length === 0 && !error && <p className="text-gray-500">No results yet.</p>}
          </div>
        )}
      </main>

      {explainTarget && (
        <ExplainModal
          term={explainTarget.term}
          domain={selectedDomain}
          l1={selectedL1}
          l2={explainTarget.l2 ?? selectedL2}
          apiKey={apiKey}
          onClose={() => setExplainTarget(null)}
        />
      )}

      {learningPathTarget && (
        <LearningPathModal
          term={learningPathTarget.term}
          domain={selectedDomain}
          l1={selectedL1}
          l2={learningPathTarget.l2}
          apiKey={apiKey}
          onClose={() => setLearningPathTarget(null)}
        />
      )}

      {discoverTarget && (
        <DiscoverModal
          term={discoverTarget.term}
          domain={selectedDomain}
          l1={selectedL1}
          l2={discoverTarget.l2}
          apiKey={apiKey}
          onClose={() => setDiscoverTarget(null)}
        />
      )}
      {showThematic && (
        <ThematicModal apiKey={apiKey} onClose={() => setShowThematic(false)} />
      )}
      {showGreatQuestions && (
        <GreatQuestionsModal apiKey={apiKey} onClose={() => setShowGreatQuestions(false)} />
      )}
      {showUniversalMap && (
        <UniversalMapModal apiKey={apiKey} onClose={() => setShowUniversalMap(false)} />
      )}
      {woundTarget && (
        <WoundModal
          term={woundTarget.term}
          domain={selectedDomain}
          l1={selectedL1}
          l2={woundTarget.l2}
          apiKey={apiKey}
          onClose={() => setWoundTarget(null)}
        />
      )}
      {showDecoder && (
        <DecoderModal
          apiKey={apiKey}
          onClose={() => setShowDecoder(false)}
          onViewChain={(target) => {
            setShowDecoder(false);
            setChainTarget(target);
          }}
        />
      )}
      {chainTarget && (
        <ReadingChainModal
          term={chainTarget.term}
          domain={chainTarget.domain}
          l1={chainTarget.l1}
          l2={chainTarget.l2}
          apiKey={apiKey}
          insertTitle={chainTarget.insertTitle}
          onClose={() => setChainTarget(null)}
        />
      )}
      {fieldMapTarget && (
        <FieldMapModal
          term={fieldMapTarget.term}
          domain={fieldMapTarget.domain}
          l1={fieldMapTarget.l1}
          l2={fieldMapTarget.l2}
          apiKey={apiKey}
          onClose={() => setFieldMapTarget(null)}
        />
      )}
    </div>
  );
}

// ── Verify toolbar ────────────────────────────────────────────────────────────

interface VerifyToolbarProps {
  total: number;
  verifiedCount: number;
  uncertainCount: number;
  unverifiedFailCount: number;
  unverifiedCount: number;
  verifying: boolean;
  onVerify: () => void;
}

function VerifyToolbar({
  total,
  verifiedCount,
  uncertainCount,
  unverifiedFailCount,
  unverifiedCount,
  verifying,
  onVerify,
}: VerifyToolbarProps) {
  const checked = total - unverifiedCount;

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {checked > 0 && (
        <div className="flex items-center gap-2 text-xs">
          {verifiedCount > 0 && (
            <span className="bg-green-900/60 text-green-300 border border-green-700 px-2 py-0.5 rounded">
              ✓ {verifiedCount}
            </span>
          )}
          {uncertainCount > 0 && (
            <span className="bg-yellow-900/60 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded">
              ? {uncertainCount}
            </span>
          )}
          {unverifiedFailCount > 0 && (
            <span className="bg-red-900/60 text-red-400 border border-red-800 px-2 py-0.5 rounded">
              ✗ {unverifiedFailCount}
            </span>
          )}
        </div>
      )}
      <button
        onClick={onVerify}
        disabled={verifying || unverifiedCount === 0}
        className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
      >
        {verifying ? (
          <>
            <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            Verifying…
          </>
        ) : unverifiedCount === 0 ? (
          "All verified"
        ) : (
          `Verify via Wikipedia (${unverifiedCount})`
        )}
      </button>
    </div>
  );
}
