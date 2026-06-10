"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TAXONOMY_SEED } from "@/lib/taxonomy-seed";
import { VerifyStatus, verifyAll } from "@/lib/wikipedia";
import SearchLinks from "@/components/SearchLinks";
import ExplainModal from "@/components/ExplainModal";
import VerifyBadge from "@/components/VerifyBadge";
import LearningPathModal from "@/components/LearningPathModal";
import DiscoverModal from "@/components/DiscoverModal";
import ThematicModal from "@/components/ThematicModal";

type Phase = "pick-domain" | "pick-l1" | "pick-l2" | "view-l3";

interface ExplainTarget { term: string; l2?: string; }
interface LearningPathTarget { term: string; l2?: string; }
interface DiscoverTarget { term: string; l2?: string; }

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
  const [showThematic, setShowThematic] = useState(false);

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
    expand(selectedDomain, l1);
  };

  const pickL2 = (l2: string) => {
    expandGenRef.current++;
    setSelectedL2(l2);
    setL3List([]);
    setError(""); resetVerify();
    setLoading(false);
    setPhase("view-l3");
    expand(selectedDomain, selectedL1, l2);
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

  const seed = TAXONOMY_SEED.find((s) => s.domain === selectedDomain);

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
                  k.startsWith("omni_discover::")
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
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Every field of human knowledge, one click away</h2>
            <p className="text-gray-500 text-sm mb-5">Navigate Domain → Field → Branch → Topic. Claude Sonnet generates everything on demand — nothing is preloaded.</p>

            {/* Feature overview */}
            <div className="mb-7 space-y-2">
              {/* Learning Path — featured */}
              <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-700/40 border border-blue-600/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-300 text-sm">↗</div>
                  <div>
                    <p className="text-blue-200 text-sm font-semibold">Mastermind Study Plan</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">An exhaustive 7-level curriculum for any topic — from absolute prerequisites to the current research frontier. Every book and paper with search links, what each teaches, what you need to know first. Covers Level 0 prerequisites through Level 6 research frontier and the three works that define the field.</p>
                  </div>
                </div>
              </div>

              {/* Thematic Curricula — featured */}
              <div className="bg-violet-950/40 border border-violet-800/50 rounded-xl p-4 cursor-pointer hover:bg-violet-950/60 transition-colors"
                onClick={() => setShowThematic(true)}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-700/40 border border-violet-600/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-violet-300 text-sm">◈</div>
                  <div>
                    <p className="text-violet-200 text-sm font-semibold">Thematic Curricula</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">Trace one deep theme — Symmetry, Entropy, Duality, Infinity — across all of human knowledge. See how it manifests in mathematics, physics, biology, economics, and philosophy, and discover the moments when two fields' versions turned out to be secretly the same thing.</p>
                  </div>
                </div>
              </div>

              {/* Other features — compact row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Explain Me", desc: "Deep beginner explanation for any topic", dot: "bg-yellow-500" },
                  { label: "Discover", desc: "26 ways to explore — origin story, careers, papers, quiz, and more", dot: "bg-violet-500" },
                  { label: "Wikipedia Verified", desc: "Every topic checked — real field or hallucination", dot: "bg-green-500" },
                  { label: "7 Academic Search Links", desc: "Scholar, Semantic Scholar, OpenAlex, CORE, Inciteful, Talpa, WorldCat", dot: "bg-gray-400" },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.dot}`} />
                      <p className="text-gray-200 text-xs font-medium">{f.label}</p>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Select a Domain</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TAXONOMY_SEED.map((s) => (
                <button key={s.domain} onClick={() => pickDomain(s.domain)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-600 rounded-xl p-4 text-left transition-all group">
                  <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{s.domain}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.l1.length} fields</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: pick-l1 */}
        {phase === "pick-l1" && seed && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{selectedDomain}</h2>
            <p className="text-gray-500 text-sm mb-6">Pick a field — Claude will generate its subfields (L2).</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {seed.l1.map((l1) => (
                <button key={l1} onClick={() => pickL1(l1)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-4 text-left transition-all group">
                  <p className="font-semibold text-blue-300 group-hover:text-purple-300 transition-colors">{l1}</p>
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
            <p className="text-gray-500 text-sm mb-6">Pick a subfield — Claude will generate its topics (L3).</p>
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
              Topics in <span className="text-purple-400">{selectedL1}</span> › <span className="text-blue-400">{selectedDomain}</span>
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
        <ThematicModal
          apiKey={apiKey}
          onClose={() => setShowThematic(false)}
          onStudyPlan={(term, domain, l1) => {
            setShowThematic(false);
            setSelectedDomain(domain);
            setSelectedL1(l1);
            setLearningPathTarget({ term });
          }}
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
